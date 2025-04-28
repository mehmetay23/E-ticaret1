const { pool } = require('./db');
const bcrypt = require('bcrypt');

// Tabloları oluştur
async function createTables() {
    try {
        // Önce tabloların var olup olmadığını kontrol et
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'admins'
            );
        `);

        // Eğer tablolar zaten varsa, fonksiyondan çık
        if (tableCheck.rows[0].exists) {
            console.log('Admin tabloları zaten mevcut');
            return;
        }

        // Admins tablosunu oluştur
        await pool.query(`
            CREATE TABLE admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                role VARCHAR(20) DEFAULT 'admin',
                is_super_admin BOOLEAN DEFAULT false,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        `);

        console.log('Admins tablosu oluşturuldu');

        // Admin rolleri tablosunu oluştur
        await pool.query(`
            CREATE TABLE admin_roles (
                id SERIAL PRIMARY KEY,
                admin_id INTEGER REFERENCES admins(id),
                role_name VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(admin_id, role_name)
            )
        `);

        console.log('Admin rolleri tablosu oluşturuldu');

        // Varsayılan admin hesabını oluştur
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const adminResult = await pool.query(`
            INSERT INTO admins (
                username,
                email,
                password,
                full_name,
                role,
                is_super_admin
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [
            'superadmin',
            'admin@eticaret.com',
            hashedPassword,
            'Super Admin',
            'super_admin',
            true
        ]);

        const adminId = adminResult.rows[0].id;
        console.log('Admin hesabı oluşturuldu');

        // Varsayılan rolleri ekle
        const defaultRoles = [
            'view_products',
            'add_products',
            'edit_products',
            'delete_products',
            'view_categories',
            'add_categories',
            'edit_categories',
            'delete_categories'
        ];

        // Rolleri ekle
        for (const role of defaultRoles) {
            await pool.query(`
                INSERT INTO admin_roles (admin_id, role_name) 
                VALUES ($1, $2)
                ON CONFLICT (admin_id, role_name) DO NOTHING
            `, [adminId, role]);
        }

        console.log('Admin rolleri eklendi');

    } catch (error) {
        // Eğer hata "relation already exists" hatası ise, sessizce devam et
        if (error.code === '42P07') {
            console.log('Tablolar zaten mevcut');
            return;
        }
        console.error('Tablo oluşturma hatası:', error);
        throw error;
    }
}

// Tabloları oluştur ve varsayılan verileri ekle
createTables().catch(console.error);

module.exports = {
    createTables
}; 