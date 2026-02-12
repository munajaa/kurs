
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_123';
const sql = postgres(process.env.NETLIFY_DATABASE_URL, { ssl: 'require' });

// Database Initialization (Implicit Seed)
const initDb = async () => {
  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    first_name TEXT,
    last_name TEXT,
    nickname TEXT,
    phone TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`;
  
  // Update schema if columns don't exist (basic migration)
  try {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE`;
  } catch (e) {
    console.log("Schema already up to date or columns exist.");
  }

  await sql`CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    "order" INTEGER,
    title TEXT,
    description TEXT,
    content TEXT,
    duration TEXT,
    category TEXT
  )`;
  await sql`CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT,
    "productName" TEXT,
    "imageUrl" TEXT,
    "buyLink" TEXT,
    "isWhatsApp" BOOLEAN,
    description TEXT
  )`;
  await sql`CREATE TABLE IF NOT EXISTS useful (
    id TEXT PRIMARY KEY,
    title TEXT,
    category TEXT,
    description TEXT,
    content TEXT,
    images TEXT[]
  )`;
  await sql`CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  )`;
};

exports.handler = async (event, context) => {
  try {
    await initDb();
    const path = event.path.replace(/\.netlify\/functions\/api/, '');
    const method = event.httpMethod;
    const authHeader = event.headers.authorization;
    let currentUser = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        currentUser = jwt.verify(token, JWT_SECRET);
      } catch (e) {}
    }

    // --- PUBLIC ROUTES ---
    if (method === 'GET' && path === '/data') {
      const lessons = await sql`SELECT * FROM lessons ORDER BY "order" ASC`;
      const suppliers = await sql`SELECT * FROM suppliers`;
      const useful = await sql`SELECT * FROM useful`;
      return { 
        statusCode: 200, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessons, suppliers, useful }) 
      };
    }

    if (method === 'GET' && path === '/messages') {
      const messages = await sql`
        SELECT m.*, u.email, u.role, u.nickname 
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        ORDER BY m.created_at ASC 
        LIMIT 50`;
      return { 
        statusCode: 200, 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages) 
      };
    }

    // --- AUTH ROUTES ---
    if (method === 'POST' && path === '/auth/register') {
      const { email, password, firstName, lastName, nickname, phone } = JSON.parse(event.body);
      if (!email || !password) return { statusCode: 400, body: JSON.stringify({ message: 'Nedostaju podaci' }) };
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdmin = email === 'romano.polovic33@gmail.com';
      const role = isAdmin ? 'admin' : 'user';
      const isApproved = isAdmin; // Admin is auto-approved

      try {
        const [user] = await sql`
          INSERT INTO users (email, password, role, first_name, last_name, nickname, phone, is_approved) 
          VALUES (${email}, ${hashedPassword}, ${role}, ${firstName}, ${lastName}, ${nickname}, ${phone}, ${isApproved}) 
          RETURNING id, email, role, first_name as "firstName", last_name as "lastName", nickname, phone, is_approved as "isApproved"`;
        const token = jwt.sign(user, JWT_SECRET);
        return { statusCode: 200, body: JSON.stringify({ user, token }) };
      } catch (e) {
        console.error(e);
        return { statusCode: 400, body: JSON.stringify({ message: 'Email već postoji ili greška u bazi' }) };
      }
    }

    if (method === 'POST' && path === '/auth/login') {
      const { email, password } = JSON.parse(event.body);
      const [user] = await sql`SELECT id, email, password, role, first_name as "firstName", last_name as "lastName", nickname, phone, is_approved as "isApproved" FROM users WHERE email = ${email}`;
      if (user && await bcrypt.compare(password, user.password)) {
        const { password: _, ...userSafe } = user;
        const token = jwt.sign(userSafe, JWT_SECRET);
        return { statusCode: 200, body: JSON.stringify({ user: userSafe, token }) };
      }
      return { statusCode: 401, body: JSON.stringify({ message: 'Pogrešan email ili lozinka' }) };
    }

    if (method === 'GET' && path === '/auth/me') {
      if (!currentUser) return { statusCode: 401, body: 'Unauthorized' };
      // Fetch fresh status from DB to check if they were approved
      const [user] = await sql`SELECT id, email, role, first_name as "firstName", last_name as "lastName", nickname, phone, is_approved as "isApproved" FROM users WHERE id = ${currentUser.id}`;
      return { statusCode: 200, body: JSON.stringify(user) };
    }

    // --- PROTECTED ROUTES ---
    if (!currentUser) return { statusCode: 401, body: 'Unauthorized' };

    if (method === 'POST' && path === '/messages') {
      const { content } = JSON.parse(event.body);
      if (!content || content.length > 500) return { statusCode: 400, body: 'Invalid content' };
      await sql`INSERT INTO messages (user_id, content) VALUES (${currentUser.id}, ${content})`;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    // --- ADMIN ROUTES ---
    if (currentUser.role !== 'admin') return { statusCode: 403, body: 'Forbidden' };

    if (method === 'GET' && path === '/admin/lessons') return { statusCode: 200, body: JSON.stringify(await sql`SELECT * FROM lessons`) };
    if (method === 'GET' && path === '/admin/suppliers') return { statusCode: 200, body: JSON.stringify(await sql`SELECT * FROM suppliers`) };
    if (method === 'GET' && path === '/admin/users') return { statusCode: 200, body: JSON.stringify(await sql`SELECT id, email, role, first_name as "firstName", last_name as "lastName", nickname, phone, is_approved as "isApproved" FROM users`) };
    if (method === 'GET' && path === '/admin/useful') return { statusCode: 200, body: JSON.stringify(await sql`SELECT * FROM useful`) };
    
    if (method === 'POST' && path.startsWith('/admin/users/approve/')) {
      const id = path.split('/').pop();
      await sql`UPDATE users SET is_approved = NOT is_approved WHERE id = ${id}`;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    if (method === 'DELETE' && path.startsWith('/admin/')) {
      const parts = path.split('/');
      const table = parts[2];
      const id = parts[3];
      const allowedTables = ['lessons', 'suppliers', 'users', 'useful'];
      if (!allowedTables.includes(table)) return { statusCode: 400, body: 'Invalid table' };
      
      await sql`DELETE FROM ${sql(table)} WHERE id = ${id}`;
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 404, body: 'Not Found' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error', details: err.message }) };
  }
};
