
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'flipzone_ultra_secret_2026';
const DB_URL = 'postgresql://neondb_owner:npg_9KFgPWvHqJO8@ep-fragrant-mud-aecb46z9-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-action',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  },
  body: JSON.stringify(body)
});

let sql;
const getSql = () => {
  if (!sql) {
    sql = postgres(DB_URL, { 
      ssl: 'require',
      connect_timeout: 15,
      idle_timeout: 20,
      max: 10
    });
  }
  return sql;
};

// Automatska sinkronizacija tablica
const syncDatabase = async (db) => {
  try {
    await db`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      nickname TEXT,
      is_approved BOOLEAN DEFAULT FALSE,
      completed_lessons TEXT[] DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await db`CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      "order" INTEGER,
      title TEXT,
      description TEXT,
      content TEXT,
      duration TEXT,
      category TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await db`CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT,
      product_name TEXT,
      image_url TEXT,
      buy_link TEXT,
      is_whatsapp BOOLEAN DEFAULT FALSE,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await db`CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      date TEXT,
      title TEXT,
      message TEXT,
      tag TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await db`CREATE TABLE IF NOT EXISTS useful_items (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      category TEXT,
      content TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await db`CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'public',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await db`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    // Inicijalni kanali
    const chs = await db`SELECT count(*) FROM channels`;
    if (parseInt(chs[0].count) === 0) {
      await db`INSERT INTO channels (id, name, type) VALUES ('general', '👋 Opcenito', 'public'), ('trgovina', '💰 Trgovina', 'public')`;
    }
  } catch (err) { console.error("Sync error", err); }
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  if (event.httpMethod === 'OPTIONS') return jsonResponse(200, { message: 'OK' });

  try {
    const db = getSql();
    await syncDatabase(db);

    const path = event.path.replace(/^\/(\.netlify\/functions\/api|api)/, '') || '/';
    const method = event.httpMethod;
    const authHeader = event.headers.authorization;
    let currentUser = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try { currentUser = jwt.verify(authHeader.split(' ')[1], JWT_SECRET); } catch (e) {}
    }

    // --- JAVNE RUTE ---
    if (method === 'POST' && path.includes('/auth/register')) {
      const { email, password, nickname } = JSON.parse(event.body);
      const mail = email.toLowerCase().trim();
      const hashed = await bcrypt.hash(password, 10);
      const isAdmin = mail === 'romano.polovic33@gmail.com';
      const [user] = await db`INSERT INTO users (email, password, nickname, role, is_approved) VALUES (${mail}, ${hashed}, ${nickname}, ${isAdmin ? 'admin' : 'user'}, ${isAdmin}) RETURNING id, email, nickname, role, is_approved as "isApproved"`;
      return jsonResponse(200, { user, token: jwt.sign(user, JWT_SECRET) });
    }

    if (method === 'POST' && path.includes('/auth/login')) {
      const { email, password } = JSON.parse(event.body);
      const [user] = await db`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}`;
      if (user && await bcrypt.compare(password, user.password)) {
        const { password: _, is_approved, ...safe } = user;
        safe.isApproved = is_approved;
        return jsonResponse(200, { user: safe, token: jwt.sign(safe, JWT_SECRET) });
      }
      return jsonResponse(401, { message: 'Neispravni podaci.' });
    }

    if (method === 'GET' && path === '/data') {
      const lessons = await db`SELECT * FROM lessons ORDER BY "order" ASC`;
      const suppliers = await db`SELECT * FROM suppliers ORDER BY created_at DESC`;
      const announcements = await db`SELECT * FROM announcements ORDER BY created_at DESC`;
      const useful = await db`SELECT * FROM useful_items ORDER BY created_at DESC`;
      return jsonResponse(200, { lessons, suppliers, announcements, useful });
    }

    // --- ZAŠTIĆENE RUTE ---
    if (!currentUser) return jsonResponse(401, { message: 'Niste prijavljeni.' });

    if (method === 'GET' && path.includes('/auth/me')) {
      const [user] = await db`SELECT id, email, role, nickname, is_approved as "isApproved", completed_lessons FROM users WHERE id = ${currentUser.id}`;
      return jsonResponse(200, user);
    }

    // Chat Logic
    if (path.startsWith('/chat/channels')) return jsonResponse(200, await db`SELECT * FROM channels`);
    if (path.startsWith('/chat/messages/')) {
      const chId = path.split('/').pop();
      if (method === 'GET') {
        return jsonResponse(200, await db`SELECT m.*, u.nickname, u.role FROM messages m JOIN users u ON m.user_id = u.id WHERE m.channel_id = ${chId} ORDER BY m.created_at ASC LIMIT 100`);
      }
      if (method === 'POST') {
        const { content } = JSON.parse(event.body);
        await db`INSERT INTO messages (channel_id, user_id, content) VALUES (${chId}, ${currentUser.id}, ${content})`;
        return jsonResponse(200, { success: true });
      }
    }

    // --- ADMIN RUTE ---
    if (currentUser.role === 'admin') {
      if (path.includes('/admin/users')) {
        if (method === 'GET') return jsonResponse(200, await db`SELECT id, email, nickname, role, is_approved as "isApproved" FROM users ORDER BY created_at DESC`);
        if (path.includes('/approve/')) {
          const uId = path.split('/').pop();
          await db`UPDATE users SET is_approved = NOT is_approved WHERE id = ${uId}`;
          return jsonResponse(200, { success: true });
        }
      }

      const tableKey = path.split('/')[2];
      const tableMap = { lessons: 'lessons', suppliers: 'suppliers', announcements: 'announcements', useful: 'useful_items' };
      const table = tableMap[tableKey];

      if (table) {
        if (method === 'POST') {
          const body = JSON.parse(event.body);
          if (!body.id) body.id = Math.random().toString(36).substring(2, 9);
          await db`INSERT INTO ${db(table)} ${db(body)}`;
          return jsonResponse(200, { success: true });
        }
        if (method === 'PUT') {
          const id = path.split('/').pop();
          const body = JSON.parse(event.body);
          delete body.id;
          await db`UPDATE ${db(table)} SET ${db(body)} WHERE id = ${id}`;
          return jsonResponse(200, { success: true });
        }
        if (method === 'DELETE') {
          const id = path.split('/').pop();
          await db`DELETE FROM ${db(table)} WHERE id = ${id}`;
          return jsonResponse(200, { success: true });
        }
      }
    }

    return jsonResponse(404, { message: 'Not found' });
  } catch (err) {
    return jsonResponse(500, { message: err.message });
  }
};
