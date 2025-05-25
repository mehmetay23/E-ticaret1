// Global değişkenleri tek bir yerde tanımla
const API_URL = 'http://localhost:3000/api';
window.showOrders = null; // showOrders değişkenini global olarak tanımla

// --- Öne Çıkan Ürünler Animasyonlu ---
let allFeaturedProducts = [];
let featuredInterval;
let featuredIndex = 0;

async function loadAnimatedFeaturedProducts() {
    try {
        const response = await fetch('http://localhost:3000/api/categories');
        const categories = await response.json();
        // Tüm ürünleri topla
        allFeaturedProducts = categories.flatMap(category => category.products || []).filter(Boolean);
        if (allFeaturedProducts.length < 4) return;
        featuredIndex = 0;
        showSequentialFeaturedProducts();
        // Her 10 saniyede bir değiştir
        if (featuredInterval) clearInterval(featuredInterval);
        featuredInterval = setInterval(showSequentialFeaturedProducts, 10000);
    } catch (error) {
        console.error('Animasyonlu öne çıkan ürünler yüklenirken hata:', error);
    }
}

function showSequentialFeaturedProducts() {
    const featuredProducts = document.getElementById('featuredProducts');
    if (!featuredProducts || allFeaturedProducts.length < 4) return;
    // Sırayla 4'lü grup seç
    const total = allFeaturedProducts.length;
    let group = [];
    for (let i = 0; i < 4; i++) {
        group.push(allFeaturedProducts[(featuredIndex + i) % total]);
    }
    featuredIndex = (featuredIndex + 1) % total;
    // Fade out
    featuredProducts.style.opacity = 0;
    setTimeout(() => {
        featuredProducts.innerHTML = group.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image_url}" 
                         alt="${product.name}"
                         onerror="handleImageError(this, 'product')">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="price">${product.price.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                    })}</p>
                </div>
            </div>
        `).join('');
        // Fade in
        featuredProducts.style.opacity = 1;
    }, 400);
}

document.addEventListener('DOMContentLoaded', loadAnimatedFeaturedProducts);
// --- Animasyon Sonu ---

// Kategorileri yükle ve dropdown'a ekle
async function loadCategories() {
    try {
        const response = await fetch('http://localhost:3000/api/categories');
        const categories = await response.json();
        
        // Dropdown içeriğini güncelle
        const categoriesList = document.getElementById('categoriesList');
        if (categoriesList) {
            categoriesList.innerHTML = categories.map(category => `
                <a href="products.html?category=${category.id}" class="category-item">
                    ${category.name}
                    <span class="product-count">(${category.product_count || 0})</span>
                </a>
            `).join('');
        }

        // Ana sayfadaki popüler kategorileri güncelle
        const categoryGrid = document.querySelector('.category-grid');
        if (categoryGrid) {
            categoryGrid.innerHTML = categories
                .filter(category => category.product_count > 0) // Sadece ürünü olan kategorileri göster
                .slice(0, 4) // İlk 4 kategoriyi al
                .map(category => `
                    <a href="products.html?category=${category.id}" class="category-card">
                        <div class="category-info">
                            <i class="${getCategoryIcon(category.name)}"></i>
                            <h3>${category.name}</h3>
                            <p>${category.description}</p>
                            <span class="product-count">${category.product_count} Ürün</span>
                        </div>
                    </a>
                `).join('');
        }

        // Öne çıkan ürünleri güncelle (animasyonlu)
        let allFeaturedProducts = [];
        let featuredInterval;
        let featuredIndex = 0;

        async function loadAnimatedFeaturedProducts() {
            try {
                const response = await fetch('http://localhost:3000/api/categories');
                const categories = await response.json();
                // Tüm ürünleri topla
                allFeaturedProducts = categories.flatMap(category => category.products || []).filter(Boolean);
                if (allFeaturedProducts.length < 4) return;
                featuredIndex = 0;
                showSequentialFeaturedProducts();
                // Her 10 saniyede bir değiştir
                if (featuredInterval) clearInterval(featuredInterval);
                featuredInterval = setInterval(showSequentialFeaturedProducts, 10000);
            } catch (error) {
                console.error('Animasyonlu öne çıkan ürünler yüklenirken hata:', error);
            }
        }

        function showSequentialFeaturedProducts() {
            const featuredProducts = document.getElementById('featuredProducts');
            if (!featuredProducts || allFeaturedProducts.length < 4) return;
            // Sırayla 4'lü grup seç
            const total = allFeaturedProducts.length;
            let group = [];
            for (let i = 0; i < 4; i++) {
                group.push(allFeaturedProducts[(featuredIndex + i) % total]);
            }
            featuredIndex = (featuredIndex + 1) % total;
            // Fade out
            featuredProducts.style.opacity = 0;
            setTimeout(() => {
                featuredProducts.innerHTML = group.map(product => `
                    <div class="product-card">
                        <div class="product-image">
                            <img src="${product.image_url}" 
                                 alt="${product.name}"
                                 onerror="handleImageError(this, 'product')">
                        </div>
                        <div class="product-info">
                            <h3>${product.name}</h3>
                            <p class="price">${product.price.toLocaleString('tr-TR', {
                                style: 'currency',
                                currency: 'TRY'
                            })}</p>
                        </div>
                    </div>
                `).join('');
                // Fade in
                featuredProducts.style.opacity = 1;
            }, 400);
        }

        // Sayfa yüklendiğinde animasyonlu öne çıkan ürünler başlat
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
            document.addEventListener('DOMContentLoaded', loadAnimatedFeaturedProducts);
        }
    } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
    }
}

// Kategori ikonlarını belirle
function getCategoryIcon(categoryName) {
    const icons = {
        'Elektronik': 'fas fa-mobile-alt',
        'Giyim': 'fas fa-tshirt',
        'Ev & Yaşam': 'fas fa-home',
        'Spor': 'fas fa-running',
        'Kitap': 'fas fa-book',
        'Kozmetik': 'fas fa-spa'
    };
    return icons[categoryName] || 'fas fa-tag';
}

// Kategoriye göre ürünleri yükle
async function loadProductsByCategory(categoryId) {
    try {
        console.log('Ürünler yükleniyor... Kategori ID:', categoryId);
        const url = categoryId 
            ? `${API_URL}/products/category/${categoryId}`
            : `${API_URL}/products`;
            
        console.log('API URL:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('Yüklenen ürünler:', products);
        
        const productGrid = document.getElementById('productGrid');
        if (!productGrid) {
            console.error('productGrid elementi bulunamadı!');
            return;
        }

        if (products.length === 0) {
            productGrid.innerHTML = '<p class="no-products">Bu kategoride ürün bulunamadı.</p>';
            return;
        }

        productGrid.innerHTML = products.map(product => {
            // Resim URL'sini kontrol et
            const imageUrl = product.image_url && product.image_url.trim() !== '' 
                ? product.image_url 
                : 'https://via.placeholder.com/300x300?text=Ürün+Resmi';

            return `
                <div class="product-card">
                    <div class="product-image">
                        <img src="${imageUrl}" 
                             alt="${product.name ? product.name : ''}"
                             onerror="handleImageError(this, 'product')">
                    </div>
                    <div class="product-info">
                        <h3>${product.name ? product.name : ''}</h3>
                        ${product.category_name && product.category_name !== 'undefined' && product.category_name !== undefined && product.category_name !== null && product.category_name.toString().trim() !== '' ? `<p class="category">${product.category_name}</p>` : ''}
                        ${product.description && product.description !== 'undefined' && product.description !== undefined && product.description !== null && product.description.toString().trim() !== '' ? `<p class="product-description">${product.description}</p>` : ''}
                        <p class="price">${(product.price || 0).toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY'
                        })}</p>
                        <button onclick="addToCart(${product.id})" class="add-to-cart">
                            <i class="fas fa-shopping-cart"></i>
                            Sepete Ekle
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
        const productGrid = document.getElementById('productGrid');
        if (productGrid) {
            productGrid.innerHTML = '<p class="error-message">Ürünler yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>';
        }
    }
}

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    // Ana sayfa kontrolü
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
        document.body.classList.add('home');
    }
    
    // URL'den kategori ID'sini kontrol et
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    
    // Kategorileri yükle
    loadCategories();
    
    // Ürünleri yükle - sadece ürünler sayfasında
    if (window.location.pathname.includes('products.html')) {
        // Kategori butonlarını oluştur
        createCategoryButtons();
        // Ürünleri yükle
        loadProductsByCategory(categoryId);
    }

    // Kategori dropdown'ını ayarla
    setupCategoryDropdown();
    
    // Profil menüsünü ayarla
    setupProfileMenu();
    
    // Sepet sayısını güncelle
    updateCartCount();

    // Arama kutusu fonksiyonelliği
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');

    if (searchInput && searchButton) {
        const performSearch = () => {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                window.location.href = `products.html?search=${encodeURIComponent(searchTerm)}`;
            }
        };

        // Input alanında Enter tuşuna basılınca
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Formun submit olmasını engelle
                performSearch();
            }
        });

        // Arama butonuna tıklayınca
        searchButton.addEventListener('click', function() {
            performSearch();
        });
    }
});

// Kategori dropdown'ını ayarla
function setupCategoryDropdown() {
    const categoriesBtn = document.querySelector('.categories-dropdown button');
    const categoriesList = document.querySelector('.categories-dropdown .dropdown-content');
    
    if (categoriesBtn && categoriesList) {
        categoriesBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            categoriesList.classList.toggle('show');
        });

        // Dışarı tıklandığında kapat
        document.addEventListener('click', (e) => {
            if (!categoriesBtn.contains(e.target) && !categoriesList.contains(e.target)) {
                categoriesList.classList.remove('show');
            }
        });
    }
}

// Profil menüsünü ayarla
function setupProfileMenu() {
    const profileButton = document.querySelector('.profile-button');
    const profileMenu = document.querySelector('.profile-menu');
    
    if (profileButton && profileMenu) {
        let isMenuOpen = false;

        profileButton.addEventListener('click', function(e) {
            e.stopPropagation();
            isMenuOpen = !isMenuOpen;
            profileMenu.style.display = isMenuOpen ? 'block' : 'none';
        });

        // Menü dışına tıklandığında kapat
        document.addEventListener('click', function(e) {
            if (isMenuOpen && !profileMenu.contains(e.target) && !profileButton.contains(e.target)) {
                isMenuOpen = false;
                profileMenu.style.display = 'none';
            }
        });

        // Menü içindeki linklere tıklandığında menüyü kapat
        profileMenu.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                isMenuOpen = false;
                profileMenu.style.display = 'none';
            }
        });
    }

    // Profil UI'ını güncelle
    updateProfileUI();
}

// Profil UI'ını güncelle
function updateProfileUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const profileMenu = document.querySelector('.profile-menu');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (!profileMenu || !authButtons) return;

    if (user) {
        // Kullanıcı giriş yapmış
        profileMenu.style.display = 'block';
        authButtons.style.display = 'none';
        
        // Profil bilgilerini güncelle
        const profileName = document.querySelector('#profileName');
        const profileNameLarge = document.querySelector('#profileNameLarge');
        const profileEmail = document.querySelector('#profileEmail');
        const profileImage = document.querySelector('#profileImage');
        const profileImageLarge = document.querySelector('#profileImageLarge');
        
        if (profileName) profileName.textContent = user.name;
        if (profileNameLarge) profileNameLarge.textContent = user.name;
        if (profileEmail) profileEmail.textContent = user.email;
        if (profileImage) {
            profileImage.src = user.avatar || 'https://via.placeholder.com/40x40?text=User';
            profileImage.onerror = function() {
                this.src = 'https://via.placeholder.com/40x40?text=User';
            };
        }
        if (profileImageLarge) {
            profileImageLarge.src = user.avatar || 'https://via.placeholder.com/80x80?text=User';
            profileImageLarge.onerror = function() {
                this.src = 'https://via.placeholder.com/80x80?text=User';
            };
        }
    } else {
        // Kullanıcı giriş yapmamış
        profileMenu.style.display = 'none';
        authButtons.style.display = 'flex';
    }
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

// Sepet sayısını güncelle
function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
        cartCountElement.style.display = cartCount > 0 ? 'block' : 'none';
    }
}

// Çıkış yap
function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Sayfa yüklendiğinde profil UI'ını güncelle
document.addEventListener('DOMContentLoaded', updateProfileUI);

// Sepete ürün ekle
async function addToCart(productId) {
    try {
        // API'den ürün bilgilerini al
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) {
            throw new Error('Ürün bilgileri alınamadı');
        }
        
        const product = await response.json();
        
        // LocalStorage'dan mevcut sepeti al
        let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
        
        // Ürün sepette var mı kontrol et
        const existingItem = cartItems.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
            showNotification('Ürün miktarı güncellendi', 'success');
        } else {
            cartItems.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image_url: product.image_url,
                category_name: product.category_name,
                quantity: 1
            });
            showNotification('Ürün sepete eklendi', 'success');
        }

        // Sepeti LocalStorage'a kaydet
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        
        // Sepet sayısını güncelle
        updateCartCount();

    } catch (error) {
        console.error('Sepete ekleme hatası:', error);
        showNotification('Ürün sepete eklenirken bir hata oluştu', 'error');
    }
}

// Siparişler dropdown işlemleri
let showOrders, ordersDropdown;

document.addEventListener('DOMContentLoaded', () => {
    showOrders = document.getElementById('showOrders');
    ordersDropdown = document.getElementById('ordersDropdown');

    if (showOrders && ordersDropdown) {
        // Siparişleri yükle ve dropdown'a ekle
        async function loadOrders(status = 'pending') {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    ordersDropdown.innerHTML = '<p class="no-orders">Lütfen giriş yapın</p>';
                    return;
                }

                const response = await fetch(`${API_URL}/orders?status=${status}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Siparişler yüklenemedi');
                }

                const orders = await response.json();
                displayOrders(orders);

            } catch (error) {
                console.error('Sipariş yükleme hatası:', error);
            }
        }

        // Dropdown'ı göster/gizle
        showOrders.addEventListener('click', () => {
            ordersDropdown.classList.toggle('active');
            if (ordersDropdown.classList.contains('active')) {
                loadOrders('pending');
            }
        });

        // Dropdown dışına tıklandığında kapat
        document.addEventListener('click', (e) => {
            if (!showOrders.contains(e.target) && !ordersDropdown.contains(e.target)) {
                ordersDropdown.classList.remove('active');
            }
        });
    }
});

// Sipariş durumu metinleri
function getStatusText(status) {
    const statusTexts = {
        'pending': 'Onay Bekliyor',
        'confirmed': 'Onaylandı',
        'cancelled': 'İptal Edildi'
    };
    return statusTexts[status] || status;
}

// Sayfa yüklendiğinde
window.addEventListener('load', () => {
    checkAuthStatus();
    loadCategories();
    displayProducts();
    updateCartCount();
});

// Sepetten sipariş oluştur
async function createOrder() {
    try {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length === 0) {
            showNotification('Sepetiniz boş!', 'error');
            return;
        }

        // Sipariş formu göster
        const { value: formValues } = await Swal.fire({
            title: 'Sipariş Bilgileri',
            html: `
                <input id="address" class="swal2-input" placeholder="Teslimat Adresi">
                <input id="phone" class="swal2-input" placeholder="Telefon Numarası">
                <input id="email" class="swal2-input" placeholder="E-posta">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Siparişi Onayla',
            cancelButtonText: 'İptal',
            preConfirm: () => {
                return {
                    shippingAddress: document.getElementById('address').value,
                    phone: document.getElementById('phone').value,
                    email: document.getElementById('email').value
                }
            }
        });

        if (!formValues) return;

        const orderData = {
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            ...formValues
        };

        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Lütfen önce giriş yapın', 'error');
            return;
        }

        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            throw new Error('Sipariş oluşturulamadı');
        }

        // Sepeti temizle
        localStorage.removeItem('cart');
        updateCartCount();

        // Başarı mesajı göster
        Swal.fire(
            'Başarılı!',
            'Siparişiniz başarıyla oluşturuldu.',
            'success'
        );

    } catch (error) {
        console.error('Sipariş hatası:', error);
        showNotification('Sipariş oluşturulurken bir hata oluştu', 'error');
    }
}

// Auth durumunu kontrol et ve UI'ı güncelle
function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    const authButtons = document.querySelector('.auth-buttons');
    const profileMenu = document.querySelector('.profile-menu');
    const cartCount = document.querySelector('.cart-count');

    if (!authButtons || !profileMenu) return; // Elementler yoksa fonksiyondan çık

    if (user) {
        // Kullanıcı giriş yapmış
        authButtons.style.display = 'none';
        profileMenu.style.display = 'block';

        // Profil bilgilerini güncelle
        const profileName = document.querySelector('#profileName');
        const profileNameLarge = document.querySelector('#profileNameLarge');
        const profileEmail = document.querySelector('#profileEmail');
        const profileImage = document.querySelector('#profileImage');
        const profileImageLarge = document.querySelector('#profileImageLarge');

        if (profileName) profileName.textContent = user.name;
        if (profileNameLarge) profileNameLarge.textContent = user.name;
        if (profileEmail) profileEmail.textContent = user.email;
        if (profileImage && user.avatar) profileImage.src = user.avatar;
        if (profileImageLarge && user.avatar) profileImageLarge.src = user.avatar;

        // Sepet sayısını güncelle
        updateCartCount();
    } else {
        // Kullanıcı giriş yapmamış
        if (authButtons) authButtons.style.display = 'flex';
        if (profileMenu) profileMenu.style.display = 'none';
        if (cartCount) cartCount.textContent = '0';
    }
}

// Çıkış yapma fonksiyonu
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Bildirim göster
    showNotification('Başarıyla çıkış yapıldı', 'success');
    
    // UI'ı güncelle
    checkAuthStatus();
    
    // Ana sayfaya yönlendir
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Sayfa yüklendiğinde auth durumunu kontrol et
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// Profil menüsü toggle
document.addEventListener('DOMContentLoaded', function() {
    const profileBtn = document.querySelector('.profile-btn');
    const profileDropdown = document.querySelector('.profile-dropdown');
    
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            profileDropdown.classList.toggle('show');
        });
    }

    // Dışarı tıklandığında menüyü kapat
    document.addEventListener('click', (e) => {
        if (!profileBtn?.contains(e.target)) {
            profileDropdown?.classList.remove('show');
        }
    });

    // Çıkış yap
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }

    // Auth durumunu kontrol et
    checkAuthStatus();
});

// Resim yükleme hatası için fallback fonksiyonu
function handleImageError(img, type = 'product') {
    // Varsayılan placeholder resimleri
    const placeholders = {
        'brand': 'https://via.placeholder.com/150x50?text=Marka+Logo',
        'user': 'https://via.placeholder.com/80x80?text=Kullanıcı',
        'product': 'https://via.placeholder.com/300x300?text=Ürün+Resmi',
        'category': 'https://via.placeholder.com/300x200?text=Kategori',
        'hero': 'https://via.placeholder.com/1920x600?text=Hero+Görsel'
    };

    // Eğer resim URL'si boş veya geçersizse
    if (!img.src || img.src === 'undefined' || img.src === 'null') {
        img.src = placeholders[type] || placeholders.product;
        return;
    }

    // Resim yüklenemezse placeholder'a geç
    img.onerror = null; // Sonsuz döngüyü önle
    img.src = placeholders[type] || placeholders.product;
    
    // Alt text ekle
    if (!img.alt) {
        img.alt = type.charAt(0).toUpperCase() + type.slice(1) + ' Resmi';
    }

    console.log(`Resim yükleme hatası: ${type} resmi için placeholder kullanıldı`);
}

// Ürünleri görüntüle
async function displayProducts(categoryId = null) {
    try {
        const url = categoryId 
            ? `${API_URL}/products/category/${categoryId}`
            : `${API_URL}/products`;
            
        const response = await fetch(url);
        const products = await response.json();
        
        const productGrid = document.getElementById('productGrid');
        if (!productGrid) return;

        if (products.length === 0) {
            productGrid.innerHTML = '<p class="no-products">Bu kategoride ürün bulunamadı.</p>';
            return;
        }

        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image_url}" 
                         alt="${product.name}"
                         onerror="handleImageError(this, 'product')">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="category">${product.category_name}</p>
                    <p class="product-description">${product.description || ''}</p>
                    <p class="price">${product.price.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                    })}</p>
                    <button onclick="addToCart(${product.id})" class="add-to-cart">
                        <i class="fas fa-shopping-cart"></i>
                        Sepete Ekle
                    </button>
                </div>
            </div>
        `).join('');

        // Kategori filtrelerini güncelle
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(button => {
            button.classList.remove('active');
            if (categoryId && button.dataset.categoryId === categoryId) {
                button.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Ürünler yüklenirken hata:', error);
    }
}

// Fiyat filtresi
document.querySelector('.apply-filter')?.addEventListener('click', () => {
    const minPrice = document.querySelector('input[name="min"]')?.value;
    const maxPrice = document.querySelector('input[name="max"]')?.value;
    
    filterProducts(minPrice, maxPrice);
});

// Sıralama
document.querySelector('select[name="sorting"]')?.addEventListener('change', (e) => {
    const sortType = e.target.value;
    sortProducts(sortType);
});

// Ürünleri filtrele
async function filterProducts(minPrice, maxPrice) {
    try {
        const response = await fetch(`${API_URL}/products`);
        let products = await response.json();
        
        if (minPrice) {
            products = products.filter(p => p.price >= minPrice);
        }
        if (maxPrice) {
            products = products.filter(p => p.price <= maxPrice);
        }
        
        displayFilteredProducts(products);
    } catch (error) {
        console.error('Filtreleme hatası:', error);
    }
}

// Ürünleri sırala
function sortProducts(sortType) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;

    const products = Array.from(productGrid.children);
    
    products.sort((a, b) => {
        const priceA = parseFloat(a.querySelector('.price').textContent.replace(/[^0-9.-]+/g, ''));
        const priceB = parseFloat(b.querySelector('.price').textContent.replace(/[^0-9.-]+/g, ''));
        
        switch (sortType) {
            case 'price-asc':
                return priceA - priceB;
            case 'price-desc':
                return priceB - priceA;
            default:
                return 0;
        }
    });
    
    productGrid.innerHTML = '';
    products.forEach(product => productGrid.appendChild(product));
}

// Filtrelenmiş ürünleri göster
function displayFilteredProducts(products) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return;

    if (products.length === 0) {
        productGrid.innerHTML = '<p class="no-products">Ürün bulunamadı.</p>';
        return;
    }

    productGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image_url}" 
                     alt="${product.name}"
                     onerror="handleImageError(this, 'product')">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="category">${product.category_name}</p>
                <p class="product-description">${product.description || ''}</p>
                <p class="price">${product.price.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY'
                })}</p>
                <button onclick="addToCart(${product.id})" class="add-to-cart">
                    <i class="fas fa-shopping-cart"></i>
                    Sepete Ekle
                </button>
            </div>
        </div>
    `).join('');
}

// Kategori butonlarını oluştur
async function createCategoryButtons() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categories = await response.json();
        
        const categoryFilters = document.querySelector('.category-filters');
        if (!categoryFilters) return;

        // Önce "Tümü" butonu
        categoryFilters.innerHTML = `
            <button class="category-btn active" data-category-id="all">Tümü</button>
        `;

        // Sonra diğer kategori butonları
        categories.forEach(category => {
            categoryFilters.innerHTML += `
                <button class="category-btn" data-category-id="${category.id}">
                    ${category.name}
                </button>
            `;
        });

        // Butonlara tıklama olayı ekle
        document.querySelectorAll('.category-btn').forEach(button => {
            button.addEventListener('click', () => {
                // Aktif butonu güncelle
                document.querySelectorAll('.category-btn').forEach(btn => 
                    btn.classList.remove('active'));
                button.classList.add('active');

                // Ürünleri filtrele
                const categoryId = button.dataset.categoryId;
                loadProductsByCategory(categoryId === 'all' ? null : categoryId);
            });
        });
    } catch (error) {
        console.error('Kategori butonları oluşturulurken hata:', error);
    }
}

// Modal gösterme fonksiyonlar
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
}

// Modal kapatma fonksiyonları
function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

// Modal dışına tıklandığında kapatma
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Ödeme sayfasına yönlendir
function goToPayment() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        showNotification('Sepetiniz boş!', 'error');
        return;
    }
    window.location.href = 'payment.html';
}

// Kategoriler dropdown kontrolü
function toggleCategoriesDropdown(event) {
    if (!event) return;
    
    const dropdown = document.querySelector('.dropdown-content');
    if (!dropdown) return;

    dropdown.classList.toggle('show');
    event.stopPropagation();
}

// Sayfa herhangi bir yerine tıklandığında dropdown'ları kapat
document.addEventListener('click', (event) => {
    const dropdowns = document.querySelectorAll('.dropdown-content');
    
    dropdowns.forEach(dropdown => {
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    });
});

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    
    // Kategoriler butonuna tıklama olayı ekle
    const categoriesBtn = document.getElementById('categoriesBtn');
    if (categoriesBtn) {
        categoriesBtn.addEventListener('click', toggleCategoriesDropdown);
    }
});

// Profil menüsü kontrolü
document.addEventListener('DOMContentLoaded', function() {
    const profileButton = document.querySelector('.profile-button');
    const profileMenu = document.querySelector('.profile-menu');
    
    if (profileButton && profileMenu) {
        let isMenuOpen = false;

        profileButton.addEventListener('click', function(e) {
            e.stopPropagation();
            isMenuOpen = !isMenuOpen;
            profileMenu.style.display = isMenuOpen ? 'block' : 'none';
        });

        // Menü dışına tıklandığında kapat
        document.addEventListener('click', function(e) {
            if (isMenuOpen && !profileMenu.contains(e.target) && !profileButton.contains(e.target)) {
                isMenuOpen = false;
                profileMenu.style.display = 'none';
            }
        });

        // Menü içindeki linklere tıklandığında menüyü kapat
        profileMenu.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                isMenuOpen = false;
                profileMenu.style.display = 'none';
            }
        });
    }

    // Profil UI'ını güncelle
    updateProfileUI();
});

// Profil UI'ını güncelle
function updateProfileUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const profileMenu = document.querySelector('.profile-menu');
    const authButtons = document.querySelector('.auth-buttons');
    
    if (!profileMenu || !authButtons) return;

    if (user) {
        // Kullanıcı giriş yapmış
        profileMenu.style.display = 'block';
        authButtons.style.display = 'none';
        
        // Profil bilgilerini güncelle
        const profileName = document.querySelector('#profileName');
        const profileNameLarge = document.querySelector('#profileNameLarge');
        const profileEmail = document.querySelector('#profileEmail');
        const profileImage = document.querySelector('#profileImage');
        const profileImageLarge = document.querySelector('#profileImageLarge');
        
        if (profileName) profileName.textContent = user.name;
        if (profileNameLarge) profileNameLarge.textContent = user.name;
        if (profileEmail) profileEmail.textContent = user.email;
        if (profileImage) {
            profileImage.src = user.avatar || 'https://via.placeholder.com/40x40?text=User';
            profileImage.onerror = function() {
                this.src = 'https://via.placeholder.com/40x40?text=User';
            };
        }
        if (profileImageLarge) {
            profileImageLarge.src = user.avatar || 'https://via.placeholder.com/80x80?text=User';
            profileImageLarge.onerror = function() {
                this.src = 'https://via.placeholder.com/80x80?text=User';
            };
        }
    } else {
        // Kullanıcı giriş yapmamış
        profileMenu.style.display = 'none';
        authButtons.style.display = 'flex';
    }
}

// Çıkış yap
function handleLogout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Sayfa yüklendiğinde profil UI'ını güncelle
document.addEventListener('DOMContentLoaded', updateProfileUI);

// Profil menüsü kontrolü
document.addEventListener('DOMContentLoaded', () => {
    const profileMenu = document.querySelector('.profile-menu');
    const profileButton = document.querySelector('.profile-button');

    if (profileButton && profileMenu) {
        profileButton.addEventListener('click', (event) => {
            event.stopPropagation();
            profileMenu.classList.toggle('active');
        });

        document.addEventListener('click', (event) => {
            if (profileMenu.classList.contains('active') && 
                !profileButton.contains(event.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }
});

// Öne çıkan ürünleri yükle
async function loadFeaturedProducts() {
    try {
        const response = await fetch(`${API_URL}/featured-products`);
        if (!response.ok) throw new Error('Ürünler yüklenemedi');

        const products = await response.json();
        console.log('Öne çıkan ürünler:', products);

        const featuredContainer = document.querySelector('.featured-products');
        if (!featuredContainer) return;

        if (products.length === 0) {
            featuredContainer.innerHTML = '<p>Öne çıkan ürün bulunmuyor.</p>';
            return;
        }

        featuredContainer.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image_url || 'https://via.placeholder.com/300'}" 
                         alt="${product.name}"
                         onerror="this.src='https://via.placeholder.com/300'">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="category">${product.category_name || 'Genel'}</p>
                    <p class="product-description">${product.description || ''}</p>
                    <p class="price">${product.price.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                    })}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Öne çıkan ürünler yüklenirken hata:', error);
        showNotification('Ürünler yüklenirken bir hata oluştu', 'error');
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', async () => {
    // Mevcut kodlar...

    // Öne çıkan ürünleri yükle
    loadFeaturedProducts();
});

// Chat fonksiyonları
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    // Kullanıcı mesajını göster
    addMessage(message, true);
    
    // Input'u temizle
    input.value = '';
    
    try {
        // Yükleniyor mesajı
        const loadingId = addMessage('Yanıt hazırlanıyor...', false);
        
        // Token kontrolü
        const token = localStorage.getItem('token');
        if (!token) {
            removeMessage(loadingId);
            addMessage('Sohbet edebilmek için giriş yapmalısınız.', false);
            return;
        }
        
        // API'ye istek at
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        // Yükleniyor mesajını kaldır
        removeMessage(loadingId);
        
        if (data.error) {
            addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', false);
            return;
        }
        
        // Bot yanıtını göster
        addMessage(data.response, false);
        
    } catch (error) {
        console.error('Chat hatası:', error);
        addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', false);
    }
}

function addMessage(message, isUser = false) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    const messageId = Date.now();
    
    messageDiv.id = `message-${messageId}`;
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            ${message}
        </div>
        <div class="message-time">
            ${new Date().toLocaleTimeString()}
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    return messageId;
}

function removeMessage(messageId) {
    const messageDiv = document.getElementById(`message-${messageId}`);
    if (messageDiv) {
        messageDiv.remove();
    }
}