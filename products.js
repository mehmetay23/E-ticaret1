document.addEventListener('DOMContentLoaded', function() {
    // Elementleri seç
    const productGrid = document.getElementById('productGrid');
    const categoryButtons = document.getElementById('categoryButtons');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const applyPriceFilter = document.getElementById('applyPriceFilter');
    const sortSelect = document.getElementById('sortSelect');

    let currentProducts = []; // Tüm ürünleri tut
    let filteredProducts = []; // Filtrelenmiş ürünleri tut

    // URL'den kategori ID'sini al
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
<<<<<<< HEAD
    const searchTerm = urlParams.get('search');
=======
>>>>>>> 26c0ea1a0b02e23e6cd98f5a79e2fddfc59bbe10

    // Kategorileri yükle
    async function loadCategories() {
        try {
            const response = await fetch('http://localhost:3000/api/categories');
            const categories = await response.json();
            
            categoryButtons.innerHTML = `
                <button class="category-btn ${!categoryId ? 'active' : ''}" data-id="">
                    Tümü
                </button>
                ${categories.map(category => `
                    <button class="category-btn ${category.id == categoryId ? 'active' : ''}" 
                            data-id="${category.id}">
                        ${category.name}
                    </button>
                `).join('')}
            `;

            // Kategori butonlarına tıklama olayı ekle
            document.querySelectorAll('.category-btn').forEach(button => {
                button.addEventListener('click', () => {
                    document.querySelectorAll('.category-btn')
                        .forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    loadProducts(button.dataset.id);
                });
            });
        } catch (error) {
            console.error('Kategoriler yüklenirken hata:', error);
        }
    }

    // Ürünleri yükle
<<<<<<< HEAD
    async function loadProducts(categoryId = '', searchTerm = '') {
=======
    async function loadProducts(categoryId = '') {
>>>>>>> 26c0ea1a0b02e23e6cd98f5a79e2fddfc59bbe10
        productGrid.innerHTML = '<div class="loading">Ürünler yükleniyor...</div>';

        try {
            let url = 'http://localhost:3000/api/products';
            if (categoryId) {
                url += `/category/${categoryId}`;
            }

<<<<<<< HEAD
            if (searchTerm) {
                url += `?search=${searchTerm}`;
            }

=======
>>>>>>> 26c0ea1a0b02e23e6cd98f5a79e2fddfc59bbe10
            const response = await fetch(url);
            const products = await response.json();

            currentProducts = products; // Tüm ürünleri sakla
            filteredProducts = [...products]; // Filtrelenmiş ürünleri başlangıçta tüm ürünler olarak ayarla

            displayProducts(filteredProducts);
        } catch (error) {
            console.error('Ürünler yüklenirken hata:', error);
            productGrid.innerHTML = '<p class="error">Ürünler yüklenirken bir hata oluştu.</p>';
        }
    }

    // Ürünleri görüntüle
    function displayProducts(products) {
        const productGrid = document.getElementById('productGrid');
        if (!productGrid) return;

        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image_url || 'https://via.placeholder.com/300'}" 
                         alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="category">${product.category_name || 'Genel'}</p>
                    <p class="description">${product.description || ''}</p>
                    <p class="price">${product.price.toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY'
                    })}</p>
<<<<<<< HEAD
                    <button onclick="addToCart(${product.id})" class="add-to-cart">
=======
                    <button onclick="addToCart(${product.id})" class="add-to-cart-btn">
>>>>>>> 26c0ea1a0b02e23e6cd98f5a79e2fddfc59bbe10
                        <i class="fas fa-shopping-cart"></i>
                        Sepete Ekle
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Arama fonksiyonu
    function searchProducts(searchTerm) {
        filteredProducts = currentProducts.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        applyFilters();
    }

    // Fiyat filtresi
    function applyPriceFilters(min, max) {
        filteredProducts = currentProducts.filter(product => {
            const price = product.price;
            if (min && max) {
                return price >= min && price <= max;
            } else if (min) {
                return price >= min;
            } else if (max) {
                return price <= max;
            }
            return true;
        });
        applyFilters();
    }

    // Sıralama fonksiyonu
    function sortProducts(sortType) {
        switch(sortType) {
            case 'price-low':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            default:
                filteredProducts = [...currentProducts];
        }
        displayProducts(filteredProducts);
    }

    // Tüm filtreleri uygula
    function applyFilters() {
        const sortType = sortSelect.value;
        sortProducts(sortType);
    }

    // Event Listeners
    searchBtn.addEventListener('click', () => {
        searchProducts(searchInput.value);
    });

    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchProducts(searchInput.value);
        }
    });

    applyPriceFilter.addEventListener('click', () => {
        applyPriceFilters(
            Number(minPrice.value) || 0,
            Number(maxPrice.value) || Infinity
        );
    });

    sortSelect.addEventListener('change', () => {
        sortProducts(sortSelect.value);
    });

<<<<<<< HEAD
    // Sayfa yüklendiğinde çalışacak fonksiyonlar
    if (typeof loadCategories === 'function') {
        loadCategories();
    }
   
    // Ürünleri yükle veya arama terimine göre filtrele
    if (searchTerm) {
        // Eğer arama terimi varsa, ürünleri arama terimine göre yükle/filtrele
        // products.js içinde arama fonksiyonun varsa onu kullan
        if (typeof loadProducts === 'function') {
            loadProducts(categoryId, searchTerm); // loadProducts'a search term eklendiğini varsayıyoruz
        } else if (typeof searchProducts === 'function') {
            // Ya da sadece searchProducts fonksiyonu varsa, tüm ürünleri yükleyip filtrele
            if (typeof loadProducts === 'function') {
                loadProducts(categoryId).then(() => {
                    searchProducts(searchTerm);
                });
            } else {
                // products.js içinde loadProducts yoksa, API'den tüm ürünleri alıp filtrele
                fetch('http://localhost:3000/api/products')
                    .then(response => response.json())
                    .then(products => {
                        currentProducts = products; // Global veya uygun bir yere ata
                        filteredProducts = products;
                        searchProducts(searchTerm);
                    })
                    .catch(error => console.error('Ürünler yüklenirken hata:', error));
            }
        }
    } else {
        // Eğer arama terimi yoksa, kategoriye göre veya tüm ürünleri yükle
        if (typeof loadProducts === 'function') {
            loadProducts(categoryId);
        }
    }
=======
    // Sayfa yüklendiğinde
    loadCategories();
    loadProducts(categoryId);
>>>>>>> 26c0ea1a0b02e23e6cd98f5a79e2fddfc59bbe10
});

// Sepete ekle
async function addToCart(productId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Lütfen giriş yapın', 'error');
            return;
        }

        const response = await fetch(`${API_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: 1
            })
        });

        if (!response.ok) {
            throw new Error('Ürün sepete eklenemedi');
        }

        const result = await response.json();
        console.log('Sepete eklenen ürün:', result);
        
        showNotification('Ürün sepete eklendi', 'success');
        updateCartCount(); // Sepet sayısını güncelle

    } catch (error) {
        console.error('Sepete ekleme hatası:', error);
        showNotification(error.message, 'error');
    }
}

// Sepet sayısını güncelle
async function updateCartCount() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_URL}/cart`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Sepet bilgisi alınamadı');

        const cartItems = await response.json();
        const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Sepet sayısını güncelle
        const cartCountElement = document.querySelector('.cart-count');
        if (cartCountElement) {
            cartCountElement.textContent = cartCount;
            cartCountElement.style.display = cartCount > 0 ? 'block' : 'none';
        }

    } catch (error) {
        console.error('Sepet sayısı güncelleme hatası:', error);
    }
}

// Sayfa yüklendiğinde sepet sayısını güncelle
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
}); 