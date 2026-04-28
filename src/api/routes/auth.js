// Authentication routes
// DSR v0.2.0 Enterprise Foundation

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { pool } from '../../db/config.js';
import { generateTokens, verifyRefreshToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const SALT_ROUNDS = 10;

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  orgName: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Conflict',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    
    // Generate org slug
    const orgSlug = data.orgName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check if slug exists
    const existingOrg = await pool.query(
      'SELECT id FROM organizations WHERE slug = $1',
      [orgSlug]
    );
    
    let finalSlug = orgSlug;
    if (existingOrg.rows.length > 0) {
      finalSlug = `${orgSlug}-${Date.now().toString(36).slice(-4)}`;
    }
    
    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create organization
      const orgResult = await client.query(
        `INSERT INTO organizations (name, slug, billing_plan, max_users, max_workspaces, max_tokens)
         VALUES ($1, $2, 'free', 5, 3, 1000)
         RETURNING id`,
        [data.orgName, finalSlug]
      );
      const orgId = orgResult.rows[0].id;
      
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, first_name, last_name, created_at`,
        [data.email, passwordHash, data.firstName || null, data.lastName || null]
      );
      const user = userResult.rows[0];
      
      // Add user as owner
      await client.query(
        `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
         VALUES ($1, $2, 'owner', 'active', CURRENT_TIMESTAMP)`,
        [orgId, user.id]
      );
      
      await client.query('COMMIT');
      
      // Generate tokens
      const tokens = generateTokens(user);
      
      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          createdAt: user.created_at
        },
        organization: {
          id: orgId,
          name: data.orgName,
          slug: finalSlug
        },
        tokens
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        code: 'VALIDATION_FAILED',
        details: error.errors
      });
    }
    
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'REGISTRATION_FAILED'
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    
    // Find user
    const userResult = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, email_verified_at FROM users WHERE email = $1',
      [data.email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Get user's organizations
    const orgsResult = await pool.query(
      `SELECT o.id, o.name, o.slug, om.role 
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = $1 AND om.status = 'active'`,
      [user.id]
    );
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: !!user.email_verified_at
      },
      organizations: orgsResult.rows,
      tokens
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        code: 'VALIDATION_FAILED',
        details: error.errors
      });
    }
    
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'LOGIN_FAILED'
    });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }
    
    const decoded = verifyRefreshToken(refreshToken);
    
    // Fetch user to ensure still exists
    const userResult = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Unauthorized',
        code: 'USER_NOT_FOUND'
      });
    }
    
    const user = userResult.rows[0];
    const tokens = generateTokens(user);
    
    res.json({ tokens });
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'INVALID_REFRESH_TOKEN',
      message: error.message
    });
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req, res) => {
  // In a more advanced implementation, we'd blacklist the token
  // For now, just return success - client should discard tokens
  res.json({ message: 'Logged out successfully' });
});

// GET /api/v1/auth/me - Get current user
router.get('/me', requireAuth, async (req, res) => {
  try {
    // Get user's organizations
    const orgsResult = await pool.query(
      `SELECT o.id, o.name, o.slug, om.role 
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = $1 AND om.status = 'active'`,
      [req.user.id]
    );
    
    res.json({
      user: req.user,
      organizations: orgsResult.rows
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'FETCH_USER_FAILED'
    });
  }
});

export default router;
