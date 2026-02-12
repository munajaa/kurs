
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
      connect_timeout: 10,
      idle_timeout: 20,
      max: 10,
      onnotice: () => {} // Suppress notices
    });
  }
  return sql;
};

// Automatsko kreiranje svih potrebnih tablica (Automated Table Upload/Setup)
const initDb = async (db) => {
  try {
    // 1. Users Table
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
    
    // 2. Profits Table
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

    // 3. Channels Table
    await db`CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'public',
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    // 4. Messages Table
    await db`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;

    // 5. Lessons Table
    await db`CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      "order" INTEGER,
      title TEXT,
      description TEXT,
      content TEXT,
      duration TEXT,
      category TEXT
    )`;

    // 6. Suppliers Table
    await db`CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT,
      product_name TEXT,
      image_url TEXT,
      buy_link TEXT,
      is_whatsapp BOOLEAN DEFAULT FALSE,
      description TEXT
    )`;

    // 7. Announcements Table
    await db`CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      date TEXT,
      title TEXT,
      message TEXT,
      tag TEXT,
      image_url TEXT
    )`;

    // 8. Useful Items Table
    await db`CREATE TABLE IF NOT EXISTS useful_items (
      id TEXT PRIMARY KEY,
      title TEXT,
      description TEXT,
      category TEXT,
      content TEXT,
      images TEXT[]
    )`;

    // Osiguravanje inicijalnih kanala
    const existingChannels = await db`SELECT id FROM channels WHERE type = 'public' LIMIT 1`;
    if (existingChannels.length === 0) {
      await db`INSERT INTO channels (id, name, type) VALUES 
        ('opcenito', '👋 Opcenito', 'public'),
        ('trgovina', '💰 Trgovina i Scale', 'public'),
        ('resursi', '📚 Dijeljenje Resursa', 'public'),
        ('pitanja', '❓ Q&A Podrška', 'public'),
        ('showcase', '📸 Rezultati', 'public'),
        ('market', '📉 Tržišni Trendovi', 'public')`;
    }
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  if (event.httpMethod === 'OPTIONS') return jsonResponse(200, { message: 'OK' });

  try {
    const db = getSql();
    await initDb(db);

    const fullPath = event.path;
    const path = fullPath.replace(/^\/(\.netlify\/functions\/api|api)/, '') || '/';
    const method = event.httpMethod;
    const authHeader = event.headers.authorization;
    let currentUser = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        currentUser = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        // Ignoriraj nevažeći token
      }
    }

    // --- AUTH RUTE ---

    // REGISTRACIJA (POPRAVLJENO)
    if (method === 'POST' && (path === '/auth/register' || path === '/auth/register/')) {
      const body = JSON.parse(event.body);
      const { email, password, firstName, lastName, nickname, phone } = body;
      
      if (!email || !password || !nickname) {
        return jsonResponse(400, { message: 'Email, lozinka i nadimak su obavezni.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      
      // 1. Provjera postoji li već korisnik
      const [existingUser] = await db`SELECT id FROM users WHERE email = ${normalizedEmail}`;
      if (existingUser) {
        return jsonResponse(400, { message: 'Korisnik s ovim e-mailom već postoji.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdmin = normalizedEmail === 'romano.polovic33@gmail.com';

      try {
        const [newUser] = await db`
          INSERT INTO users (
            email, password, role, first_name, last_name, nickname, phone, is_approved
          ) VALUES (
            ${normalizedEmail}, ${hashedPassword}, ${isAdmin ? 'admin' : 'user'}, 
            ${firstName || ''}, ${lastName || ''}, ${nickname}, ${phone || ''}, ${isAdmin}
          ) 
          RETURNING id, email, role, nickname, is_approved as "isApproved", completed_lessons
        `;
        
        const token = jwt.sign(newUser, JWT_SECRET);
        return jsonResponse(200, { user: newUser, token });
      } catch (e) { 
        console.error("Greška pri unosu u bazu:", e);
        return jsonResponse(500, { message: 'Neuspješna registracija. Pokušajte ponovno.', details: e.message }); 
      }
    }

    // PRIJAVA (POPRAVLJENO)
    if (method === 'POST' && (path === '/auth/login' || path === '/auth/login/')) {
      const { email, password } = JSON.parse(event.body);
      
      if (!email || !password) {
        return jsonResponse(400, { message: 'Email i lozinka su obavezni.' });
      }
      
      const normalizedEmail = email.trim().toLowerCase();
      const [user] = await db`SELECT * FROM users WHERE email = ${normalizedEmail}`;

      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          const { password: _, is_approved, ...userSafe } = user;
          userSafe.isApproved = is_approved;
          userSafe.completed_lessons = user.completed_lessons || [];
          const token = jwt.sign(userSafe, JWT_SECRET);
          return jsonResponse(200, { user: userSafe, token });
        }
      }
      return jsonResponse(401, { message: 'Pogrešan e-mail ili lozinka.' });
    }

    // VERIFIKACIJA KORISNIKA
    if (method === 'GET' && (path === '/auth/me' || path === '/auth/me/')) {
      if (!currentUser) return jsonResponse(401, { message: 'Niste prijavljeni.' });
      const [user] = await db`SELECT id, email, role, nickname, is_approved as "isApproved", completed_lessons FROM users WHERE id = ${currentUser.id}`;
      if (!user) return jsonResponse(404, { message: 'Korisnik nije pronađen.' });
      return jsonResponse(200, user);
    }

    // --- DATA RUTE ---

    if (method === 'GET' && (path === '/data' || path === '/data/')) {
      const lessons = await db`SELECT * FROM lessons ORDER BY "order" ASC`;
      const suppliers = await db`SELECT * FROM suppliers ORDER BY id ASC`;
      const announcements = await db`SELECT * FROM announcements ORDER BY date DESC`;
      const useful = await db`SELECT * FROM useful_items ORDER BY id ASC`;
      const [stats] = await db`SELECT (SELECT COUNT(*) FROM users) as users, 
                                      (SELECT COUNT(*) FROM lessons) as lessons, 
                                      (SELECT COUNT(*) FROM suppliers) as suppliers`;
      return jsonResponse(200, { lessons, suppliers, announcements, useful, stats });
    }

    // --- PROFIT RUTE ---

    if (method === 'GET' && (path === '/user/profits' || path === '/user/profits/')) {
      if (!currentUser) return jsonResponse(401, { message: 'Niste autorizirani.' });
      const data = await db`SELECT * FROM profits WHERE user_id = ${currentUser.id} ORDER BY created_at DESC`;
      return jsonResponse(200, data);
    }

    if (method === 'POST' && (path === '/user/profits' || path === '/user/profits/')) {
      if (!currentUser) return jsonResponse(401, { message: 'Niste autorizirani.' });
      const { itemName, buyPrice, sellPrice, costs } = JSON.parse(event.body);
      const netProfit = sellPrice - buyPrice - costs;
      const [entry] = await db`INSERT INTO profits (user_id, item_name, buy_price, sell_price, costs, net_profit) VALUES (${currentUser.id}, ${itemName}, ${buyPrice}, ${sellPrice}, ${costs}, ${netProfit}) RETURNING *`;
      return jsonResponse(200, entry);
    }

    if (method === 'DELETE' && path.startsWith('/user/profits/')) {
      if (!currentUser) return jsonResponse(401, { message: 'Niste autorizirani.' });
      const profitId = path.split('/').pop();
      await db`DELETE FROM profits WHERE id = ${profitId} AND user_id = ${currentUser.id}`;
      return jsonResponse(200, { success: true });
    }

    // --- PROGRESS RUTE ---

    if (method === 'POST' && (path === '/user/lessons/complete' || path === '/user/lessons/complete/')) {
      if (!currentUser) return jsonResponse(401, { message: 'Niste autorizirani.' });
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

    // --- CHAT RUTE ---

    if (method === 'GET' && path.startsWith('/chat/channels')) {
      if (!currentUser) return jsonResponse(401, { message: 'Niste autorizirani.' });
      let channels;
      if (currentUser.role === 'admin') {
        channels = await db`SELECT c.*, u.nickname FROM channels c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.type ASC, c.created_at DESC`;
      } else {
        channels = await db`SELECT c.*, u.nickname FROM channels c LEFT JOIN users u ON c.user_id = u.id WHERE c.type = 'public' OR c.user_id = ${currentUser.id} ORDER BY c.type ASC, c.created_at DESC`;
      }
      return jsonResponse(200, channels);
    }

    if (method === 'GET' && path.startsWith('/chat/messages/')) {
      const channelId = path.split('/').pop();
      const msgs = await db`SELECT m.*, u.nickname, u.role, u.email FROM messages m JOIN users u ON m.user_id = u.id WHERE m.channel_id = ${channelId} ORDER BY m.created_at ASC LIMIT 100`;
      return jsonResponse(200, msgs);
    }

    if (method === 'POST' && path.startsWith('/chat/messages/')) {
      if (!currentUser) return jsonResponse(401, { message: 'Niste autorizirani.' });
      const channelId = path.split('/').pop();
      const { content } = JSON.parse(event.body);
      await db`INSERT INTO messages (channel_id, user_id, content) VALUES (${channelId}, ${currentUser.id}, ${content})`;
      return jsonResponse(200, { success: true });
    }

    if (method === 'POST' && (path === '/chat/tickets' || path === '/chat/tickets/')) {
      if (!currentUser) return jsonResponse(401, { message: 'Niste autorizirani.' });
      const ticketId = 'ticket-' + Math.random().toString(36).substring(2, 9);
      const [ticket] = await db`INSERT INTO channels (id, name, type, user_id) VALUES (${ticketId}, ${'Ticket: ' + (currentUser.nickname || currentUser.email.split('@')[0])}, 'ticket', ${currentUser.id}) RETURNING *`;
      return jsonResponse(200, ticket);
    }

    // --- ADMIN RUTE ---

    if (currentUser?.role === 'admin') {
      if (method === 'GET' && path === '/admin/users') {
        const users = await db`SELECT * FROM users ORDER BY created_at DESC`;
        return jsonResponse(200, users.map(u => ({...u, isApproved: u.is_approved, firstName: u.first_name, lastName: u.last_name})));
      }
      if (method === 'POST' && path.startsWith('/admin/users/approve/')) {
        const id = path.split('/').pop();
        await db`UPDATE users SET is_approved = NOT is_approved WHERE id = ${id}`;
        return jsonResponse(200, { success: true });
      }
      
      const tables = ['lessons', 'suppliers', 'announcements', 'useful'];
      const parts = path.split('/');
      const table = parts[2];
      if (tables.includes(table)) {
        const realTable = table === 'useful' ? 'useful_items' : table;
        if (method === 'GET') {
          const data = await db`SELECT * FROM ${db(realTable)} ORDER BY id ASC`;
          return jsonResponse(200, data);
        }
        if (method === 'POST') {
          const body = JSON.parse(event.body);
          if (!body.id) body.id = Math.random().toString(36).substring(2, 9);
          await db`INSERT INTO ${db(realTable)} ${db(body)}`;
          return jsonResponse(200, { success: true });
        }
        if (method === 'PUT') {
          const id = parts[3];
          const body = JSON.parse(event.body);
          delete body.id;
          await db`UPDATE ${db(realTable)} SET ${db(body)} WHERE id = ${id}`;
          return jsonResponse(200, { success: true });
        }
        if (method === 'DELETE') {
          const id = parts[3];
          await db`DELETE FROM ${db(realTable)} WHERE id = ${id}`;
          return jsonResponse(200, { success: true });
        }
      }
    }

    return jsonResponse(404, { message: 'Putanja nije pronađena.' });
  } catch (err) {
    console.error("API GREŠKA:", err);
    return jsonResponse(500, { message: 'Pogreška na poslužitelju.', details: err.message });
  }
};
