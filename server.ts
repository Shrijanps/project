import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import { db, User, Property, PredictionRecord } from './server/db.js';
import {
  hashPassword,
  generateToken,
  authenticate,
  optionalAuth,
  requireAdmin,
  AuthRequest
} from './server/auth.js';
import {
  predictKNN,
  predictKNNViaPython,
  getModelMetadata,
  FeatureInput
} from './server/knn.js';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // --------------------------------------------------------------------------
  // HEALTH CHECK
  // --------------------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    try {
      const propCount = (db.prepare('SELECT COUNT(*) as count FROM properties').get() as any).count;
      const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
      res.json({
        status: 'healthy',
        database: 'connected',
        properties_count: propCount,
        users_count: userCount,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ status: 'unhealthy', error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // AUTHENTICATION & SECURE SETUP ROUTES
  // --------------------------------------------------------------------------
  const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'estate_admin_master_setup_key_2026';

  // 1. User & Admin Registration
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const accountRole = role === 'admin' ? 'admin' : 'user';
    const passwordHash = hashPassword(password);
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(name.trim(), cleanEmail, passwordHash, accountRole);
    const newUser = {
      id: Number(info.lastInsertRowid),
      name: name.trim(),
      email: cleanEmail,
      role: accountRole as 'admin' | 'user',
      created_at: new Date().toISOString()
    };

    const token = generateToken(newUser);
    res.status(201).json({ 
      user: newUser, 
      token,
      message: accountRole === 'admin' 
        ? 'Administrator account successfully registered and activated.' 
        : 'User account successfully registered and activated.'
    });
  });

  // 2. Secure Administrator Setup (Also accepts setup_key if used)
  app.post('/api/auth/admin-setup', (req, res) => {
    const { name, email, password, setup_key } = req.body;

    if (setup_key && setup_key.trim() !== ADMIN_SETUP_KEY) {
      return res.status(403).json({ 
        error: 'Access Denied: Invalid Master Setup Key.' 
      });
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Administrator name must be at least 2 characters.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = hashPassword(password);
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'admin')
    `);
    const info = stmt.run(name.trim(), cleanEmail, passwordHash);
    const newAdmin = {
      id: Number(info.lastInsertRowid),
      name: name.trim(),
      email: cleanEmail,
      role: 'admin' as const,
      created_at: new Date().toISOString()
    };

    const token = generateToken(newAdmin);
    res.status(201).json({ 
      user: newAdmin, 
      token, 
      message: 'Administrator account successfully provisioned.' 
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as User | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const computedHash = hashPassword(password);
    if (computedHash !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    };

    const token = generateToken(safeUser);
    res.json({ user: safeUser, token });
  });

  app.get('/api/auth/me', authenticate, (req: AuthRequest, res) => {
    const user = db.prepare(`
      SELECT 
        u.id, u.name, u.email, u.role, u.created_at,
        (SELECT COUNT(*) FROM properties WHERE created_by = u.id) as properties_count,
        (SELECT COUNT(*) FROM predictions WHERE user_id = u.id) as predictions_count
      FROM users u 
      WHERE u.id = ?
    `).get(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user });
  });

  // Update own information (Keep own profile updated)
  app.put('/api/auth/me', authenticate, (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const { name, email, currentPassword, newPassword } = req.body;

    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!currentUser) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    let updatedName = currentUser.name;
    let updatedEmail = currentUser.email;
    let updatedPasswordHash = currentUser.password_hash;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters.' });
      }
      updatedName = name.trim();
    }

    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes('@')) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
      const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(cleanEmail, userId);
      if (existing) {
        return res.status(400).json({ error: 'This email address is already in use by another account.' });
      }
      updatedEmail = cleanEmail;
    }

    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters.' });
      }
      if (currentPassword) {
        const currentHash = hashPassword(currentPassword);
        if (currentHash !== currentUser.password_hash) {
          return res.status(400).json({ error: 'Current password is incorrect.' });
        }
      }
      updatedPasswordHash = hashPassword(newPassword);
    }

    db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, password_hash = ?
      WHERE id = ?
    `).run(updatedName, updatedEmail, updatedPasswordHash, userId);

    const safeUser = {
      id: currentUser.id,
      name: updatedName,
      email: updatedEmail,
      role: currentUser.role,
      created_at: currentUser.created_at
    };

    const token = generateToken(safeUser);
    res.json({ 
      user: safeUser, 
      token, 
      message: 'Your personal information has been successfully updated.' 
    });
  });

  app.get('/api/auth/users', authenticate, requireAdmin, (req: AuthRequest, res) => {
    const users = db.prepare(`
      SELECT 
        u.id, u.name, u.email, u.role, u.created_at,
        (SELECT COUNT(*) FROM properties WHERE created_by = u.id) as properties_count,
        (SELECT COUNT(*) FROM predictions WHERE user_id = u.id) as predictions_count
      FROM users u
      ORDER BY u.id ASC
    `).all();
    res.json({ users });
  });

  // 3. Provision New Administrator (Authenticated Admin Operation)
  app.post('/api/auth/users/create-admin', authenticate, requireAdmin, (req: AuthRequest, res) => {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = hashPassword(password);
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, 'admin')
    `);
    const info = stmt.run(name.trim(), cleanEmail, passwordHash);
    const newAdmin = {
      id: Number(info.lastInsertRowid),
      name: name.trim(),
      email: cleanEmail,
      role: 'admin' as const,
      created_at: new Date().toISOString()
    };

    res.status(201).json({ 
      user: newAdmin, 
      message: `Administrator account for ${newAdmin.name} provisioned successfully.` 
    });
  });

  // 4. Update User Role (Promote / Demote)
  app.put('/api/auth/users/:id/role', authenticate, requireAdmin, (req: AuthRequest, res) => {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (role !== 'admin' && role !== 'user') {
      return res.status(400).json({ error: "Invalid role. Role must be 'admin' or 'user'." });
    }

    if (targetUserId === req.user!.id && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot revoke your own administrator role.' });
    }

    const existingUser = db.prepare('SELECT id, name, role FROM users WHERE id = ?').get(targetUserId) as any;
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, targetUserId);
    res.json({ 
      message: `User ${existingUser.name} role updated to ${role}.`,
      user_id: targetUserId,
      role 
    });
  });

  // --------------------------------------------------------------------------
  // PROPERTIES CRUD ROUTES
  // --------------------------------------------------------------------------
  app.get('/api/properties', (req, res) => {
    try {
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
      const offset = (page - 1) * limit;

      const search = req.query.search ? String(req.query.search).trim() : '';
      const minPrice = req.query.min_price ? parseFloat(String(req.query.min_price)) : null;
      const maxPrice = req.query.max_price ? parseFloat(String(req.query.max_price)) : null;
      const bedrooms = req.query.bedrooms ? parseInt(String(req.query.bedrooms), 10) : null;
      const bathrooms = req.query.bathrooms ? parseInt(String(req.query.bathrooms), 10) : null;
      const hasGarden = req.query.has_garden !== undefined && req.query.has_garden !== '' ? parseInt(String(req.query.has_garden), 10) : null;
      const hasPool = req.query.has_pool !== undefined && req.query.has_pool !== '' ? parseInt(String(req.query.has_pool), 10) : null;

      const allowedSortCols = ['id', 'price', 'square_feet', 'year_built', 'location_score', 'distance_to_center'];
      const sortBy = allowedSortCols.includes(String(req.query.sort_by)) ? String(req.query.sort_by) : 'id';
      const sortOrder = String(req.query.sort_order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const conditions: string[] = [];
      const params: any[] = [];

      if (search) {
        if (!isNaN(Number(search))) {
          conditions.push('(p.id = ? OR p.price BETWEEN ? AND ?)');
          const num = Number(search);
          params.push(num, num * 0.9, num * 1.1);
        } else {
          conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
          params.push(`%${search}%`, `%${search}%`);
        }
      }

      if (minPrice !== null && !isNaN(minPrice)) {
        conditions.push('p.price >= ?');
        params.push(minPrice);
      }
      if (maxPrice !== null && !isNaN(maxPrice)) {
        conditions.push('p.price <= ?');
        params.push(maxPrice);
      }
      if (bedrooms !== null && !isNaN(bedrooms)) {
        conditions.push('p.num_bedrooms = ?');
        params.push(bedrooms);
      }
      if (bathrooms !== null && !isNaN(bathrooms)) {
        conditions.push('p.num_bathrooms = ?');
        params.push(bathrooms);
      }
      if (hasGarden !== null && (hasGarden === 0 || hasGarden === 1)) {
        conditions.push('p.has_garden = ?');
        params.push(hasGarden);
      }
      if (hasPool !== null && (hasPool === 0 || hasPool === 1)) {
        conditions.push('p.has_pool = ?');
        params.push(hasPool);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countRow = db.prepare(`
        SELECT COUNT(*) as count 
        FROM properties p
        LEFT JOIN users u ON p.created_by = u.id
        ${whereClause}
      `).get(...params) as any;
      const total = countRow.count;

      const properties = db.prepare(`
        SELECT 
          p.*,
          u.name as creator_name
        FROM properties p
        LEFT JOIN users u ON p.created_by = u.id
        ${whereClause}
        ORDER BY p.${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?
      `).all(...params, limit, offset);

      res.json({
        properties,
        total,
        page,
        total_pages: Math.ceil(total / limit),
        limit
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/properties/stats', (req, res) => {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_properties,
          ROUND(AVG(price), 2) as avg_price,
          ROUND(MIN(price), 2) as min_price,
          ROUND(MAX(price), 2) as max_price,
          ROUND(AVG(square_feet), 2) as avg_square_feet,
          ROUND(AVG(num_bedrooms), 1) as avg_bedrooms,
          ROUND(AVG(num_bathrooms), 1) as avg_bathrooms,
          ROUND(AVG(year_built), 0) as avg_year_built,
          ROUND(AVG(location_score), 2) as avg_location_score,
          SUM(has_garden) as total_with_garden,
          SUM(has_pool) as total_with_pool
        FROM properties
      `).get() as any;

      // Calculate approximate median price
      const count = stats.total_properties;
      const medianRow = db.prepare(`
        SELECT price FROM properties ORDER BY price ASC LIMIT 1 OFFSET ?
      `).get(Math.floor(count / 2)) as any;

      stats.median_price = medianRow ? Math.round(medianRow.price * 100) / 100 : 0;

      res.json({ stats });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/properties/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid property ID.' });
    }

    const prop = db.prepare(`
      SELECT p.*, u.name as creator_name
      FROM properties p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(id);

    if (!prop) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    res.json({ property: prop });
  });

  app.post('/api/properties', authenticate, (req: AuthRequest, res) => {
    try {
      const {
        square_feet,
        num_bedrooms,
        num_bathrooms,
        num_floors,
        year_built,
        has_garden,
        has_pool,
        garage_size,
        location_score,
        distance_to_center,
        price
      } = req.body;

      if (!square_feet || square_feet <= 0) return res.status(400).json({ error: 'Valid square_feet is required (> 0).' });
      if (num_bedrooms === undefined || num_bedrooms < 0) return res.status(400).json({ error: 'Valid num_bedrooms is required (>= 0).' });
      if (num_bathrooms === undefined || num_bathrooms < 0) return res.status(400).json({ error: 'Valid num_bathrooms is required (>= 0).' });
      if (num_floors === undefined || num_floors < 1) return res.status(400).json({ error: 'Valid num_floors is required (>= 1).' });
      if (!year_built || year_built < 1800 || year_built > 2030) return res.status(400).json({ error: 'Valid year_built between 1800 and 2030 is required.' });
      if (price === undefined || price <= 0) return res.status(400).json({ error: 'Valid price is required (> 0).' });

      const stmt = db.prepare(`
        INSERT INTO properties (
          square_feet, num_bedrooms, num_bathrooms, num_floors, year_built,
          has_garden, has_pool, garage_size, location_score, distance_to_center,
          price, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const info = stmt.run(
        Number(square_feet),
        Number(num_bedrooms),
        Number(num_bathrooms),
        Number(num_floors),
        Number(year_built),
        has_garden ? 1 : 0,
        has_pool ? 1 : 0,
        Number(garage_size || 0),
        Number(location_score || 5.0),
        Number(distance_to_center || 5.0),
        Number(price),
        req.user!.id
      );

      const createdProperty = db.prepare(`
        SELECT p.*, u.name as creator_name
        FROM properties p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.id = ?
      `).get(info.lastInsertRowid);

      res.status(201).json({ property: createdProperty, message: 'Property created successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/properties/:id', authenticate, (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid property ID.' });
      }

      const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(id) as Property | undefined;
      if (!existing) {
        return res.status(404).json({ error: 'Property not found.' });
      }

      // Check permission: admin or creator
      if (req.user!.role !== 'admin' && existing.created_by !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized to modify this property.' });
      }

      const {
        square_feet,
        num_bedrooms,
        num_bathrooms,
        num_floors,
        year_built,
        has_garden,
        has_pool,
        garage_size,
        location_score,
        distance_to_center,
        price
      } = req.body;

      const stmt = db.prepare(`
        UPDATE properties SET
          square_feet = ?,
          num_bedrooms = ?,
          num_bathrooms = ?,
          num_floors = ?,
          year_built = ?,
          has_garden = ?,
          has_pool = ?,
          garage_size = ?,
          location_score = ?,
          distance_to_center = ?,
          price = ?
        WHERE id = ?
      `);

      stmt.run(
        square_feet !== undefined ? Number(square_feet) : existing.square_feet,
        num_bedrooms !== undefined ? Number(num_bedrooms) : existing.num_bedrooms,
        num_bathrooms !== undefined ? Number(num_bathrooms) : existing.num_bathrooms,
        num_floors !== undefined ? Number(num_floors) : existing.num_floors,
        year_built !== undefined ? Number(year_built) : existing.year_built,
        has_garden !== undefined ? (has_garden ? 1 : 0) : existing.has_garden,
        has_pool !== undefined ? (has_pool ? 1 : 0) : existing.has_pool,
        garage_size !== undefined ? Number(garage_size) : existing.garage_size,
        location_score !== undefined ? Number(location_score) : existing.location_score,
        distance_to_center !== undefined ? Number(distance_to_center) : existing.distance_to_center,
        price !== undefined ? Number(price) : existing.price,
        id
      );

      const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
      res.json({ property: updated, message: 'Property updated successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/properties/:id', authenticate, (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid property ID.' });
      }

      const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(id) as Property | undefined;
      if (!existing) {
        return res.status(404).json({ error: 'Property not found.' });
      }

      // Check permission: admin or creator
      if (req.user!.role !== 'admin' && existing.created_by !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized to delete this property.' });
      }

      db.prepare('DELETE FROM properties WHERE id = ?').run(id);
      res.json({ message: `Property #${id} deleted successfully.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // PREDICTION API
  // --------------------------------------------------------------------------
  app.post('/api/predict', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const body = req.body as FeatureInput & { engine?: 'node' | 'python' };
      const customK = body.k ? Number(body.k) : undefined;

      let predictionResult;
      if (body.engine === 'python') {
        predictionResult = await predictKNNViaPython(body, customK);
      } else {
        predictionResult = predictKNN(body, customK);
      }

      // Save prediction record into SQLite database
      const userId = req.user ? req.user.id : null;
      const insertStmt = db.prepare(`
        INSERT INTO predictions (
          user_id, input_features, predicted_price, selected_model, k_value, distance_metric
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      const info = insertStmt.run(
        userId,
        JSON.stringify(predictionResult.input_features),
        predictionResult.predicted_price,
        predictionResult.model_name,
        predictionResult.k_used,
        predictionResult.metric
      );

      res.json({
        ...predictionResult,
        prediction_id: Number(info.lastInsertRowid),
        saved_to_history: true
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/predictions', authenticate, (req: AuthRequest, res) => {
    try {
      let query = `
        SELECT 
          p.id, p.user_id, p.input_features, p.predicted_price,
          p.selected_model, p.k_value, p.distance_metric, p.created_at,
          u.name as user_name, u.email as user_email
        FROM predictions p
        LEFT JOIN users u ON p.user_id = u.id
      `;
      const params: any[] = [];

      // Non-admins only see their own predictions
      if (req.user!.role !== 'admin') {
        query += ' WHERE p.user_id = ?';
        params.push(req.user!.id);
      }

      query += ' ORDER BY p.id DESC LIMIT 100;';

      const rows = db.prepare(query).all(...params) as PredictionRecord[];
      const parsedRows = rows.map((r) => {
        let features = {};
        try {
          features = JSON.parse(r.input_features);
        } catch {
          features = {};
        }
        return {
          ...r,
          input_features: features
        };
      });

      res.json({ predictions: parsedRows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/predictions/:id', authenticate, (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid prediction ID.' });

      const existing = db.prepare('SELECT user_id FROM predictions WHERE id = ?').get(id) as any;
      if (!existing) return res.status(404).json({ error: 'Prediction not found.' });

      if (req.user!.role !== 'admin' && existing.user_id !== req.user!.id) {
        return res.status(403).json({ error: 'Unauthorized to delete this prediction.' });
      }

      db.prepare('DELETE FROM predictions WHERE id = ?').run(id);
      res.json({ message: 'Prediction deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --------------------------------------------------------------------------
  // MODEL METRICS & RETRAINING API
  // --------------------------------------------------------------------------
  app.get('/api/model/info', (req, res) => {
    try {
      const metadata = getModelMetadata();
      res.json({ model_info: metadata });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/model/retrain', authenticate, requireAdmin, (req: AuthRequest, res) => {
    const pyProcess = spawn('python3', ['ml/train_model.py']);
    let stdout = '';
    let stderr = '';

    pyProcess.stdout.on('data', (d) => { stdout += d.toString(); });
    pyProcess.stderr.on('data', (d) => { stderr += d.toString(); });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        return res.status(500).json({ error: `Retraining failed with exit code ${code}: ${stderr}` });
      }
      try {
        const updatedMetadata = getModelMetadata();
        res.json({
          message: 'Model retrained and evaluated successfully.',
          metrics: updatedMetadata.metrics,
          best_k: updatedMetadata.best_k,
          output: stdout
        });
      } catch (e: any) {
        res.json({ message: 'Retraining completed, but error reading metadata', output: stdout });
      }
    });
  });

  // --------------------------------------------------------------------------
  // VITE MIDDLEWARE (DEV) / STATIC SERVING (PROD)
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Real Estate ML Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
