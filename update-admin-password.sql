-- Admin şifresini güncelle (şifre: admin123)
UPDATE users 
SET password_hash = '$2b$10$8kqwrKXTKlK7YPqVqjS1UOIQRzGX5oGqWMXm0pF1R7R1fHvQyX5Hy'
WHERE email = 'admin@eticaret.com';

-- Eğer admin kullanıcısı yoksa oluştur
INSERT INTO users (
    full_name,
    email,
    password_hash,
    role,
    status
)
SELECT 
    'Admin User',
    'admin@eticaret.com',
    '$2b$10$8kqwrKXTKlK7YPqVqjS1UOIQRzGX5oGqWMXm0pF1R7R1fHvQyX5Hy',
    'admin',
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@eticaret.com'
);
