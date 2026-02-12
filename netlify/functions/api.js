
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'flipzone_balkan_secret_2026_secure_key';
// Connection string direktno ugrađen prema zahtjevu korisnika
const DB_URL = 'postgresql://neondb_owner:npg_9KFgPWvHqJO8@ep-fragrant-mud-aecb46z9-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  },
  body: JSON.stringify(body)
});

let sql;

const getSql = () => {
  if (!sql) {
    sql = postgres(DB_URL, { 
      ssl: 'require',
      connect_timeout: 20,
      idle_timeout: 30,
      max: 5 
    });
  }
  return sql;
};

const initDb = async (db) => {
  try {
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
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;
    await db`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      content TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;
    await db`CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      "order" INTEGER,
      title TEXT,
      description TEXT,
      content TEXT,
      duration TEXT,
      category TEXT
    )`;
  } catch (err) {
    // Tiho ignoriramo greške inicijalizacije ako tablice već postoje
  }
};

exports.handler = async (event, context) => {
  // Isključujemo check-ove okruženja radi brzine
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
      } catch (e) {}
    }

    // STATUS
    if (path === '/status' || path === '/status/') {
      return jsonResponse(200, { status: "online", db: "connected" });
    }

    // LESSONS DATA
    if (method === 'GET' && (path === '/data' || path === '/data/')) {
      const lessons = await db`SELECT * FROM lessons ORDER BY "order" ASC`;
      return jsonResponse(200, { lessons: lessons || [] });
    }

    // AUTH - REGISTER
    if (method === 'POST' && (path === '/auth/register' || path === '/auth/register/')) {
      const { email, password, firstName, lastName, nickname, phone } = JSON.parse(event.body);
      if (!email || !password) return jsonResponse(400, { message: 'Email i lozinka su obavezni.' });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdmin = email.toLowerCase() === 'romano.polovic33@gmail.com';
      
      try {
        const [user] = await db`
          INSERT INTO users (email, password, role, first_name, last_name, nickname, phone, is_approved) 
          VALUES (${email}, ${hashedPassword}, ${isAdmin ? 'admin' : 'user'}, ${firstName}, ${lastName}, ${nickname}, ${phone}, ${isAdmin}) 
          RETURNING id, email, role, nickname, is_approved as "isApproved"`;
        const token = jwt.sign(user, JWT_SECRET);
        return jsonResponse(200, { user, token });
      } catch (e) {
        return jsonResponse(400, { message: 'Email je već u upotrebi.' });
      }
    }

    // AUTH - LOGIN
    if (method === 'POST' && (path === '/auth/login' || path === '/auth/login/')) {
      const { email, password } = JSON.parse(event.body);
      const [user] = await db`SELECT id, email, password, role, nickname, is_approved FROM users WHERE email = ${email}`;
      
      if (user && await bcrypt.compare(password, user.password)) {
        const { password: _, is_approved, ...userSafe } = user;
        userSafe.isApproved = is_approved;
        const token = jwt.sign(userSafe, JWT_SECRET);
        return jsonResponse(200, { user: userSafe, token });
      }
      return jsonResponse(401, { message: 'Pogrešni podaci za prijavu.' });
    }

    // AUTH - ME
    if (method === 'GET' && (path === '/auth/me' || path === '/auth/me/')) {
      if (!currentUser) return jsonResponse(401, { message: 'Unauthorized' });
      const [user] = await db`SELECT id, email, role, nickname, is_approved as "isApproved" FROM users WHERE id = ${currentUser.id}`;
      return user ? jsonResponse(200, user) : jsonResponse(404, { message: 'User not found' });
    }

    // MESSAGES
    if (method === 'GET' && (path === '/messages' || path === '/messages/')) {
      const msgs = await db`
        SELECT m.id, m.content, m.created_at, m.user_id, u.nickname, u.role, u.email 
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        ORDER BY m.created_at ASC LIMIT 50`;
      return jsonResponse(200, msgs || []);
    }

    if (method === 'POST' && (path === '/messages' || path === '/messages/')) {
      if (!currentUser) return jsonResponse(401, { message: 'Prijavi se.' });
      const { content } = JSON.parse(event.body);
      if (!content) return jsonResponse(400, { message: 'Prazna poruka.' });
      await db`INSERT INTO messages (user_id, content) VALUES (${currentUser.id}, ${content})`;
      return jsonResponse(200, { success: true });
    }

    // ADMIN - USERS
    if (method === 'GET' && (path === '/admin/users' || path === '/admin/users/')) {
      if (currentUser?.role !== 'admin') return jsonResponse(403, { message: 'Forbidden' });
      const users = await db`SELECT id, email, role, first_name as "firstName", last_name as "lastName", nickname, phone, is_approved as "isApproved" FROM users`;
      return jsonResponse(200, users);
    }

    if (method === 'POST' && path.includes('/admin/users/approve/')) {
      if (currentUser?.role !== 'admin') return jsonResponse(403, { message: 'Forbidden' });
      const id = path.split('/').pop();
      await db`UPDATE users SET is_approved = NOT is_approved WHERE id = ${id}`;
      return jsonResponse(200, { success: true });
    }

    return jsonResponse(404, { message: 'Not Found' });

  } catch (err) {
    console.error("Critical API Error:", err);
    return jsonResponse(500, { message: 'Greška na serveru.', details: err.message });
  }
};
