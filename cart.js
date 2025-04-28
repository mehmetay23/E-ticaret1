const cart = {
    items: [],

    // Sepeti yükle
    loadCart() {
        try {
            // LocalStorage'dan sepeti al
            const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            console.log('Yüklenen sepet öğeleri:', cartItems);
            this.items = cartItems;
            this.updateCartDisplay();
        } catch (error) {
            console.error('Sepet yükleme hatası:', error);
            showNotification('Sepet yüklenirken bir hata oluştu', 'error');
        }
    },

    // Ürünü sepete ekle
    addToCart(product) {
        try {
            // LocalStorage'dan mevcut sepeti al
            const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            
            // Ürün zaten sepette var mı kontrol et
            const existingItem = cartItems.find(item => item.id === product.id);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cartItems.push({
                    ...product,
                    quantity: 1
                });
            }

            // Sepeti localStorage'a kaydet
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            this.items = cartItems;
            this.updateCartDisplay();
            
            showNotification('Ürün sepete eklendi', 'success');
        } catch (error) {
            console.error('Sepete ekleme hatası:', error);
            showNotification('Ürün sepete eklenirken bir hata oluştu', 'error');
        }
    },

    // Sepet görünümünü güncelle
    updateCartDisplay() {
        const cartItems = document.getElementById('cartItems');
        
        if (cartItems) {
            if (this.items.length === 0) {
                cartItems.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-cart"></i>
                        <h2>Sepetiniz Boş</h2>
                        <p>Alışverişe başlamak için ürünleri incelemeye başlayabilirsiniz.</p>
                        <a href="index.html" class="shop-now-btn">Alışverişe Başla</a>
                    </div>
                `;
                document.querySelector('.cart-summary').style.display = 'none';
                return;
            }

            document.querySelector('.cart-summary').style.display = 'block';
            cartItems.innerHTML = this.items.map(item => `
                <div class="cart-item">
                    <div class="item-image">
                        <img src="${item.image_url}" alt="${item.name}">
                    </div>
                    <div class="item-details">
                        <h3>${item.name}</h3>
                        <p class="item-category">${item.category_name}</p>
                        <div class="item-price">${formatPrice(item.price)}</div>
                    </div>
                    <div class="item-quantity">
                        <button onclick="cart.decreaseQuantity(${item.id})" class="quantity-btn">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="cart.increaseQuantity(${item.id})" class="quantity-btn">+</button>
                    </div>
                    <div class="item-total">
                        ${formatPrice(item.price * item.quantity)}
                    </div>
                    <button onclick="cart.removeItem(${item.id})" class="remove-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }

        this.updateTotals();
    },

    // Miktarı artır
    increaseQuantity(productId) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            item.quantity++;
            localStorage.setItem('cartItems', JSON.stringify(this.items));
            this.updateCartDisplay();
        }
    },

    // Miktarı azalt
    decreaseQuantity(productId) {
        const item = this.items.find(item => item.id === productId);
        if (item && item.quantity > 1) {
            item.quantity--;
            localStorage.setItem('cartItems', JSON.stringify(this.items));
            this.updateCartDisplay();
        }
    },

    // Ürünü sepetten kaldır
    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        localStorage.setItem('cartItems', JSON.stringify(this.items));
        this.updateCartDisplay();
        showNotification('Ürün sepetten kaldırıldı', 'success');
    },

    // Toplamları güncelle
    updateTotals() {
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 150 ? 0 : 29.90;
        const tax = subtotal * 0.18;
        const total = subtotal + shipping + tax;

        document.getElementById('subtotal').textContent = formatPrice(subtotal);
        document.getElementById('shipping').textContent = formatPrice(shipping);
        document.getElementById('tax').textContent = formatPrice(tax);
        document.getElementById('total').textContent = formatPrice(total);
    },

    // Ödeme sayfasına git
    proceedToCheckout() {
        if (this.items.length > 0) {
            window.location.href = 'checkout.html';
        } else {
            showNotification('Sepetiniz boş', 'error');
        }
    }
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    cart.loadCart();
}); 