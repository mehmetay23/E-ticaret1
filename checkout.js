const checkout = {
    // Sayfa yüklendiğinde çalışacak
    init() {
        this.loadAddresses();
        this.loadOrderSummary();
    },

    // Kayıtlı adresleri yükle
    loadAddresses() {
        const savedAddresses = JSON.parse(localStorage.getItem('addresses')) || [];
        const addressesContainer = document.getElementById('savedAddresses');

        if (savedAddresses.length === 0) {
            addressesContainer.innerHTML = `
                <p class="no-address">Kayıtlı adresiniz bulunmuyor.</p>
            `;
            return;
        }

        addressesContainer.innerHTML = savedAddresses.map(address => `
            <div class="address-card ${address.isDefault ? 'selected' : ''}" onclick="checkout.selectAddress(${address.id})">
                <div class="address-name">${address.fullName}</div>
                <div class="address-details">
                    ${address.address}<br>
                    ${address.district} / ${address.city}<br>
                    Tel: ${address.phone}
                </div>
                <div class="address-actions">
                    <button onclick="checkout.removeAddress(${address.id}, event)" class="remove-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Adres formunu göster
    showAddressForm() {
        document.getElementById('addressForm').style.display = 'block';
    },

    // Adres formunu gizle
    hideAddressForm() {
        document.getElementById('addressForm').style.display = 'none';
    },

    // Yeni adres kaydet
    saveAddress(event) {
        event.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const phone = document.getElementById('phone').value;
        const city = document.getElementById('city').value;
        const district = document.getElementById('district').value;
        const address = document.getElementById('address').value;

        const savedAddresses = JSON.parse(localStorage.getItem('addresses')) || [];
        const newAddress = {
            id: Date.now(),
            fullName,
            phone,
            city,
            district,
            address,
            isDefault: savedAddresses.length === 0 // İlk adres varsayılan olsun
        };

        savedAddresses.push(newAddress);
        localStorage.setItem('addresses', JSON.stringify(savedAddresses));

        this.loadAddresses();
        this.hideAddressForm();
        event.target.reset();
    },

    // Adres seç
    selectAddress(addressId) {
        const addresses = JSON.parse(localStorage.getItem('addresses')) || [];
        addresses.forEach(address => {
            address.isDefault = address.id === addressId;
        });
        localStorage.setItem('addresses', JSON.stringify(addresses));
        this.loadAddresses();
    },

    // Adres sil
    removeAddress(addressId, event) {
        event.stopPropagation();
        if (!confirm('Bu adresi silmek istediğinize emin misiniz?')) return;

        let addresses = JSON.parse(localStorage.getItem('addresses')) || [];
        addresses = addresses.filter(address => address.id !== addressId);
        
        // Eğer silinen adres varsayılan ise ve başka adres varsa, ilk adresi varsayılan yap
        if (addresses.length > 0 && !addresses.some(a => a.isDefault)) {
            addresses[0].isDefault = true;
        }

        localStorage.setItem('addresses', JSON.stringify(addresses));
        this.loadAddresses();
    },

    // Sipariş özetini yükle
    loadOrderSummary() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const orderItemsContainer = document.getElementById('orderItems');

        if (cartItems.length === 0) {
            orderItemsContainer.innerHTML = '<p class="no-items">Sepetinizde ürün bulunmuyor.</p>';
            return;
        }

        orderItemsContainer.innerHTML = cartItems.map(item => `
            <div class="order-item">
                <div class="item-image">
                    <img src="${item.image_url}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p class="item-quantity">Adet: ${item.quantity}</p>
                    <p class="item-price">${formatPrice(item.price * item.quantity)}</p>
                </div>
            </div>
        `).join('');

        this.updateTotals();
    },

    // Toplamları güncelle
    updateTotals() {
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 150 ? 0 : 29.90;
        const tax = subtotal * 0.18;
        const total = subtotal + shipping + tax;

        document.getElementById('subtotal').textContent = formatPrice(subtotal);
        document.getElementById('shipping').textContent = formatPrice(shipping);
        document.getElementById('tax').textContent = formatPrice(tax);
        document.getElementById('total').textContent = formatPrice(total);
    },

    // Ödemeye geç
    proceedToPayment() {
        const addresses = JSON.parse(localStorage.getItem('addresses')) || [];
        const defaultAddress = addresses.find(a => a.isDefault);

        if (!defaultAddress) {
            showNotification('Lütfen teslimat adresi seçin', 'error');
            return;
        }

        window.location.href = 'payment.html';
    }
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    checkout.init();
});

// Para formatı için yardımcı fonksiyon
function formatPrice(amount) {
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
    }).format(amount);
} 