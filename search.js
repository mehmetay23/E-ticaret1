const search = {
    allProducts: [], // Tüm ürünleri tutacak dizi

    init() {
        // Tüm arama kutularını seç
        const searchBoxes = document.querySelectorAll('.search-box input');
        const searchButtons = document.querySelectorAll('.search-box button');

        // Tüm ürünleri yükle
        this.loadAllProducts();

        // Her arama kutusuna event listener ekle
        searchBoxes.forEach(input => {
            // Input değiştiğinde anında arama yap
            input.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });

            // Enter tuşuna basıldığında
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(e.target.value);
                }
            });
        });

        // Her arama butonuna event listener ekle
        searchButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = button.previousElementSibling;
                this.performSearch(input.value);
            });
        });
    },

    // Tüm ürünleri yükle
    async loadAllProducts() {
        try {
            const response = await fetch('http://localhost:3000/api/products');
            if (!response.ok) {
                throw new Error('Ürünler yüklenemedi');
            }
            this.allProducts = await response.json();
        } catch (error) {
            console.error('Ürünler yüklenirken hata:', error);
            this.showNotification('Ürünler yüklenirken bir hata oluştu');
        }
    },

    performSearch(query) {
        if (!query.trim()) {
            // Arama kutusu boşsa tüm ürünleri göster
            this.displayProducts(this.allProducts);
            return;
        }

        const searchTerm = query.toLowerCase().trim();
        
        // Ürünleri filtrele
        const filteredProducts = this.allProducts.filter(product => {
            const productName = (product.name || '').toLowerCase();
            const productDesc = (product.description || '').toLowerCase();
            const categoryName = (product.category_name || '').toLowerCase();

            return productName.includes(searchTerm) || 
                   productDesc.includes(searchTerm) || 
                   categoryName.includes(searchTerm);
        });

        // Filtrelenmiş ürünleri göster
        this.displayProducts(filteredProducts);
    },

    displayProducts(products) {
        const productGrid = document.querySelector('.products-grid') || document.getElementById('productGrid');
        if (!productGrid) {
            console.warn('Ürün grid elementi bulunamadı');
            return;
        }

        if (products.length === 0) {
            this.toggleNoResults(true);
            return;
        }

        // Sonuç bulunamadı mesajını gizle
        this.toggleNoResults(false);

        // Ürünleri göster
        productGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image_url || 'https://via.placeholder.com/300'}" 
                         alt="${product.name}"
                         onerror="this.src='https://via.placeholder.com/300'">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="category">${product.category_name || 'Genel'}</p>
                    <p class="description">${product.description || ''}</p>
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
    },

    showNotification(message) {
        // Bildirim gösterme fonksiyonu
        if (typeof showNotification === 'function') {
            showNotification(message, 'warning');
        } else {
            alert(message);
        }
    },

    toggleNoResults(show) {
        let noResultsEl = document.getElementById('noResults');
        const productGrid = document.querySelector('.products-grid') || document.getElementById('productGrid');
        
        if (!productGrid) {
            console.warn('Ürün grid elementi bulunamadı');
            return;
        }
        
        if (show) {
            if (!noResultsEl) {
                noResultsEl = document.createElement('div');
                noResultsEl.id = 'noResults';
                noResultsEl.className = 'no-results';
                noResultsEl.innerHTML = `
                    <i class="fas fa-search"></i>
                    <h3>Sonuç Bulunamadı</h3>
                    <p>Aramanızla eşleşen ürün bulunamadı.</p>
                `;
                productGrid.appendChild(noResultsEl);
            }
            noResultsEl.style.display = 'flex';
        } else if (noResultsEl) {
            noResultsEl.style.display = 'none';
        }
    }
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    search.init();
}); 