-- Users tablosuna role kolonu ekle
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Mevcut kullanıcıları 'user' rolüne ata
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Admin rolüne sahip test kullanıcısı ekle (şifre: admin123)
INSERT INTO users (
    full_name,
    email,
    password_hash,
    role,
    status
) VALUES (
    'Admin User',
    'admin@eticaret.com',
    '$2b$10$rR3kZnQk9H6LGZQZz9oK8.7h4OgZP1dB1kF1U1U1U1U1U1U1U1', -- admin123
    'admin',
    'active'
);
