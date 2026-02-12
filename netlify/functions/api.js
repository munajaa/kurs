
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'flipzone_balkan_secret_2026_secure_key';
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
      max: 10,
      onnotice: () => {}
    });
  }
  return sql;
};

// Automatska inicijalizacija baze s početnim podacima
const syncDatabase = async (db) => {
  try {
    // 1. Tablica Korisnika
    await db`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      first_name TEXT,
      last_name TEXT,
      nickname TEXT,
      phone TEXT,
      is_approved BOOLEAN DEFAULT FALSE,
      completed_lessons TEXT[] DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    // 2. Tablice Sadržaja
    await db`CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      "order" INTEGER,
      title TEXT,
      description TEXT,
      content TEXT,
      duration TEXT,
      category TEXT
    )`;

    await db`CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT,
      product_name TEXT,
      image_url TEXT,
      buy_link TEXT,
      is_whatsapp BOOLEAN DEFAULT FALSE,
      description TEXT
    )`;

    await db`CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      date TEXT,
      title TEXT,
      message TEXT,
      tag TEXT,
      image_url TEXT
    )`;

    await db`CREATE TABLE IF NOT EXISTS useful_items (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      category TEXT,
      content TEXT,
      images TEXT[]
    )`;

    // 3. Tablice Chata i Profita
    await db`CREATE TABLE IF NOT EXISTS profits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      buy_price DECIMAL(10,2) NOT NULL,
      sell_price DECIMAL(10,2) NOT NULL,
      costs DECIMAL(10,2) DEFAULT 0,
      net_profit DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await db`CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'public',
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    await db`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    // Punjenje početnim podacima ako su tablice prazne
    const lessonsCount = await db`SELECT count(*) FROM lessons`;
    if (parseInt(lessonsCount[0].count) === 0) {
      // Ovdje bi išao INSERT za tvoje lekcije iz lessons.ts
      // Dodajemo barem jednu testnu lekciju
      await db`INSERT INTO lessons (id, "order", title, description, content, duration, category) VALUES 
      ('intro', 0, 'Uvod – FlipZone Master Program', 'Dobrodošli u ozbiljan reselling.', 'Sadržaj uvodne lekcije...', '5 min', 'Uvod')`;
    }

    const channelExists = await db`SELECT id FROM channels WHERE id = 'opcenito'`;
    if (channelExists.length === 0) {
      await db`INSERT INTO channels (id, name, type) VALUES 
        ('opcenito', '👋 Opcenito', 'public'),
        ('trgovina', '💰 Trgovina i Scale', 'public'),
        ('resursi', '📚 Dijeljenje Resursa', 'public')`;
    }
  } catch (err) {
    console.error("DB Sync Error:", err);
  }
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
      try {
        currentUser = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      } catch (e) {}
    }

    // --- AUTENTIFIKACIJA ---
    if (method === 'POST' && path.includes('/auth/register')) {
      const { email, password, firstName, lastName, nickname, phone } = JSON.parse(event.body);
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await db`SELECT id FROM users WHERE email = ${normalizedEmail}`;
      if (existing.length > 0) return jsonResponse(400, { message: 'Email već postoji.' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdmin = normalizedEmail === 'romano.polovic33@gmail.com';

      const [user] = await db`
        INSERT INTO users (email, password, role, first_name, last_name, nickname, phone, is_approved) 
        VALUES (${normalizedEmail}, ${hashedPassword}, ${isAdmin ? 'admin' : 'user'}, ${firstName || ''}, ${lastName || ''}, ${nickname}, ${phone || ''}, ${isAdmin}) 
        RETURNING id, email, role, nickname, is_approved as "isApproved", completed_lessons
      `;
      const token = jwt.sign(user, JWT_SECRET);
      return jsonResponse(200, { user, token });
    }

    if (method === 'POST' && path.includes('/auth/login')) {
      const { email, password } = JSON.parse(event.body);
      const normalizedEmail = email.trim().toLowerCase();
      const [user] = await db`SELECT * FROM users WHERE email = ${normalizedEmail}`;
      if (user && await bcrypt.compare(password, user.password)) {
        const { password: _, is_approved, ...userSafe } = user;
        userSafe.isApproved = is_approved;
        userSafe.completed_lessons = user.completed_lessons || [];
        const token = jwt.sign(userSafe, JWT_SECRET);
        return jsonResponse(200, { user: userSafe, token });
      }
      return jsonResponse(401, { message: 'Pogrešan email ili lozinka.' });
    }

    if (method === 'GET' && path.includes('/auth/me')) {
      if (!currentUser) return jsonResponse(401, { message: 'Unauthorized' });
      const [user] = await db`SELECT id, email, role, nickname, is_approved as "isApproved", completed_lessons FROM users WHERE id = ${currentUser.id}`;
      return jsonResponse(200, user);
    }

    // --- JAVNI PODACI ---
    if (method === 'GET' && path === '/data') {
      const lessons = await db`SELECT * FROM lessons ORDER BY "order" ASC`;
      const suppliers = await db`SELECT * FROM suppliers ORDER BY id ASC`;
      const announcements = await db`SELECT * FROM announcements ORDER BY date DESC`;
      const useful = await db`SELECT * FROM useful_items ORDER BY id ASC`;
      return jsonResponse(200, { lessons, suppliers, announcements, useful });
    }

    // --- CHAT I PROFIT (ZAHTIJEVAJU TOKEN) ---
    if (!currentUser) return jsonResponse(401, { message: 'Pristup odbijen.' });

    // Chat
    if (method === 'GET' && path.startsWith('/chat/channels')) {
      const channels = currentUser.role === 'admin' 
        ? await db`SELECT c.*, u.nickname FROM channels c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.type ASC, c.created_at DESC`
        : await db`SELECT c.*, u.nickname FROM channels c LEFT JOIN users u ON c.user_id = u.id WHERE c.type = 'public' OR c.user_id = ${currentUser.id} ORDER BY c.type ASC, c.created_at DESC`;
      return jsonResponse(200, channels);
    }

    if (method === 'GET' && path.startsWith('/chat/messages/')) {
      const channelId = path.split('/').pop();
      const msgs = await db`SELECT m.*, u.nickname, u.role FROM messages m JOIN users u ON m.user_id = u.id WHERE m.channel_id = ${channelId} ORDER BY m.created_at ASC LIMIT 100`;
      return jsonResponse(200, msgs);
    }

    if (method === 'POST' && path.startsWith('/chat/messages/')) {
      const channelId = path.split('/').pop();
      const { content } = JSON.parse(event.body);
      await db`INSERT INTO messages (channel_id, user_id, content) VALUES (${channelId}, ${currentUser.id}, ${content})`;
      return jsonResponse(200, { success: true });
    }

    if (method === 'POST' && path.includes('/chat/tickets')) {
      const ticketId = 'ticket-' + Math.random().toString(36).substring(2, 9);
      const [ticket] = await db`INSERT INTO channels (id, name, type, user_id) VALUES (${ticketId}, ${'Podrška: ' + (currentUser.nickname || currentUser.email)}, 'ticket', ${currentUser.id}) RETURNING *`;
      return jsonResponse(200, ticket);
    }

    // --- ADMIN RUTE ---
    if (currentUser.role === 'admin') {
      // Korisnici
      if (method === 'GET' && path.includes('/admin/users')) {
        const users = await db`SELECT id, email, role, nickname, is_approved as "isApproved", created_at FROM users ORDER BY created_at DESC`;
        return jsonResponse(200, users);
      }
      if (method === 'POST' && path.startsWith('/admin/users/approve/')) {
        const id = path.split('/').pop();
        await db`UPDATE users SET is_approved = NOT is_approved WHERE id = ${id}`;
        return jsonResponse(200, { success: true });
      }

      // CRUD za sadržaj
      const parts = path.split('/');
      const tableType = parts[2]; // lessons, suppliers, etc.
      const tableMap = { lessons: 'lessons', suppliers: 'suppliers', announcements: 'announcements', useful: 'useful_items' };
      const tableName = tableMap[tableType];

      if (tableName) {
        if (method === 'GET') return jsonResponse(200, await db`SELECT * FROM ${db(tableName)} ORDER BY id ASC`);
        if (method === 'POST') {
          const body = JSON.parse(event.body);
          if (!body.id) body.id = Math.random().toString(36).substring(2, 9);
          await db`INSERT INTO ${db(tableName)} ${db(body)}`;
          return jsonResponse(200, { success: true });
        }
        if (method === 'PUT') {
          const id = parts[3];
          const body = JSON.parse(event.body);
          delete body.id;
          await db`UPDATE ${db(tableName)} SET ${db(body)} WHERE id = ${id}`;
          return jsonResponse(200, { success: true });
        }
        if (method === 'DELETE') {
          const id = parts[3];
          await db`DELETE FROM ${db(tableName)} WHERE id = ${id}`;
          return jsonResponse(200, { success: true });
        }
      }
    }

    // Progress
    if (method === 'POST' && path === '/user/lessons/complete') {
      const { lessonId } = JSON.parse(event.body);
      const action = event.headers['x-action'];
      if (action === 'remove') {
        await db`UPDATE users SET completed_lessons = array_remove(completed_lessons, ${lessonId}) WHERE id = ${currentUser.id}`;
      } else {
        await db`UPDATE users SET completed_lessons = array_append(completed_lessons, ${lessonId}) WHERE id = ${currentUser.id} AND NOT (${lessonId} = ANY(completed_lessons))`;
      }
      const [user] = await db`SELECT completed_lessons FROM users WHERE id = ${currentUser.id}`;
      return jsonResponse(200, { completed_lessons: user.completed_lessons });
    }

    // Profits
    if (method === 'GET' && path === '/user/profits') {
      const data = await db`SELECT * FROM profits WHERE user_id = ${currentUser.id} ORDER BY created_at DESC`;
      return jsonResponse(200, data);
    }
    if (method === 'POST' && path === '/user/profits') {
      const { itemName, buyPrice, sellPrice, costs } = JSON.parse(event.body);
      const [entry] = await db`INSERT INTO profits (user_id, item_name, buy_price, sell_price, costs, net_profit) VALUES (${currentUser.id}, ${itemName}, ${buyPrice}, ${sellPrice}, ${costs}, ${sellPrice - buyPrice - costs}) RETURNING *`;
      return jsonResponse(200, entry);
    }

    return jsonResponse(404, { message: 'Not Found' });
  } catch (err) {
    console.error("Critical API Error:", err);
    return jsonResponse(500, { message: 'Greška na serveru.', details: err.message });
  }
};
