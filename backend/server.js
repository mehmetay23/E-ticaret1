const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = 3000;

// PostgreSQL bağlantı ayarları
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tıcaret',
  password: '1234', // PostgreSQL şifresi
  port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT secret key
const JWT_SECRET = 'your-secret-key';

// Veritabanı bağlantısını test et
pool.connect((err, client, release) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err);
    return;
  }
  console.log('Veritabanına başarıyla bağlanıldı');
  release();
});

// Token doğrulama middleware'i
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token bulunamadı' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Kayıt endpoint'i
app.post('/api/auth/register', async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;
    console.log('Kayıt isteği alındı:', { full_name, email });

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı veritabanına kaydet
    const result = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, phone, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, full_name, email, phone, role, status',
      [full_name, email, hashedPassword, phone || null, 'user', 'active']
    );

    const user = result.rows[0];
    console.log('Kullanıcı başarıyla kaydedildi:', user);

    // JWT token oluştur
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ message: 'Kayıt işlemi sırasında bir hata oluştu' });
  }
});

// Giriş endpoint'i
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Giriş isteği alındı:', { email });

    // Kullanıcıyı bul
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      console.log('Kullanıcı bulunamadı:', email);
      return res.status(401).json({ message: 'E-posta veya şifre hatalı' });
    }

    // Şifreyi kontrol et
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('Şifre hatalı:', email);
      return res.status(401).json({ message: 'E-posta veya şifre hatalı' });
    }

    // JWT token oluştur
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    console.log('Giriş başarılı:', user.email);

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ message: 'Giriş işlemi sırasında bir hata oluştu' });
  }
});

// Ürünleri getir endpoint'i
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    console.log('Ürünler isteği alındı');
    const result = await pool.query('SELECT * FROM products WHERE status = $1', ['active']);
    console.log('Ürünler başarıyla getirildi:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Ürünler getirme hatası:', error);
    res.status(500).json({ message: 'Ürünler getirilirken bir hata oluştu' });
  }
});

app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor`);
}); 