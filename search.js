const search = {
    init() {
        // Tüm arama kutularını seç
        const searchBoxes = document.querySelectorAll('.search-box input');
        const searchButtons = document.querySelectorAll('.search-box button');

        // Her arama kutusuna event listener ekle
        searchBoxes.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(input.value);
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

    performSearch(query) {
        if (!query.trim()) {
            this.showNotification('Lütfen arama yapmak için bir şeyler yazın');
            return;
        }

        // Arama sorgusunu URL'e ekle ve products.html'e yönlendir
        const searchParams = new URLSearchParams();
        searchParams.set('q', query.trim());
        window.location.href = `products.html?${searchParams.toString()}`;
    },

    showNotification(message) {
        // Bildirim gösterme fonksiyonu
        if (typeof showNotification === 'function') {
            showNotification(message, 'warning');
        } else {
            alert(message);
        }
    },

    // Products sayfasında aramaları işle
    handleProductSearch() {
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');

        if (searchQuery) {
            // Arama kutusuna değeri yerleştir
            const searchInputs = document.querySelectorAll('.search-box input');
            searchInputs.forEach(input => input.value = searchQuery);

            // Ürünleri filtrele
            this.filterProducts(searchQuery);
        }
    },

    filterProducts(query) {
        const productCards = document.querySelectorAll('.product-card');
        const searchRegex = new RegExp(query, 'i');
        let hasResults = false;

        productCards.forEach(card => {
            const productName = card.querySelector('h3').textContent;
            const productDesc = card.querySelector('.product-description')?.textContent || '';

            if (searchRegex.test(productName) || searchRegex.test(productDesc)) {
                card.style.display = 'block';
                hasResults = true;
            } else {
                card.style.display = 'none';
            }
        });

        // Sonuç bulunamadı mesajını göster/gizle
        this.toggleNoResults(!hasResults);
    },

    toggleNoResults(show) {
        let noResultsEl = document.getElementById('noResults');
        
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
                document.querySelector('.products-grid').appendChild(noResultsEl);
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
    
    // Eğer products.html sayfasındaysak, arama işlemlerini başlat
    if (window.location.pathname.includes('products.html')) {
        search.handleProductSearch();
    }
}); 