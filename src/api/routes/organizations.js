// Organization routes
// DSR v0.2.0 Enterprise Foundation

import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db/config.js';
import { requireAuth, requireOrgMember } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member')
});

// GET /api/v1/orgs - List user's organizations
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.name, o.slug, o.billing_plan, o.created_at,
              om.role, om.status, om.joined_at
       FROM organizations o
       JOIN organization_members om ON o.id = om.organization_id
       WHERE om.user_id = $1 AND om.status = 'active'
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    
    res.json({ organizations: result.rows });
  } catch (error) {
    console.error('List orgs error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'FETCH_ORGS_FAILED'
    });
  }
});

// GET /api/v1/orgs/:orgId - Get organization details
router.get('/:orgId', requireAuth, requireOrgMember(), async (req, res) => {
  try {
    const { orgId } = req.params;
    
    const orgResult = await pool.query(
      `SELECT id, name, slug, billing_plan, max_users, max_workspaces, max_tokens,
              created_at, updated_at
       FROM organizations WHERE id = $1`,
      [orgId]
    );
    
    if (orgResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        code: 'ORG_NOT_FOUND'
      });
    }
    
    // Get member count
    const memberCountResult = await pool.query(
      `SELECT COUNT(*) as count FROM organization_members 
       WHERE organization_id = $1 AND status = 'active'`,
      [orgId]
    );
    
    res.json({
      organization: orgResult.rows[0],
      memberCount: parseInt(memberCountResult.rows[0].count),
      yourRole: req.orgRole
    });
  } catch (error) {
    console.error('Get org error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'FETCH_ORG_FAILED'
    });
  }
});

// GET /api/v1/orgs/:orgId/members - List organization members
router.get('/:orgId/members', requireAuth, requireOrgMember(), async (req, res) => {
  try {
    const { orgId } = req.params;
    
    const result = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.avatar_url,
              om.role, om.status, om.invited_at, om.joined_at
       FROM users u
       JOIN organization_members om ON u.id = om.user_id
       WHERE om.organization_id = $1
       ORDER BY om.joined_at DESC NULLS LAST`,
      [orgId]
    );
    
    res.json({ members: result.rows });
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'FETCH_MEMBERS_FAILED'
    });
  }
});

// POST /api/v1/orgs/:orgId/invite - Invite user to organization
router.post('/:orgId/invite', requireAuth, requireOrgMember(['owner', 'admin']), async (req, res) => {
  try {
    const { orgId } = req.params;
    const data = inviteSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );
    
    if (existingUser.rows.length > 0) {
      const userId = existingUser.rows[0].id;
      
      // Check if already a member
      const existingMember = await pool.query(
        'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [orgId, userId]
      );
      
      if (existingMember.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          code: 'ALREADY_MEMBER'
        });
      }
      
      // Add as member
      await pool.query(
        `INSERT INTO organization_members (organization_id, user_id, role, status, invited_by, invited_at)
         VALUES ($1, $2, $3, 'active', $4, CURRENT_TIMESTAMP)`,
        [orgId, userId, data.role, req.user.id]
      );
    } else {
      // Create pending invitation (simplified - in production, send email)
      // For now, we just store the invitation
      // In production: generate token, send email with invite link
      return res.status(400).json({
        error: 'Bad Request',
        code: 'USER_NOT_FOUND',
        message: 'User must register first before being invited'
      });
    }
    
    res.status(201).json({
      message: 'User invited successfully',
      email: data.email,
      role: data.role
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        code: 'VALIDATION_FAILED',
        details: error.errors
      });
    }
    
    console.error('Invite error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'INVITE_FAILED'
    });
  }
});

// PATCH /api/v1/orgs/:orgId/members/:userId - Update member role
router.patch('/:orgId/members/:userId', requireAuth, requireOrgMember(['owner']), async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        code: 'INVALID_ROLE'
      });
    }
    
    // Cannot modify own role (owner must transfer ownership properly)
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Bad Request',
        code: 'CANNOT_MODIFY_SELF'
      });
    }
    
    const result = await pool.query(
      `UPDATE organization_members 
       SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE organization_id = $2 AND user_id = $3
       RETURNING *`,
      [role, orgId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        code: 'MEMBER_NOT_FOUND'
      });
    }
    
    res.json({
      message: 'Member role updated',
      member: result.rows[0]
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'UPDATE_MEMBER_FAILED'
    });
  }
});

// DELETE /api/v1/orgs/:orgId/members/:userId - Remove member
router.delete('/:orgId/members/:userId', requireAuth, requireOrgMember(['owner', 'admin']), async (req, res) => {
  try {
    const { orgId, userId } = req.params;
    
    // Cannot remove self through this endpoint
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Bad Request',
        code: 'CANNOT_REMOVE_SELF'
      });
    }
    
    // Admins cannot remove owners
    const targetMember = await pool.query(
      'SELECT role FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    
    if (targetMember.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        code: 'MEMBER_NOT_FOUND'
      });
    }
    
    if (targetMember.rows[0].role === 'owner' && req.orgRole !== 'owner') {
      return res.status(403).json({
        error: 'Forbidden',
        code: 'CANNOT_REMOVE_OWNER'
      });
    }
    
    await pool.query(
      'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'REMOVE_MEMBER_FAILED'
    });
  }
});

export default router;
