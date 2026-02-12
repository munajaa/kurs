
const postgres = require('postgres');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_123';

// Pomoćna funkcija za uniformne JSON odgovore
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

const connectDb = () => {
  if (!sql) {
    if (!process.env.NETLIFY_DATABASE_URL) {
      throw new Error("Konfiguracija baze (NETLIFY_DATABASE_URL) nije pronađena u Netlify postavkama.");
    }
    sql = postgres(process.env.NETLIFY_DATABASE_URL, { 
      ssl: 'require',
      connect_timeout: 10,
      idle_timeout: 20,
      max: 10
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
    
    // Provjera i dodavanje stupaca koji možda nedostaju
    try {
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT`;
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT`;
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT`;
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`;
      await db`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE`;
    } catch (e) { /* Stupci vjerojatno već postoje */ }

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
      "productName" TEXT,
      "imageUrl" TEXT,
      "buyLink" TEXT,
      "isWhatsApp" BOOLEAN,
      description TEXT
    )`;
    await db`CREATE TABLE IF NOT EXISTS useful (
      id TEXT PRIMARY KEY,
      title TEXT,
      category TEXT,
      description TEXT,
      content TEXT,
      images TEXT[]
    )`;
    await db`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      content TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`;
  } catch (err) {
    console.error("Inicijalizacija baze nije uspjela:", err);
    throw err;
  }
};

exports.handler = async (event, context) => {
  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return jsonResponse(200, { message: 'OK' });
  }

  try {
    const db = connectDb();
    await initDb(db);

    const path = event.path.replace(/\.netlify\/functions\/api/, '');
    const method = event.httpMethod;
    const authHeader = event.headers.authorization;
    let currentUser = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        currentUser = jwt.verify(token, JWT_SECRET);
      } catch (e) {
        // Token nevažeći, ali nastavljamo jer neke rute ne trebaju auth
      }
    }

    // --- PUBLIC DATA ROUTES ---
    if (method === 'GET' && path === '/data') {
      const lessons = await db`SELECT * FROM lessons ORDER BY "order" ASC`;
      const suppliers = await db`SELECT * FROM suppliers`;
      const useful = await db`SELECT * FROM useful`;
      return jsonResponse(200, { lessons, suppliers, useful });
    }

    if (method === 'GET' && path === '/messages') {
      const messages = await db`
        SELECT m.*, u.email, u.role, u.nickname 
        FROM messages m 
        JOIN users u ON m.user_id = u.id 
        ORDER BY m.created_at ASC 
        LIMIT 50`;
      return jsonResponse(200, messages);
    }

    // --- AUTH ROUTES ---
    if (method === 'POST' && path === '/auth/register') {
      const body = JSON.parse(event.body);
      const { email, password, firstName, lastName, nickname, phone } = body;
      
      if (!email || !password) return jsonResponse(400, { message: 'Email i lozinka su obavezni.' });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const isAdmin = email === 'romano.polovic33@gmail.com';
      const role = isAdmin ? 'admin' : 'user';
      const isApproved = isAdmin;

      try {
        const [user] = await db`
          INSERT INTO users (email, password, role, first_name, last_name, nickname, phone, is_approved) 
          VALUES (${email}, ${hashedPassword}, ${role}, ${firstName}, ${lastName}, ${nickname}, ${phone}, ${isApproved}) 
          RETURNING id, email, role, first_name as "firstName", last_name as "lastName", nickname, phone, is_approved as "isApproved"`;
        const token = jwt.sign(user, JWT_SECRET);
        return jsonResponse(200, { user, token });
      } catch (e) {
        return jsonResponse(400, { message: 'Račun s ovim emailom već postoji.' });
      }
    }

    if (method === 'POST' && path === '/auth/login') {
      const { email, password } = JSON.parse(event.body);
      const [user] = await db`SELECT id, email, password, role, first_name as "firstName", last_name as "lastName", nickname, phone, is_approved as "isApproved" FROM users WHERE email = ${email}`;
      
      if (user && await bcrypt.compare(password, user.password)) {
        const { password: _, ...userSafe } = user;
        const token = jwt.sign(userSafe, JWT_SECRET);
        return jsonResponse(200, { user: userSafe, token });
      }
      return jsonResponse(401, { message: 'Pogrešan email ili lozinka.' });
    }

    if (method === 'GET' && path === '/auth/me') {
      if (!currentUser) return jsonResponse(401, { message: 'Unauthorized' });
      const [user] = await db`SELECT id, email, role, first_name as "firstName", last_name as "lastName", nickname, phone, is_approved as "isApproved" FROM users WHERE id = ${currentUser.id}`;
      if (!user) return jsonResponse(404, { message: 'Korisnik nije pronađen.' });
      return jsonResponse(200, user);
    }

    // --- PROTECTED ROUTES (MUST BE LOGGED IN) ---
    if (!currentUser) return jsonResponse(401, { message: 'Potrebna prijava.' });

    if (method === 'POST' && path === '/messages') {
      const { content } = JSON.parse(event.body);
      if (!content || content.trim().length === 0) return jsonResponse(400, { message: 'Poruka ne može biti prazna.' });
      await db`INSERT INTO messages (user_id, content) VALUES (${currentUser.id}, ${content})`;
      return jsonResponse(200, { success: true });
    }

    // --- ADMIN ROUTES ---
    if (currentUser.role !== 'admin') return jsonResponse(403, { message: 'Nemate dozvolu za ovu akciju.' });

    if (method === 'GET' && path === '/admin/lessons') return jsonResponse(200, await db`SELECT * FROM lessons`);
    if (method === 'GET' && path === '/admin/suppliers') return jsonResponse(200, await db`SELECT * FROM suppliers`);
    if (method === 'GET' && path === '/admin/users') return jsonResponse(200, await db`SELECT id, email, role, first_name as "firstName", last_name as "lastName", nickname, phone, is_approved as "isApproved" FROM users`);
    if (method === 'GET' && path === '/admin/useful') return jsonResponse(200, await db`SELECT * FROM useful`);
    
    if (method === 'POST' && path.startsWith('/admin/users/approve/')) {
      const id = path.split('/').pop();
      await db`UPDATE users SET is_approved = NOT is_approved WHERE id = ${id}`;
      return jsonResponse(200, { success: true });
    }

    if (method === 'DELETE' && path.startsWith('/admin/')) {
      const parts = path.split('/');
      const table = parts[2];
      const id = parts[3];
      const allowedTables = ['lessons', 'suppliers', 'users', 'useful'];
      if (!allowedTables.includes(table)) return jsonResponse(400, { message: 'Nevažeća tablica.' });
      
      await db`DELETE FROM ${db(table)} WHERE id = ${id}`;
      return jsonResponse(200, { success: true });
    }

    return jsonResponse(404, { message: 'Ruta nije pronađena.' });
  } catch (err) {
    console.error("API Error:", err);
    return jsonResponse(500, { 
      message: 'Greška na serveru ili problem s bazom podataka.', 
      details: err.message 
    });
  }
};
