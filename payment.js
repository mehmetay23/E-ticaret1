// API URL'i
window.API_URL = 'http://localhost:3000/api';

// Türkiye şehirleri
const cities = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
    "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
    "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari",
    "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
    "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
];

// İlçeler veritabanı (Örnek olarak bazı şehirlerin ilçeleri)
const districts = {
    "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüp", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
    "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Balâ", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kalecik", "Kazan", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
    "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"]
};

// Global değişkenler
let currentStep = 1;
let steps;
let sections;

const payment = {
    items: [],

    // Sepeti yükle
    loadCart() {
        try {
            // LocalStorage'dan sepeti al
            const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            console.log('Yüklenen sepet öğeleri:', cartItems);

            if (cartItems.length === 0) {
                console.log('Sepet boş');
                window.location.href = 'cart.html';
                return;
            }

            this.items = cartItems;
            this.updateOrderSummary();

        } catch (error) {
            console.error('Sepet yükleme hatası:', error);
            showNotification('Sepet yüklenirken bir hata oluştu', 'error');
        }
    },

    // Sipariş özetini güncelle
    updateOrderSummary() {
        const orderItems = document.getElementById('orderItems');
        
        if (orderItems) {
            orderItems.innerHTML = this.items.map(item => `
                <div class="summary-item">
                    <div class="item-image">
                        <img src="${item.image_url || '/images/placeholder.jpg'}" 
                             alt="${item.name}"
                             onerror="this.src='/images/placeholder.jpg'"
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                    </div>
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <p class="item-category">${item.category_name || 'Genel'}</p>
                        <div class="item-price-qty">
                            <span>${item.quantity} adet</span>
                            <span>${formatPrice(item.price * item.quantity)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        this.updateTotals();
    },

    // Toplamları güncelle
    updateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 150 ? 0 : 29.90;
        const tax = subtotal * 0.18;
        const total = subtotal + shipping + tax;

        // Toplamları DOM'a yaz
        const elements = {
            subtotal: document.getElementById('subtotal'),
            shipping: document.getElementById('shipping'),
            tax: document.getElementById('tax'),
            total: document.getElementById('total')
        };

        if (elements.subtotal) elements.subtotal.textContent = formatPrice(subtotal);
        if (elements.shipping) elements.shipping.textContent = formatPrice(shipping);
        if (elements.tax) elements.tax.textContent = formatPrice(tax);
        if (elements.total) elements.total.textContent = formatPrice(total);
    },

    // Kart numarası formatla
    formatCardNumber(input) {
        let value = input.value.replace(/\D/g, '');
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        input.value = value;
    },

    // Son kullanma tarihi formatla
    formatExpiryDate(input) {
        let value = input.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0,2) + '/' + value.slice(2);
        }
        input.value = value;
    },

    // Ödeme işlemini gerçekleştir
    async processPayment(formData) {
        try {
            // LocalStorage'dan sepet öğelerini al
            const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            
            const response = await fetch(`${API_URL}/orders/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    cardName: formData.cardName,
                    cardNumber: formData.cardNumber.replace(/\s/g, ''),
                    expiryDate: formData.expiryDate,
                    cvv: formData.cvv,
                    amount: this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    cartItems: cartItems // Sepet öğelerini de gönder
                })
            });

            if (!response.ok) {
                throw new Error('Ödeme işlemi başarısız');
            }

            // Başarılı ödeme sonrası
            localStorage.removeItem('cartItems'); // Sepeti temizle
            window.location.href = 'order-success.html'; // Başarılı sayfasına yönlendir

        } catch (error) {
            console.error('Ödeme hatası:', error);
            showNotification('Ödeme işlemi başarısız oldu', 'error');
        }
    }
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    payment.loadCart();

    // Kart numarası formatla
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => payment.formatCardNumber(e.target));
    }

    // Son kullanma tarihi formatla
    const expiryDate = document.getElementById('expiryDate');
    if (expiryDate) {
        expiryDate.addEventListener('input', (e) => payment.formatExpiryDate(e.target));
    }

    // Form submit
    const cardForm = document.getElementById('cardForm');
    if (cardForm) {
        cardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                cardName: document.getElementById('cardName').value,
                cardNumber: document.getElementById('cardNumber').value,
                expiryDate: document.getElementById('expiryDate').value,
                cvv: document.getElementById('cvv').value
            };
            await payment.processPayment(formData);
        });
    }
});

// Para formatı için yardımcı fonksiyon
function formatPrice(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
} 