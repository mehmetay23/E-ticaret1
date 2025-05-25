const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const OpenAI = require('openai');
const fetch = require('node-fetch');
const { handleChat } = require('./chatbot-training');

// JWT_SECRET kontrolü
if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in .env file');
    process.exit(1);
}

// Admin yetki kontrolü middleware
const checkAdminRole = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Bu işlem için admin yetkisi gerekiyor' });
    }
    next();
};

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// CORS ayarları
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Multer ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/images/products';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// PostgreSQL bağlantı havuzu
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'tıcaret',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    client_encoding: 'UTF8'
});

// Bağlantıyı test et
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err);
    } else {
        console.log('Veritabanı bağlantısı başarılı');
    }
});

// JWT doğrulama middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token bulunamadı' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Geçersiz token' });
        }
        req.user = user;
        next();
    });
};

// OpenAI yapılandırması
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Ürün arama endpoint'i
app.get('/api/products/search', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM products';
        const params = [];

        if (category && category !== '') {
            query = 'SELECT p.* FROM products p WHERE p.category_id = $1';
            params.push(parseInt(category));
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Arama sırasında bir hata oluştu' });
    }
});

// Kategoriye göre ürünleri getir
app.get('/api/products/category/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const result = await pool.query(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.category_id = $1
            ORDER BY p.id
        `, [categoryId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Kategori ürünleri yüklenirken hata:', err);
        res.status(500).json({ error: 'Ürünler yüklenirken bir hata oluştu' });
    }
});

// Ürünleri getir
app.get('/api/products', async (req, res) => {
  try {
    console.log('Ürünler isteği alındı');
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    console.log('Ürünler başarıyla getirildi:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Ürünler getirilirken hata:', error);
    res.status(500).json({ message: 'Ürünler getirilirken bir hata oluştu' });
  }
});

// Tek bir ürünü getir
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }
    
    console.log('Ürün başarıyla getirildi:', id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ürün getirilirken hata:', error);
    res.status(500).json({ message: 'Ürün getirilirken bir hata oluştu' });
  }
});

// Kategorileri getir
app.get('/api/categories', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.*,
                COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id
            ORDER BY c.name
        `);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        res.status(500).json({ error: 'Kategoriler yüklenirken bir hata oluştu' });
    }
});

// Kullanıcı kaydı
app.post('/api/auth/register', async (req, res) => {
    try {
        const { full_name, email, password } = req.body;
        console.log('Kayıt isteği alındı:', { full_name, email });

        // Email kontrolü
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Bu email adresi zaten kayıtlı' });
        }

        // Şifreyi hashle
        const hashedPassword = await bcrypt.hash(password, 10);

        // Kullanıcıyı veritabanına kaydet
        const result = await pool.query(
            'INSERT INTO users (full_name, email, password_hash, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role, status',
            [full_name, email, hashedPassword, 'user', 'active']
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
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Kayıt hatası:', error);
        res.status(500).json({ message: 'Kayıt işlemi sırasında bir hata oluştu' });
    }
});

// Kullanıcı girişi
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
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).json({ message: 'Giriş işlemi sırasında bir hata oluştu' });
    }
});

// Profil bilgilerini getir
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        console.log('Profil isteği alındı. Kullanıcı ID:', req.user.userId);
        
        const result = await client.query(
            'SELECT id, full_name, email, phone, role, status FROM users WHERE id = $1',
            [req.user.userId]
        );
        
        if (result.rows.length === 0) {
            console.log('Kullanıcı bulunamadı:', req.user.userId);
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }
        
        console.log('Profil bilgileri başarıyla getirildi:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Profil getirme hatası:', err);
        res.status(500).json({ error: 'Profil bilgileri alınırken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Profil güncelleme
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { fullName, phone, currentPassword, newPassword } = req.body;
        
        if (currentPassword && newPassword) {
            const user = await client.query(
                'SELECT password_hash FROM users WHERE id = $1',
                [req.user.userId]
            );
            
            if (user.rows.length === 0) {
                return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            }
            
            const validPassword = await bcrypt.compare(
                currentPassword,
                user.rows[0].password_hash
            );
            
            if (!validPassword) {
                return res.status(400).json({ error: 'Mevcut şifre yanlış' });
            }
            
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await client.query(
                'UPDATE users SET password_hash = $1 WHERE id = $2',
                [hashedPassword, req.user.userId]
            );
        }
        
        if (fullName || phone) {
            const result = await client.query(
                'UPDATE users SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone) WHERE id = $3 RETURNING id, full_name, email, phone, role, status',
                [fullName, phone, req.user.userId]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            }
            
            res.json(result.rows[0]);
        } else {
            // Güncel kullanıcı bilgilerini getir
            const updatedUser = await client.query(
                'SELECT id, full_name, email, phone, role, status FROM users WHERE id = $1',
                [req.user.userId]
            );
            
            if (updatedUser.rows.length === 0) {
                return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
            }
            
            res.json(updatedUser.rows[0]);
        }
    } catch (err) {
        console.error('Profil güncelleme hatası:', err);
        res.status(500).json({ error: 'Profil güncellenirken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Siparişleri getir
app.get('/api/user/orders', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Siparişler yüklenirken bir hata oluştu' });
    }
});

// Favorileri getir
app.get('/api/user/favorites', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.* FROM favorites f 
            JOIN products p ON f.product_id = p.id 
            WHERE f.user_id = $1`,
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Favoriler yüklenirken bir hata oluştu' });
    }
});

// Kullanıcının sepetini getir
app.get('/api/cart', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.userId;
        console.log('Sepet isteği alındı. Kullanıcı ID:', userId);

        // Sepetteki ürünleri getir
        const result = await client.query(`
            SELECT 
                ci.id,
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.image_url,
                cat.name as category_name
            FROM cartitems ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN categories cat ON p.category_id = cat.id
            WHERE ci.user_id = $1
        `, [userId]);

        console.log('Sepetteki ürünler:', result.rows);
        res.json(result.rows);

    } catch (error) {
        console.error('Sepet getirme hatası:', error);
        res.status(500).json({ error: 'Sepet alınırken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Sepete ürün ekle
app.post('/api/cart/add', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { product_id, quantity } = req.body;
        const userId = req.user.userId;

        console.log('Sepete ekleme isteği:', { userId, product_id, quantity });

        // Ürünü kontrol et
        const productCheck = await client.query(
            'SELECT * FROM products WHERE id = $1',
            [product_id]
        );

        if (productCheck.rows.length === 0) {
            throw new Error('Ürün bulunamadı');
        }

        // Sepete ürün ekle veya güncelle
        const cartItem = await client.query(`
            INSERT INTO cartitems (user_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, product_id) 
            DO UPDATE SET quantity = cartitems.quantity + EXCLUDED.quantity
            RETURNING *
        `, [userId, product_id, quantity]);

        // Eklenen ürünün detaylarını getir
        const result = await client.query(`
            SELECT 
                ci.id,
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.image_url,
                cat.name as category_name
            FROM cartitems ci
            JOIN products p ON ci.product_id = p.id
            LEFT JOIN categories cat ON p.category_id = cat.id
            WHERE ci.id = $1
        `, [cartItem.rows[0].id]);

        console.log('Eklenen ürün detayları:', result.rows[0]);
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Sepete ekleme hatası:', error);
        res.status(500).json({ error: 'Ürün sepete eklenirken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Sepetteki ürün miktarını güncelle
app.put('/api/cart/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        const userId = req.user.userId;

        // Önce sepet öğesinin kullanıcıya ait olduğunu kontrol et
        const cartCheck = await client.query(
            'SELECT product_id FROM cart WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (cartCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Sepet öğesi bulunamadı' });
        }

        // Stok kontrolü
        const productCheck = await client.query(
            'SELECT stock FROM products WHERE id = $1',
            [cartCheck.rows[0].product_id]
        );

        if (productCheck.rows[0].stock < quantity) {
            return res.status(400).json({ error: 'Yetersiz stok' });
        }

        // Miktarı güncelle
        const result = await client.query(`
            UPDATE cart 
            SET quantity = $1 
            WHERE id = $2 AND user_id = $3
            RETURNING *
        `, [quantity, id, userId]);

        // Güncel sepet öğesini getir
        const updatedItem = await client.query(`
            SELECT 
                c.*,
                p.name,
                p.description,
                p.image_url,
                p.price,
                p.stock,
                cat.name as category_name
            FROM cart c
            JOIN products p ON c.product_id = p.id
            LEFT JOIN categories cat ON p.category_id = cat.id
            WHERE c.id = $1 AND c.user_id = $2
        `, [result.rows[0].id, userId]);

        res.json(updatedItem.rows[0]);

    } catch (error) {
        console.error('Sepet güncelleme hatası:', error);
        res.status(500).json({ error: 'Sepet güncellenirken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Sepetten ürün sil
app.delete('/api/cart/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await client.query('BEGIN');

        // Önce ürünün kullanıcıya ait olduğunu kontrol et
        const itemCheck = await client.query(`
            SELECT oi.id 
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.id = $1 AND o.user_id = $2 AND o.status = 'pending'
        `, [id, userId]);

        if (itemCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Sepet öğesi bulunamadı' });
        }

        // Ürünü sil
        await client.query('DELETE FROM order_items WHERE id = $1', [id]);

        // Sipariş toplamını güncelle
        await client.query(`
            UPDATE orders 
            SET total = COALESCE((
                SELECT SUM(quantity * price) 
                FROM order_items 
                WHERE order_id = orders.id
            ), 0)
            WHERE user_id = $1 AND status = 'pending'
        `, [userId]);

        await client.query('COMMIT');
        res.json({ message: 'Ürün sepetten kaldırıldı' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Sepetten silme hatası:', error);
        res.status(500).json({ error: 'Ürün sepetten silinirken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Kullanıcının sepetini temizle
app.delete('/api/cart', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM cart WHERE user_id = $1', [req.user.userId]);
        res.json({ message: 'Sepet temizlendi' });
    } catch (error) {
        console.error('Sepet temizleme hatası:', error);
        res.status(500).json({ error: 'Sepet temizlenirken bir hata oluştu' });
    }
});

// Öne çıkan ürünleri getir
app.get('/api/featured-products', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.id,
                p.name,
                p.description,
                p.price,
                p.image_url,
                p.stock,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'active'
            ORDER BY RANDOM()
            LIMIT 4
        `);
        
        console.log('Öne çıkan ürünler:', result.rows);
        res.json(result.rows);
    } catch (error) {
        console.error('Öne çıkan ürünler yüklenirken hata:', error);
        res.status(500).json({ error: 'Ürünler yüklenirken bir hata oluştu' });
    }
});

// Adres ekleme endpoint'i
app.post('/api/addresses', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        console.log('Gelen adres verisi:', req.body); // Debug log
        console.log('Kullanıcı ID:', req.user.userId); // Debug log

        const { full_name, phone, address, city, district } = req.body;
        const userId = req.user.userId;

        // Gerekli alanları kontrol et
        if (!full_name || !address || !city || !district) {
            return res.status(400).json({ error: 'Tüm alanları doldurun' });
        }

        await client.query('BEGIN');

        // Kullanıcının ilk adresi mi kontrol et
        const addressCount = await client.query(
            'SELECT COUNT(*) FROM addresses WHERE user_id = $1',
            [userId]
        );

        const isDefault = addressCount.rows[0].count === '0';

        // Yeni adresi ekle
        const result = await client.query(`
            INSERT INTO addresses (
                user_id, 
                full_name, 
                phone, 
                address, 
                city, 
                district,
                is_default
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [userId, full_name, phone, address, city, district, isDefault]);

        await client.query('COMMIT');

        console.log('Eklenen adres:', result.rows[0]); // Debug log
        res.status(201).json(result.rows[0]);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Adres ekleme hatası:', error);
        res.status(500).json({ error: 'Adres eklenirken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Adresleri getir
app.get('/api/addresses', authenticateToken, async (req, res) => {
    try {
        console.log('Kullanıcı ID:', req.user.userId); // Debug log

        const result = await pool.query(
            'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
            [req.user.userId]
        );

        console.log('Bulunan adresler:', result.rows); // Debug log
        res.json(result.rows);

    } catch (error) {
        console.error('Adres getirme hatası:', error);
        res.status(500).json({ error: 'Adresler alınırken bir hata oluştu' });
    }
});

// Adres silme endpoint'i
app.delete('/api/addresses/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Adres bulunamadı' });
        }

        res.json({ message: 'Adres başarıyla silindi' });
    } catch (error) {
        console.error('Adres silme hatası:', error);
        res.status(500).json({ error: 'Adres silinirken bir hata oluştu' });
    }
});

// Varsayılan adres güncelleme endpoint'i
app.put('/api/addresses/:id/default', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        await client.query('BEGIN');

        // Önce tüm adreslerin varsayılan durumunu false yap
        await client.query(
            'UPDATE addresses SET is_default = false WHERE user_id = $1',
            [req.user.userId]
        );

        // Seçilen adresi varsayılan yap
        const result = await client.query(
            'UPDATE addresses SET is_default = true WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.userId]
        );

        await client.query('COMMIT');

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Adres bulunamadı' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Varsayılan adres güncelleme hatası:', error);
        res.status(500).json({ error: 'Adres güncellenirken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Ödeme işlemi endpoint'i
app.post('/api/orders/payment', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { cardName, cardNumber, expiryDate, cvv, amount, cartItems } = req.body;
        const userId = req.user.userId;

        await client.query('BEGIN');

        if (!cartItems || cartItems.length === 0) {
            throw new Error('Sepet boş');
        }

        // Toplam tutarları hesapla
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 150 ? 0 : 29.90;
        const tax = subtotal * 0.18;
        const total = subtotal + shipping + tax;

        // Yeni sipariş oluştur
        const orderResult = await client.query(
            `INSERT INTO orders (
                user_id, 
                status, 
                subtotal, 
                shipping_cost, 
                tax_amount,
                total,
                payment_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [
                userId, 
                'completed', 
                subtotal, 
                shipping, 
                tax,
                total,
                'completed'
            ]
        );
        
        const orderId = orderResult.rows[0].id;

        // Sipariş detaylarını ekle - total_price sütununu çıkardık çünkü otomatik hesaplanıyor
        for (const item of cartItems) {
            await client.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
                [orderId, item.id, item.quantity, item.price]
            );

            // Ürün stokunu güncelle
            await client.query(
                'UPDATE products SET stock = stock - $1 WHERE id = $2',
                [item.quantity, item.id]
            );
        }

        await client.query('COMMIT');

        res.json({ 
            success: true, 
            message: 'Ödeme başarıyla tamamlandı',
            orderId: orderId 
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ödeme hatası:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Ödeme işlemi sırasında bir hata oluştu' 
        });
    } finally {
        client.release();
    }
});

// Tüm siparişleri getir
app.get('/api/orders', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { status } = req.query; // status parametresi opsiyonel
        let query = `
            SELECT 
                o.id,
                o.status,
                o.created_at,
                o.subtotal,
                o.shipping_cost,
                o.tax_amount,
                o.total,
                o.payment_status,
                json_agg(json_build_object(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'product_name', p.name,
                    'product_image', p.image_url
                )) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = $1
        `;

        const queryParams = [req.user.userId];

        if (status) {
            query += ` AND o.status = $2`;
            queryParams.push(status);
        }

        query += ` GROUP BY o.id ORDER BY o.created_at DESC`;

        const result = await client.query(query, queryParams);
        res.json(result.rows);

    } catch (error) {
        console.error('Siparişleri getirme hatası:', error);
        res.status(500).json({ error: 'Siparişler yüklenirken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Belirli bir siparişin detaylarını getir
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const result = await client.query(`
            SELECT 
                o.*,
                json_agg(json_build_object(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'quantity', oi.quantity,
                    'price', oi.price,
                    'product_name', p.name,
                    'product_image', p.image_url
                )) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.id = $1 AND o.user_id = $2
            GROUP BY o.id
        `, [id, req.user.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Sipariş detayı getirme hatası:', error);
        res.status(500).json({ error: 'Sipariş detayları yüklenirken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Admin ürün ekleme endpoint'i
app.post('/api/admin/products', authenticateToken, checkAdminRole, upload.single('image'), async (req, res) => {
    const client = await pool.connect();
    try {
        const { name, description, price, stock, category_id } = req.body;
        const image_url = req.file ? `/images/products/${req.file.filename}` : null;

        const result = await client.query(`
            INSERT INTO products (name, description, price, stock, category_id, image_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [name, description, price, stock, category_id, image_url]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ürün ekleme hatası:', error);
        res.status(500).json({ error: 'Ürün eklenirken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Admin ürün güncelleme endpoint'i
app.put('/api/admin/products/:id', authenticateToken, checkAdminRole, upload.single('image'), async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { name, description, price, stock, category_id } = req.body;
        
        let query = `
            UPDATE products 
            SET name = $1, description = $2, price = $3, stock = $4, category_id = $5
        `;
        let params = [name, description, price, stock, category_id];

        if (req.file) {
            query += `, image_url = $${params.length + 1}`;
            params.push(`/images/products/${req.file.filename}`);
        }

        query += ` WHERE id = $${params.length + 1} RETURNING *`;
        params.push(id);

        const result = await client.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ürün güncelleme hatası:', error);
        res.status(500).json({ error: 'Ürün güncellenirken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Admin ürün silme endpoint'i
app.delete('/api/admin/products/:id', authenticateToken, checkAdminRole, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        
        // Önce ürünün mevcut olduğunu kontrol et
        const checkResult = await client.query(
            'SELECT image_url FROM products WHERE id = $1',
            [id]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ürün bulunamadı' });
        }

        // Ürünü sil
        await client.query('DELETE FROM products WHERE id = $1', [id]);

        // Eğer ürünün bir resmi varsa, dosya sisteminden de sil
        const imageUrl = checkResult.rows[0].image_url;
        if (imageUrl) {
            const imagePath = path.join(__dirname, 'public', imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        res.json({ message: 'Ürün başarıyla silindi' });
    } catch (error) {
        console.error('Ürün silme hatası:', error);
        res.status(500).json({ error: 'Ürün silinirken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Admin sipariş onaylama endpoint'i
app.put('/api/admin/orders/:id/approve', authenticateToken, checkAdminRole, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        
        const result = await client.query(`
            UPDATE orders 
            SET status = 'approved', 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 
            RETURNING *
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Sipariş onaylama hatası:', error);
        res.status(500).json({ error: 'Sipariş onaylanırken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Admin dashboard istatistikleri endpoint'i
app.get('/api/admin/dashboard', authenticateToken, checkAdminRole, async (req, res) => {
    const client = await pool.connect();
    try {
        // Toplam satış
        const salesResult = await client.query(`
            SELECT COALESCE(SUM(total), 0) as total_sales
            FROM orders
            WHERE status = 'completed'
        `);

        // Toplam sipariş sayısı
        const ordersResult = await client.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_orders
            FROM orders
        `);

        // Toplam ürün sayısı
        const productsResult = await client.query(`
            SELECT COUNT(*) as total_products
            FROM products
        `);

        // Toplam kullanıcı sayısı
        const usersResult = await client.query(`
            SELECT COUNT(*) as total_users
            FROM users
            WHERE role = 'user'
        `);

        res.json({
            totalSales: salesResult.rows[0].total_sales,
            pendingOrders: ordersResult.rows[0].pending_orders,
            completedOrders: ordersResult.rows[0].completed_orders,
            totalProducts: productsResult.rows[0].total_products,
            totalUsers: usersResult.rows[0].total_users
        });
    } catch (error) {
        console.error('Dashboard istatistikleri hatası:', error);
        res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu' });
    } finally {
        client.release();
    }
});

// Chatbot endpoint'i
app.post('/api/chat', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Mesaj gerekli' });
        }

        // Kullanıcı bilgilerini al
        const user = req.user;
        console.log('Chat isteği alındı:', { userId: user.userId, message });

        // Chat yanıtını al
        const response = await handleChat(message);
        console.log('Chat yanıtı:', response);

        if (!response) {
            throw new Error('Chatbot yanıt vermedi');
        }

        res.json({ response });
    } catch (error) {
        console.error('Chat hatası:', error);
        res.status(500).json({ error: error.message || 'Chatbot yanıt verirken bir hata oluştu' });
    }
});

// Kullanıcıları listele
app.get('/api/users', authenticateToken, checkAdminRole, async (req, res) => {
    try {
        const query = `
            SELECT id, full_name, email, role, created_at 
            FROM users 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Kullanıcılar alınırken hata:', error);
        res.status(500).json({ error: 'Kullanıcılar alınamadı' });
    }
});

// Kullanıcı rolünü güncelle
app.put('/api/users/:id/role', authenticateToken, checkAdminRole, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Geçersiz rol' });
    }

    try {
        const query = `
            UPDATE users 
            SET role = $1 
            WHERE id = $2 
            RETURNING id, full_name, email, role
        `;
        const result = await pool.query(query, [role, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Rol güncellenirken hata:', error);
        res.status(500).json({ error: 'Rol güncellenemedi' });
    }
});

// Statik dosyaları serve et
app.use(express.static(path.join(__dirname)));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Header.html için özel route
app.get('/header.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'header.html'));
});

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ürünler sayfası
app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'products.html'));
});

// Server'ı başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
