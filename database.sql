-- Temel yetkileri ekle
INSERT INTO admin_permissions (name, description) VALUES
    ('view_dashboard', 'Dashboard görüntüleme yetkisi'),
    ('manage_products', 'Ürün yönetimi yetkisi'),
    ('manage_categories', 'Kategori yönetimi yetkisi'),
    ('manage_orders', 'Sipariş yönetimi yetkisi'),
    ('manage_users', 'Kullanıcı yönetimi yetkisi'),
    ('manage_admins', 'Admin yönetimi yetkisi'),
    ('view_reports', 'Raporları görüntüleme yetkisi'),
    ('manage_settings', 'Sistem ayarları yönetimi yetkisi');

-- Rol-yetki ilişkilerini ekle
INSERT INTO admin_role_permissions (role, permission_id) VALUES
    -- Editor yetkileri
    ('editor', 1), -- dashboard
    ('editor', 2), -- products
    ('editor', 3), -- categories
    
    -- Admin yetkileri
    ('admin', 1), -- dashboard
    ('admin', 2), -- products
    ('admin', 3), -- categories
    ('admin', 4), -- orders
    ('admin', 5), -- users
    ('admin', 7), -- reports
    
    -- Super Admin tüm yetkiler
    ('super_admin', 1),
    ('super_admin', 2),
    ('super_admin', 3),
    ('super_admin', 4),
    ('super_admin', 5),
    ('super_admin', 6),
    ('super_admin', 7),
    ('super_admin', 8);

-- Varsayılan super admin kullanıcısı oluştur (şifre: admin123)
INSERT INTO admins (
    username,
    email,
    password_hash,
    full_name,
    role,
    is_super_admin
) VALUES (
    'superadmin',
    'admin@eticaret.com',
    '$2b$10$rR3kZnQk9H6LGZQZz9oK8.7h4OgZP1dB1kF1U1U1U1U1U1U1U1', -- admin123
    'Super Admin',
    'super_admin',
    true
);

-- Updated_at için trigger oluştur
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 

-- Tabloların varlığını kontrol et
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'orders'
);

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
);

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'products'
);

-- Kullanıcılar Tablosu
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Updated_at trigger'ı
CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Orders (Siparişler) tablosu
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    subtotal DECIMAL(10,2) DEFAULT 0.00,
    shipping_cost DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sipariş ürünleri tablosu
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Updated_at trigger'ı
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Örnek kullanıcı verileri
INSERT INTO users (full_name, email, password_hash, phone) VALUES 
('Test Kullanıcı', 'test@example.com', '$2b$10$rR3kZnQk9H6LGZQZz9oK8.7h4OgZP1dB1kF1U1U1U1U1U1U1U1', '5551234567'),
('Demo Kullanıcı', 'demo@example.com', '$2b$10$rR3kZnQk9H6LGZQZz9oK8.7h4OgZP1dB1kF1U1U1U1U1U1U1U1', '5559876543');

-- Örnek sipariş verileri
INSERT INTO orders (user_id, total, status) VALUES 
(1, 150.00, 'completed'),
(1, 299.99, 'pending'),
(2, 75.50, 'processing');

-- Örnek sipariş ürünleri
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES 
(1, 1, 2, 75.00),  -- 1 nolu siparişin ürünleri
(1, 2, 1, 150.00),
(2, 3, 1, 299.99), -- 2 nolu siparişin ürünü
(3, 1, 1, 75.50);  -- 3 nolu siparişin ürünü

-- Cart tablosunu güncelle
DROP TABLE IF EXISTS cart;
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

-- Updated_at trigger'ı
CREATE TRIGGER update_cart_updated_at
    BEFORE UPDATE ON cart
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Products tablosunu kontrol et ve gerekirse güncelle
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    category_id INTEGER REFERENCES categories(id),
    image_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Updated_at trigger'ı
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Önce kolonun var olup olmadığını kontrol et
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'status'
    ) THEN 
        ALTER TABLE products 
        ADD COLUMN status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- Mevcut ürünleri aktif olarak işaretle
UPDATE products SET status = 'active' WHERE status IS NULL;

-- Önce tabloyu temizle (eğer varsa)
DROP TABLE IF EXISTS addresses;

-- Adresler tablosunu oluştur
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger oluştur
CREATE OR REPLACE TRIGGER update_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Orders tablosunu güncelle
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS total DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Mevcut null değerleri güncelle
UPDATE orders 
SET 
    subtotal = COALESCE(subtotal, 0.00),
    shipping_cost = COALESCE(shipping_cost, 0.00),
    total = COALESCE(total, 0.00),
    payment_status = COALESCE(payment_status, 'pending');

-- Not null constraint'leri ekle
ALTER TABLE orders 
ALTER COLUMN subtotal SET NOT NULL,
ALTER COLUMN shipping_cost SET NOT NULL,
ALTER COLUMN total SET NOT NULL,
ALTER COLUMN payment_status SET NOT NULL;