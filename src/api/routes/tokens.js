// Tokens API routes
// DSR v0.2.0 Enterprise Foundation

import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db/config.js';
import { requireAuth, requireOrgMember } from '../middleware/auth.js';

const router = Router({ mergeParams: true });

// Validation schemas
const tokenSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  category: z.enum(['color', 'typography', 'spacing', 'sizing', 'border', 'shadow', 'other']),
  value: z.string().min(1).max(500),
  valueType: z.enum(['string', 'number', 'color', 'boolean']).default('string'),
  role: z.string().max(100).optional(),
  scale: z.string().max(50).optional(),
  state: z.string().max(50).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  workspaceId: z.string().uuid().optional()
});

// GET /api/v1/orgs/:orgId/tokens - List tokens
router.get('/', requireAuth, requireOrgMember(), async (req, res) => {
  try {
    const { orgId } = req.params;
    const { 
      workspaceId, 
      category, 
      status = 'active',
      search,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = `
      SELECT t.*, 
             w.name as workspace_name,
             u.email as created_by_email
      FROM tokens t
      LEFT JOIN workspaces w ON t.workspace_id = w.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.organization_id = $1
    `;
    const params = [orgId];
    let paramCount = 1;
    
    if (workspaceId) {
      paramCount++;
      query += ` AND t.workspace_id = $${paramCount}`;
      params.push(workspaceId);
    }
    
    if (category) {
      paramCount++;
      query += ` AND t.category = $${paramCount}`;
      params.push(category);
    }
    
    if (status) {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      params.push(status);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (t.name ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }
    
    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM (${query}) as count_query`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    // Add pagination
    query += ` ORDER BY t.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
      tokens: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + result.rows.length
      }
    });
  } catch (error) {
    console.error('List tokens error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'FETCH_TOKENS_FAILED'
    });
  }
});

// GET /api/v1/orgs/:orgId/tokens/:tokenId - Get token details
router.get('/:tokenId', requireAuth, requireOrgMember(), async (req, res) => {
  try {
    const { orgId, tokenId } = req.params;
    
    const result = await pool.query(
      `SELECT t.*, 
              w.name as workspace_name,
              cb.email as created_by_email,
              ub.email as updated_by_email
       FROM tokens t
       LEFT JOIN workspaces w ON t.workspace_id = w.id
       LEFT JOIN users cb ON t.created_by = cb.id
       LEFT JOIN users ub ON t.updated_by = ub.id
       WHERE t.id = $1 AND t.organization_id = $2`,
      [tokenId, orgId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        code: 'TOKEN_NOT_FOUND'
      });
    }
    
    res.json({ token: result.rows[0] });
  } catch (error) {
    console.error('Get token error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'FETCH_TOKEN_FAILED'
    });
  }
});

// POST /api/v1/orgs/:orgId/tokens - Create token
router.post('/', requireAuth, requireOrgMember(['admin', 'owner']), async (req, res) => {
  try {
    const { orgId } = req.params;
    const data = tokenSchema.parse(req.body);
    
    // Verify workspace belongs to org if specified
    if (data.workspaceId) {
      const wsCheck = await pool.query(
        'SELECT id FROM workspaces WHERE id = $1 AND organization_id = $2',
        [data.workspaceId, orgId]
      );
      if (wsCheck.rows.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          code: 'INVALID_WORKSPACE'
        });
      }
    }
    
    const result = await pool.query(
      `INSERT INTO tokens (
        organization_id, workspace_id, name, slug, category,
        value, value_type, role, scale, state, description,
        tags, metadata, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        orgId,
        data.workspaceId || null,
        data.name,
        data.slug,
        data.category,
        data.value,
        data.valueType,
        data.role || null,
        data.scale || null,
        data.state || null,
        data.description || null,
        JSON.stringify(data.tags),
        JSON.stringify(data.metadata),
        req.user.id
      ]
    );
    
    res.status(201).json({ token: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation Error',
        code: 'VALIDATION_FAILED',
        details: error.errors
      });
    }
    
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        error: 'Conflict',
        code: 'TOKEN_SLUG_EXISTS',
        message: 'Token with this slug already exists in workspace'
      });
    }
    
    console.error('Create token error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'CREATE_TOKEN_FAILED'
    });
  }
});

// PATCH /api/v1/orgs/:orgId/tokens/:tokenId - Update token
router.patch('/:tokenId', requireAuth, requireOrgMember(['admin', 'owner']), async (req, res) => {
  try {
    const { orgId, tokenId } = req.params;
    const updates = req.body;
    
    // Build dynamic update
    const allowedFields = ['name', 'value', 'value_type', 'role', 'scale', 'state', 'description', 'tags', 'metadata', 'status'];
    const setClauses = [];
    const values = [];
    let paramCount = 0;
    
    for (const [key, value] of Object.entries(updates)) {
      const dbKey = key.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);
      if (allowedFields.includes(dbKey)) {
        paramCount++;
        setClauses.push(`${dbKey} = $${paramCount}`);
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }
    
    if (setClauses.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        code: 'NO_VALID_UPDATES'
      });
    }
    
    paramCount++;
    values.push(req.user.id); // updated_by
    setClauses.push(`updated_by = $${paramCount}`);
    
    paramCount++;
    values.push(tokenId);
    paramCount++;
    values.push(orgId);
    
    const result = await pool.query(
      `UPDATE tokens SET ${setClauses.join(', ')}
       WHERE id = $${paramCount - 1} AND organization_id = $${paramCount}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        code: 'TOKEN_NOT_FOUND'
      });
    }
    
    res.json({ token: result.rows[0] });
  } catch (error) {
    console.error('Update token error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'UPDATE_TOKEN_FAILED'
    });
  }
});

// DELETE /api/v1/orgs/:orgId/tokens/:tokenId - Delete (soft) token
router.delete('/:tokenId', requireAuth, requireOrgMember(['admin', 'owner']), async (req, res) => {
  try {
    const { orgId, tokenId } = req.params;
    
    const result = await pool.query(
      `UPDATE tokens SET status = 'deleted', updated_by = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND organization_id = $2
       RETURNING id`,
      [tokenId, orgId, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        code: 'TOKEN_NOT_FOUND'
      });
    }
    
    res.json({ message: 'Token deleted successfully' });
  } catch (error) {
    console.error('Delete token error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      code: 'DELETE_TOKEN_FAILED'
    });
  }
});

export default router;
