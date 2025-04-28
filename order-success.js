document.addEventListener('DOMContentLoaded', async function() {
    try {
        // URL'den sipariş ID'sini al
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');

        if (!orderId) {
            window.location.href = 'orders.html';
            return;
        }

        // Sipariş detaylarını getir
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Sipariş bilgileri alınamadı');
        }

        const order = await response.json();

        // Sipariş numarasını göster
        document.getElementById('orderNumber').textContent = `#${order.id}`;

        // Sipariş tarihini göster
        const orderDate = new Date(order.created_at);
        document.getElementById('orderDate').textContent = orderDate.toLocaleString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Teslimat adresini göster
        if (order.address) {
            document.getElementById('deliveryAddress').innerHTML = `
                ${order.address.full_name}<br>
                ${order.address.address}<br>
                ${order.address.district}/${order.address.city}
            `;
        }

        // Sipariş ürünlerini göster
        const orderItems = document.getElementById('orderItems');
        orderItems.innerHTML = order.items.map(item => `
            <div class="order-item">
                <img src="${item.image_url || 'https://via.placeholder.com/60'}" 
                     alt="${item.name}"
                     onerror="this.src='https://via.placeholder.com/60'">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>${item.quantity} adet</p>
                </div>
                <div class="item-price">
                    ${formatPrice(item.price * item.quantity)}
                </div>
            </div>
        `).join('');

        // Toplamları göster
        document.getElementById('subtotal').textContent = formatPrice(order.subtotal);
        document.getElementById('shipping').textContent = formatPrice(order.shipping_cost);
        document.getElementById('tax').textContent = formatPrice(order.tax_amount);
        document.getElementById('total').textContent = formatPrice(order.total);

    } catch (error) {
        console.error('Sipariş detayları yüklenirken hata:', error);
        showNotification('Sipariş detayları yüklenemedi', 'error');
    }
});

// Para formatı için yardımcı fonksiyon
function formatPrice(price) {
    return price.toLocaleString('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    });
}

// Bildirim göster
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
} 