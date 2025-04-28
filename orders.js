const orders = {
    // Sayfa yüklendiğinde çalışacak
    init() {
        this.loadOrders();
        this.initTabEvents();
    },

    // Tab olaylarını başlat
    initTabEvents() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Aktif tab'ı değiştir
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Siparişleri filtrele
                const status = tab.dataset.status;
                this.filterOrders(status);
            });
        });
    },

    // Örnek sipariş verileri
    sampleOrders: [
        {
            id: 64,
            date: '26.12.2024',
            status: 'delivered',
            items: [
                {
                    id: 1,
                    name: 'Modern Koltuk Takımı',
                    image_url: 'images/products/koltuk.jpg',
                    price: 14999.99,
                    quantity: 1
                },
                {
                    id: 2,
                    name: 'LED Avize',
                    image_url: 'images/products/avize.jpg',
                    price: 1299.99,
                    quantity: 1
                }
            ],
            total: 35635.95
        },
        {
            id: 65,
            date: '27.12.2024',
            status: 'pending',
            items: [
                {
                    id: 3,
                    name: 'Yemek Takımı',
                    image_url: 'images/products/yemek.jpg',
                    price: 899.99,
                    quantity: 2
                }
            ],
            total: 1799.98
        }
    ],

    // Siparişleri yükle
    loadOrders() {
        return this.sampleOrders;
    },

    // Siparişleri görüntüle
    displayOrders(orders) {
        const ordersContainer = document.getElementById('ordersList');
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-box-open"></i>
                    <h2>Henüz Siparişiniz Bulunmuyor</h2>
                    <p>Alışverişe başlamak için aşağıdaki butonu kullanabilirsiniz.</p>
                    <a href="index.html" class="shop-now-btn">Alışverişe Başla</a>
                </div>
            `;
            return;
        }

        ordersContainer.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-id">Sipariş No: #${order.id}</div>
                        <div class="order-date">${order.date}</div>
                    </div>
                    <span class="order-status status-${order.status}">
                        ${this.getStatusText(order.status)}
                    </span>
                </div>

                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <div class="item-image">
                                <img src="${item.image_url}" alt="${item.name}" 
                                     onerror="this.src='images/placeholder.jpg'">
                            </div>
                            <div class="item-details">
                                <h4>${item.name}</h4>
                                <p class="item-quantity">Adet: ${item.quantity}</p>
                                <p class="item-price">${formatPrice(item.price * item.quantity)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="order-footer">
                    <div class="order-total">
                        <span>Toplam Tutar:</span> ${formatPrice(order.total)}
                    </div>
                    <div class="order-actions">
                        <button class="track-btn" onclick="orders.trackOrder(${order.id})">
                            <i class="fas fa-truck"></i>
                            Kargo Takip
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Siparişleri filtrele
    filterOrders(status) {
        const allOrders = this.loadOrders();
        if (status === 'all') {
            this.displayOrders(allOrders);
        } else {
            const filteredOrders = allOrders.filter(order => order.status === status);
            this.displayOrders(filteredOrders);
        }
    },

    // Sipariş durumu metnini al
    getStatusText(status) {
        const statusMap = {
            'pending': 'Beklemede',
            'processing': 'Hazırlanıyor',
            'shipped': 'Kargoda',
            'delivered': 'Teslim Edildi'
        };
        return statusMap[status] || status;
    },

    // Kargo takip
    trackOrder(orderId) {
        alert(`${orderId} numaralı siparişinizin kargo takip sayfası açılıyor...`);
        // Burada kargo takip sayfasına yönlendirme yapılabilir
    }
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    orders.init();
});

// Para formatı için yardımcı fonksiyon
function formatPrice(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
} 