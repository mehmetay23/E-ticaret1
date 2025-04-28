const { Pool } = require('pg');
const OpenAI = require('openai');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// Veritabanı bağlantısı
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    client_encoding: 'UTF8'
});

// Veritabanı bağlantısını test et
pool.connect((err, client, done) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err);
    } else {
        console.log('Veritabanına başarıyla bağlanıldı');
        done();
    }
});

// OpenAI yapılandırması
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Site verilerini topla
async function collectSiteData() {
    try {
        console.log('Site verileri toplanıyor...');

        // Sabit kategori verileri
        const categories = [
            {
                id: 1,
                name: "Elektronik",
                description: "Elektronik kategorisindeki tüm ürünleri keşfedin",
                product_count: 6
            },
            {
                id: 2,
                name: "Giyim",
                description: "Giyim kategorisindeki tüm ürünleri keşfedin",
                product_count: 6
            },
            {
                id: 3,
                name: "Ev & Yaşam",
                description: "Ev & Yaşam kategorisindeki tüm ürünleri keşfedin",
                product_count: 6
            },
            {
                id: 4,
                name: "Spor & Outdoor",
                description: "Spor & Outdoor kategorisindeki tüm ürünleri keşfedin",
                product_count: 6
            },
            {
                id: 5,
                name: "Kozmetik",
                description: "Kozmetik kategorisindeki tüm ürünleri keşfedin",
                product_count: 6
            },
            {
                id: 6,
                name: "Kitap & Hobi",
                description: "Kitap & Hobi kategorisindeki tüm ürünleri keşfedin",
                product_count: 6
            }
        ];

        // Sabit ürün verileri
        const products = [
            {
                id: 2,
                name: "Ultra İnce Laptop",
                description: "15.6 inç, 16GB RAM, 512GB SSD",
                price: 12999.99,
                stock: 3,
                category: "Elektronik",
                total_sales: 9
            },
            {
                id: 3,
                name: "Kablosuz Kulaklık",
                description: "Aktif gürültü önleme, 30 saat pil ömrü",
                price: 1999.99,
                stock: 82,
                category: "Elektronik",
                total_sales: 7
            },
            {
                id: 4,
                name: "Akıllı Saat",
                description: "Nabız ölçer, GPS, su geçirmez",
                price: 2499.99,
                stock: 24,
                category: "Elektronik",
                total_sales: 4
            },
            {
                id: 12,
                name: "Pamuklu T-shirt",
                description: "Basic, beyaz, %100 pamuk",
                price: 149.99,
                stock: 196,
                category: "Giyim",
                total_sales: 3
            },
            {
                id: 15,
                name: "Yemek Takımı",
                description: "24 parça porselen set",
                price: 899.99,
                stock: 45,
                category: "Ev & Yaşam",
                total_sales: 2
            },
            {
                id: 7,
                name: "Klasik Takım Elbise",
                description: "Slim fit, siyah, %100 yün",
                price: 2999.99,
                stock: 30,
                category: "Giyim",
                total_sales: 2
            },
            {
                id: 1,
                name: "Akıllı Telefon Pro",
                description: "6.7 inç ekran, 256GB depolama, 48MP kamera",
                price: 14999.99,
                stock: 33,
                category: "Elektronik",
                total_sales: 2
            },
            {
                id: 32,
                name: "Profesyonel Boya Seti",
                description: "24 renk akrilik boya set",
                price: 399.99,
                stock: 48,
                category: "Kitap & Hobi",
                total_sales: 2
            },
            {
                id: 11,
                name: "Deri Ceket",
                description: "Siyah, hakiki deri",
                price: 1999.99,
                stock: 21,
                category: "Giyim",
                total_sales: 2
            },
            {
                id: 13,
                name: "Modern Koltuk Takımı",
                description: "3+3+1, gri, silinebilir kumaş",
                price: 14999.99,
                stock: 6,
                category: "Ev & Yaşam",
                total_sales: 2
            },
            {
                id: 14,
                name: "LED Avize",
                description: "Uzaktan kumandalı, dim özellikli",
                price: 1299.99,
                stock: 31,
                category: "Ev & Yaşam",
                total_sales: 2
            },
            {
                id: 6,
                name: "Bluetooth Hoparlör",
                description: "360 derece ses, 12 saat pil ömrü",
                price: 899.99,
                stock: 52,
                category: "Elektronik",
                total_sales: 1
            },
            {
                id: 16,
                name: "Yatak Örtüsü Set",
                description: "Çift kişilik, pamuklu",
                price: 499.99,
                stock: 58,
                category: "Ev & Yaşam",
                total_sales: 1
            },
            {
                id: 20,
                name: "Dağ Bisikleti",
                description: "21 vites, amortisörlü",
                price: 4999.99,
                stock: 17,
                category: "Spor & Outdoor",
                total_sales: 1
            },
            {
                id: 9,
                name: "Kot Pantolon",
                description: "Regular fit, mavi, streç",
                price: 399.99,
                stock: 113,
                category: "Giyim",
                total_sales: 1
            },
            {
                id: 36,
                name: "Müzik Seti",
                description: "Akustik gitar başlangıç seti",
                price: 1299.99,
                stock: 19,
                category: "Kitap & Hobi",
                total_sales: 1
            },
            {
                id: 10,
                name: "Triko Kazak",
                description: "Boğazlı, gri, soft dokuma",
                price: 299.99,
                stock: 63,
                category: "Giyim",
                total_sales: 1
            },
            {
                id: 34,
                name: "Puzzle",
                description: "2000 parça manzara puzzle",
                price: 199.99,
                stock: 60,
                category: "Kitap & Hobi",
                total_sales: 0
            },
            {
                id: 35,
                name: "Model Araba Kit",
                description: "1/24 ölçek, detaylı kit",
                price: 599.99,
                stock: 25,
                category: "Kitap & Hobi",
                total_sales: 0
            },
            {
                id: 23,
                name: "Dumbell Set",
                description: "2x5kg, 2x10kg, stand hediyeli",
                price: 899.99,
                stock: 45,
                category: "Spor & Outdoor",
                total_sales: 0
            },
            {
                id: 8,
                name: "Spor Ayakkabı",
                description: "Hafif, nefes alabilir materyal",
                price: 799.99,
                stock: 73,
                category: "Giyim",
                total_sales: 0
            },
            {
                id: 17,
                name: "Akıllı Robot Süpürge",
                description: "Wi-Fi bağlantılı, otomatik şarj",
                price: 3999.99,
                stock: 22,
                category: "Ev & Yaşam",
                total_sales: 0
            },
            {
                id: 18,
                name: "Dekoratif Ayna",
                description: "Altın çerçeveli, 80x120cm",
                price: 799.99,
                stock: 30,
                category: "Ev & Yaşam",
                total_sales: 0
            },
            {
                id: 5,
                name: "Oyun Konsolu",
                description: "4K gaming, 1TB depolama, 2 kontrolcü",
                price: 8999.99,
                stock: 25,
                category: "Elektronik",
                total_sales: 0
            },
            {
                id: 24,
                name: "Trekking Botu",
                description: "Su geçirmez, vibram taban",
                price: 899.99,
                stock: 35,
                category: "Spor & Outdoor",
                total_sales: 0
            },
            {
                id: 25,
                name: "Parfüm Set",
                description: "Kadın ve erkek parfüm seti",
                price: 999.99,
                stock: 55,
                category: "Kozmetik",
                total_sales: 0
            },
            {
                id: 26,
                name: "Cilt Bakım Seti",
                description: "Nemlendirici, tonik, serum",
                price: 599.99,
                stock: 70,
                category: "Kozmetik",
                total_sales: 0
            },
            {
                id: 27,
                name: "Makyaj Paleti",
                description: "18 renk göz farı",
                price: 299.99,
                stock: 85,
                category: "Kozmetik",
                total_sales: 0
            },
            {
                id: 28,
                name: "Saç Düzleştirici",
                description: "Seramik kaplama, LCD ekran",
                price: 449.99,
                stock: 40,
                category: "Kozmetik",
                total_sales: 0
            },
            {
                id: 19,
                name: "Koşu Bandı",
                description: "Katlanabilir, 12 program",
                price: 7999.99,
                stock: 14,
                category: "Spor & Outdoor",
                total_sales: 0
            },
            {
                id: 21,
                name: "Kamp Çadırı",
                description: "4 kişilik, su geçirmez",
                price: 1499.99,
                stock: 40,
                category: "Spor & Outdoor",
                total_sales: 0
            },
            {
                id: 22,
                name: "Yoga Matı",
                description: "Kaymaz taban, 6mm kalınlık",
                price: 199.99,
                stock: 100,
                category: "Spor & Outdoor",
                total_sales: 0
            },
            {
                id: 29,
                name: "Tıraş Makinesi",
                description: "Şarjlı, su geçirmez",
                price: 699.99,
                stock: 60,
                category: "Kozmetik",
                total_sales: 0
            },
            {
                id: 30,
                name: "El Kremi Set",
                description: "3lü organik el kremi seti",
                price: 149.99,
                stock: 120,
                category: "Kozmetik",
                total_sales: 0
            },
            {
                id: 31,
                name: "Bestseller Set",
                description: "5 kitaplık roman seti",
                price: 299.99,
                stock: 45,
                category: "Kitap & Hobi",
                total_sales: 0
            },
            {
                id: 33,
                name: "Satranç Takımı",
                description: "Ahşap, manyetik",
                price: 249.99,
                stock: 35,
                category: "Kitap & Hobi",
                total_sales: 0
            }
        ];

        // Verileri formatla
        const siteData = {
            categories: categories.map(cat => ({
                name: cat.name,
                description: cat.description,
                productCount: cat.product_count,
                categoryId: cat.id
            })),
            products: products.map(prod => ({
                name: prod.name,
                description: prod.description,
                price: prod.price,
                stock: prod.stock,
                category: prod.category,
                totalSales: prod.total_sales
            }))
        };

        console.log('Site verileri başarıyla toplandı');
        return siteData;
    } catch (error) {
        console.error('Veri toplama hatası:', error);
        return {
            categories: [],
            products: []
        };
    }
}

// ChatGPT system prompt'unu oluştur
function createSystemPrompt(siteData) {
    // Kategorilere göre ürünleri grupla
    const productsByCategory = {};
    siteData.products.forEach(prod => {
        if (!productsByCategory[prod.category]) {
            productsByCategory[prod.category] = [];
        }
        productsByCategory[prod.category].push(prod);
    });

    // En çok satan ürünleri bul
    const bestSellers = [...siteData.products]
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 5);

    return `Sen bir e-ticaret sitesi asistanısın. Aşağıdaki bilgilere göre müşterilere yardımcı olacaksın:

KATEGORİLER VE ÜRÜNLERİ:
${Object.entries(productsByCategory).map(([category, products]) => 
    `${category}:
${products.map(prod => 
    `- ${prod.name}: ${prod.description}
  Fiyat: ${prod.price.toFixed(2)}TL, Stok: ${prod.stock} adet
  Satış: ${prod.totalSales} adet`
).join('\n')}`
).join('\n\n')}

EN ÇOK SATAN ÜRÜNLER:
${bestSellers.map(prod => 
    `- ${prod.name} (${prod.totalSales} adet satış)
  Fiyat: ${prod.price.toFixed(2)}TL, Stok: ${prod.stock} adet
  ${prod.description}`
).join('\n\n')}

FİYAT ARALIKLARINDA ÜRÜNLER:
Ekonomik (0-500TL):
${siteData.products.filter(p => p.price <= 500).map(p => `- ${p.name}: ${p.price.toFixed(2)}TL`).join('\n')}

Orta Segment (501-2000TL):
${siteData.products.filter(p => p.price > 500 && p.price <= 2000).map(p => `- ${p.name}: ${p.price.toFixed(2)}TL`).join('\n')}

Premium (2000TL üzeri):
${siteData.products.filter(p => p.price > 2000).map(p => `- ${p.name}: ${p.price.toFixed(2)}TL`).join('\n')}

STOK DURUMU:
Az Kalan Ürünler (10 ve altı):
${siteData.products.filter(p => p.stock <= 10).map(p => `- ${p.name}: ${p.stock} adet kaldı!`).join('\n')}

FİYAT ARALIKLARINDA ÜRÜNLER:
Ekonomik (0-500TL):
${siteData.products.filter(p => p.price <= 500).map(p => `- ${p.name}: ${p.price.toFixed(2)}TL`).join('\n')}

Orta Segment (501-2000TL):
${siteData.products.filter(p => p.price > 500 && p.price <= 2000).map(p => `- ${p.name}: ${p.price.toFixed(2)}TL`).join('\n')}

Premium (2000TL üzeri):
${siteData.products.filter(p => p.price > 2000).map(p => `- ${p.name}: ${p.price.toFixed(2)}TL`).join('\n')}

STOK DURUMU:
Az Kalan Ürünler (10 ve altı):
${siteData.products.filter(p => p.stock <= 10).map(p => `- ${p.name}: ${p.stock} adet kaldı!`).join('\n')}

Görevlerin:
1. Ürün ve Kategori Bilgileri:
   - Ürünlerin fiyat, stok ve özelliklerini paylaş
   - Kategorilerdeki ürün çeşitlerini anlat
   - Stok durumları hakkında bilgi ver

2. Alışveriş Önerileri:
   - Bütçeye göre ürün önerileri yap
   - En çok satan ürünleri öner
   - Kategoriye özel öneriler sun

3. Stok ve Fiyat Bilgilendirmesi:
   - Stok durumunu kontrol et
   - Fiyat karşılaştırması yap
   - İndirimli ürünleri öner

4. Sayfa Yönlendirmeleri:
   - Ürünler sayfasına yönlendirme için: "Tabii, sizi ürünler sayfamıza yönlendiriyorum. <a href='http://localhost:5500/products.html'>Buraya tıklayarak</a> tüm ürünlerimizi görebilirsiniz. İyi alışverişler dilerim!"
   - Kategori sayfalarına yönlendirme için: <a href="http://localhost:5500/categories/KATEGORİ_ID">Kategori Adı</a> formatını kullan
   - Ürün detay sayfalarına yönlendirme için: <a href="http://localhost:5500/products/URUN_ID">Ürün Adı</a> formatını kullan

Her zaman nazik ve profesyonel ol. Bilmediğin konularda müşteri hizmetlerine yönlendir.
Yanıtların kısa, öz ve Türkçe karakterleri doğru kullanmalı.
Fiyat bilgisi verirken TL sembolünü kullan ve virgülden sonra iki basamak göster (örn: 149,99TL).

Örnek Yanıtlar:
- "Tabii, sizi ürünler sayfamıza yönlendiriyorum. <a href='http://localhost:5500/products.html'>Buraya tıklayarak</a> tüm ürünlerimizi görebilirsiniz. İyi alışverişler dilerim!"
- "Elektronik kategorisinde en çok satan ürünümüz Ultra İnce Laptop'tur. <a href='http://localhost:5500/categories/1'>Elektronik kategorisini incelemek için tıklayın</a>"
- "500TL altı ürünlerimizi görmek için <a href='http://localhost:5500/products?price=0-500'>buraya tıklayabilirsiniz</a>."
- "Spor & Outdoor kategorisinde yoga matından koşu bandına kadar geniş bir ürün yelpazemiz bulunmaktadır. <a href='http://localhost:5500/categories/4'>Kategoriye göz atmak için tıklayın</a>"`;
}

// ChatGPT ile sohbet
async function chatWithAI(userMessage, systemPrompt) {
    try {
        console.log('ChatGPT isteği gönderiliyor...');
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        console.log('ChatGPT yanıtı alındı');
        
        if (!completion.choices || completion.choices.length === 0) {
            throw new Error('ChatGPT geçerli bir yanıt vermedi');
        }

        return completion.choices[0].message.content;
    } catch (error) {
        console.error('ChatGPT API hatası:', error);
        throw new Error('ChatGPT yanıt verirken bir hata oluştu: ' + error.message);
    }
}

// Ana chatbot fonksiyonu
async function handleChat(userMessage) {
    if (!userMessage || typeof userMessage !== 'string') {
        throw new Error('Geçersiz mesaj formatı');
    }

    try {
        console.log('Chat isteği alındı:', userMessage);
        
        // Site verilerini topla
        const siteData = await collectSiteData();
        console.log('Site verileri toplandı');
        
        if (!siteData.categories.length && !siteData.products.length) {
            console.warn('Dikkat: Veritabanından veri alınamadı');
        }
        
        // System prompt'u oluştur
        const systemPrompt = createSystemPrompt(siteData);
        console.log('System prompt oluşturuldu');
        
        // ChatGPT'den yanıt al
        const response = await chatWithAI(userMessage, systemPrompt);
        console.log('ChatGPT yanıtı:', response);
        
        return response;
    } catch (error) {
        console.error('Chatbot hatası:', error);
        throw new Error('Chatbot yanıt verirken bir hata oluştu: ' + error.message);
    }
}

// Uygulama kapatıldığında veritabanı bağlantısını kapat
process.on('SIGINT', async () => {
    try {
        await pool.end();
        console.log('Veritabanı bağlantısı kapatıldı');
        process.exit(0);
    } catch (error) {
        console.error('Veritabanı kapatma hatası:', error);
        process.exit(1);
    }
});

module.exports = { handleChat };

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token gerekli' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Geçersiz token' });
        }
        req.user = user;
        next();
    });
} 