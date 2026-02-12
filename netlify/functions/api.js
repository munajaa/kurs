
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'flipzone_super_secret_2026';

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
    const dbUrl = process.env.NETLIFY_DATABASE_URL;
    if (!dbUrl) throw new Error("MISSING_DB_URL");
    sql = postgres(dbUrl, { 
      ssl: 'require',
      connect_timeout: 15,
      idle_timeout: 20,
      max: 10 // Povećano radi stabilnosti
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
    console.error("DB Init Error:", err);
  }
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return jsonResponse(200, { message: 'OK' });

  try {
    const db = getSql();
    await initDb(db);

    // Poboljšano prepoznavanje putanje (podržava i /api i /.netlify/functions/api)
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

    if (path === '/status' || path === '/status/') {
      return jsonResponse(200, { status: "online", db: "connected" });
    }

    if (method === 'GET' && (path === '/data' || path === '/data/')) {
      const lessons = await db`SELECT * FROM lessons ORDER BY "order" ASC`;
      return jsonResponse(200, { lessons: lessons || [] });
    }

    if (method === 'POST' && (path === '/auth/register' || path === '/auth/register/')) {
      const { email, password, firstName, lastName, nickname, phone } = JSON.parse(event.body);
      if (!email || !password) return jsonResponse(400, { message: 'Email i lozinka su obavezni.' });
      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdmin = email === 'romano.polovic33@gmail.com';
      try {
        const [user] = await db`
          INSERT INTO users (email, password, role, first_name, last_name, nickname, phone, is_approved) 
          VALUES (${email}, ${hashedPassword}, ${isAdmin ? 'admin' : 'user'}, ${firstName}, ${lastName}, ${nickname}, ${phone}, ${isAdmin}) 
          RETURNING id, email, role, nickname, is_approved as "isApproved"`;
        const token = jwt.sign(user, JWT_SECRET);
        return jsonResponse(200, { user, token });
      } catch (e) {
        return jsonResponse(400, { message: 'Korisnik s ovim emailom već postoji.' });
      }
    }

    if (method === 'POST' && (path === '/auth/login' || path === '/auth/login/')) {
      const { email, password } = JSON.parse(event.body);
      const [user] = await db`SELECT id, email, password, role, nickname, is_approved FROM users WHERE email = ${email}`;
      if (user && await bcrypt.compare(password, user.password)) {
        const { password: _, is_approved, ...userSafe } = user;
        userSafe.isApproved = is_approved;
        const token = jwt.sign(userSafe, JWT_SECRET);
        return jsonResponse(200, { user: userSafe, token });
      }
      return jsonResponse(401, { message: 'Pogrešan email ili lozinka.' });
    }

    if (method === 'GET' && (path === '/auth/me' || path === '/auth/me/')) {
      if (!currentUser) return jsonResponse(401, { message: 'Niste prijavljeni.' });
      const [user] = await db`SELECT id, email, role, nickname, is_approved as "isApproved" FROM users WHERE id = ${currentUser.id}`;
      return user ? jsonResponse(200, user) : jsonResponse(404, { message: 'Korisnik nije pronađen.' });
    }

    if (method === 'GET' && (path === '/messages' || path === '/messages/')) {
      const msgs = await db`
        SELECT m.*, u.nickname, u.role, u.email 
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        ORDER BY m.created_at ASC LIMIT 50`;
      return jsonResponse(200, msgs || []);
    }

    if (method === 'POST' && (path === '/messages' || path === '/messages/')) {
      if (!currentUser) return jsonResponse(401, { message: 'Prijavite se.' });
      const { content } = JSON.parse(event.body);
      await db`INSERT INTO messages (user_id, content) VALUES (${currentUser.id}, ${content})`;
      return jsonResponse(200, { success: true });
    }

    return jsonResponse(404, { message: `Ruta ${path} nije pronađena.` });

  } catch (err) {
    if (err.message === "MISSING_DB_URL") {
      return jsonResponse(500, { error: "DATABASE_CONFIG_ERROR", message: "NETLIFY_DATABASE_URL nije postavljena." });
    }
    console.error("API Error:", err);
    return jsonResponse(500, { message: 'Došlo je do greške na serveru.', error: err.message });
  }
};
