-- Users tablosunun yapısını kontrol et
\d users;

-- Admin kullanıcısını kontrol et
SELECT id, email, role, status, password_hash FROM users WHERE email = 'admin@eticaret.com';

-- Users tablosunda role kolonu yoksa ekle
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Admin kullanıcısını güncelle veya ekle
INSERT INTO users (
    full_name,
    email,
    password_hash,
    role,
    status
) VALUES (
    'Admin User',
    'admin@eticaret.com',
    '$2b$10$8kqwrKXTKlK7YPqVqjS1UOIQRzGX5oGqWMXm0pF1R7R1fHvQyX5Hy',
    'admin',
    'active'
)
ON CONFLICT (email) 
DO UPDATE SET 
    password_hash = '$2b$10$8kqwrKXTKlK7YPqVqjS1UOIQRzGX5oGqWMXm0pF1R7R1fHvQyX5Hy',
    role = 'admin',
    status = 'active';

-- Değişiklikleri kontrol et
SELECT id, email, role, status, password_hash FROM users WHERE email = 'admin@eticaret.com';
