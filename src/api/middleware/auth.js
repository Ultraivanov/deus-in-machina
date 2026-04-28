// Authentication middleware
// DSR v0.2.0 Enterprise Foundation

import jwt from 'jsonwebtoken';
import { pool } from '../../db/config.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dsr-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

// Generate tokens
export function generateTokens(user) {
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  
  const refreshToken = jwt.sign(
    { 
      userId: user.id,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
  
  return { accessToken, refreshToken };
}

// Verify access token
export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Verify refresh token
export function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

// Middleware: Require authentication
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        code: 'AUTH_MISSING_TOKEN'
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);
    
    // Fetch user from DB to ensure still exists and active
    const result = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        code: 'AUTH_USER_NOT_FOUND'
      });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      code: 'AUTH_INVALID_TOKEN',
      message: error.message
    });
  }
}

// Middleware: Require organization membership
export function requireOrgMember(roles = []) {
  return async (req, res, next) => {
    try {
      const orgId = req.params.orgId || req.body.orgId || req.query.orgId;
      
      if (!orgId) {
        return res.status(400).json({
          error: 'Bad Request',
          code: 'ORG_ID_REQUIRED'
        });
      }
      
      const result = await pool.query(
        `SELECT role, status FROM organization_members 
         WHERE organization_id = $1 AND user_id = $2`,
        [orgId, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(403).json({
          error: 'Forbidden',
          code: 'ORG_ACCESS_DENIED'
        });
      }
      
      const membership = result.rows[0];
      
      if (membership.status !== 'active') {
        return res.status(403).json({
          error: 'Forbidden',
          code: 'ORG_MEMBERSHIP_NOT_ACTIVE'
        });
      }
      
      if (roles.length > 0 && !roles.includes(membership.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          code: 'INSUFFICIENT_ROLE'
        });
      }
      
      req.orgRole = membership.role;
      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Internal Server Error',
        code: 'ORG_CHECK_FAILED'
      });
    }
  };
}
