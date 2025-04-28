// Ürün düzenleme fonksiyonları
function editProduct(productId) {
    // Ürün bilgilerini al
    fetch(`http://localhost:3000/api/products/${productId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(product => {
            // Modal başlığını güncelle
            document.getElementById('modalTitle').textContent = 'Ürün Düzenle';
            
            // Önce kategorileri yükle
            loadCategories();
            
            // Form alanlarını doldur
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.name || '';
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productPrice').value = product.price || '';
            document.getElementById('productStock').value = product.stock || '';
            
            // Kategori seçimini bir timeout ile yap (kategoriler yüklendikten sonra)
            setTimeout(() => {
                document.getElementById('productCategory').value = product.category_id || '';
            }, 100);
            
            // Resim URL'sini göstermek için yeni bir alan ekle
            const currentImageContainer = document.createElement('div');
            currentImageContainer.className = 'current-image';
            currentImageContainer.innerHTML = `
                <p>Mevcut Resim:</p>
                <img src="${product.image_url || 'https://via.placeholder.com/100'}" 
                     alt="${product.name || 'Ürün'}" 
                     style="max-width: 100px; max-height: 100px; object-fit: cover;">
                <input type="hidden" id="currentImageUrl" value="${product.image_url || ''}">
            `;
            
            const imageInput = document.getElementById('productImage');
            const imageInputContainer = imageInput.parentElement;
            
            // Eğer zaten bir current-image container varsa, onu kaldır
            const existingImageContainer = imageInputContainer.querySelector('.current-image');
            if (existingImageContainer) {
                existingImageContainer.remove();
            }
            
            // Yeni container'ı ekle
            imageInputContainer.insertBefore(currentImageContainer, imageInput);
            
            // File input'u temizle
            imageInput.value = '';
            
            // Modalı göster
            const modal = document.getElementById('productModal');
            modal.style.display = 'block';
        })
        .catch(error => {
            console.error('Ürün bilgileri alınamadı:', error);
            showNotification('Ürün bilgileri alınamadı', 'error');
        });
}

function updateProduct(productId, updatedProduct) {
    fetch(`http://localhost:3000/api/products/${productId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedProduct)
    })
    .then(response => response.json())
    .then(data => {
        showNotification('Ürün başarıyla güncellendi', 'success');
        closeModal();
        // Tabloyu yenile
        loadProducts();
    })
    .catch(error => {
        console.error('Ürün güncellenemedi:', error);
        showNotification('Ürün güncellenirken bir hata oluştu', 'error');
    });
}

function closeModal() {
    const modal = document.querySelector('.edit-modal');
    if (modal) {
        modal.remove();
    }
}

// Ürünleri yükle
function loadProducts() {
    fetch('http://localhost:3000/api/products')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(products => {
            const tableBody = document.querySelector('#productsTable tbody');
            tableBody.innerHTML = '';

            products.forEach(product => {
                // Fiyat değerini sayıya çevir ve null/undefined kontrolü yap
                const price = typeof product.price === 'number' ? product.price : 
                             typeof product.price === 'string' ? parseFloat(product.price) : 0;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.id || ''}</td>
                    <td>
                        <img src="${product.image_url || ''}" alt="${product.name || ''}" 
                             onerror="this.src='https://via.placeholder.com/50'" 
                             style="width: 50px; height: 50px; object-fit: cover;">
                    </td>
                    <td>${product.name || ''}</td>
                    <td>₺${price.toFixed(2)}</td>
                    <td>${product.stock || 0}</td>
                    <td>
                        <button onclick="editProduct(${product.id})" class="edit-btn">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteProduct(${product.id})" class="delete-btn">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Ürünler yüklenemedi:', error);
            showNotification('Ürünler yüklenemedi', 'error');
        });
}

// Ürün silme fonksiyonu
function deleteProduct(productId) {
    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        fetch(`http://localhost:3000/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => response.json())
        .then(data => {
            showNotification('Ürün başarıyla silindi', 'success');
            loadProducts();
        })
        .catch(error => {
            console.error('Ürün silinemedi:', error);
            showNotification('Ürün silinirken bir hata oluştu', 'error');
        });
    }
}

// Bildirim gösterme fonksiyonu
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

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Admin token kontrolü
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // İlk yüklemede dashboard'ı göster
    showDashboard();
});

// Dashboard'ı göster
function showDashboard() {
    hideAllSections();
    document.getElementById('dashboard').style.display = 'block';
    loadDashboardData();
}

// Ürünleri göster
function showProducts() {
    hideAllSections();
    document.getElementById('products').style.display = 'block';
    loadProducts();
}

// Siparişleri göster
function showOrders() {
    hideAllSections();
    document.getElementById('orders').style.display = 'block';
    loadOrders();
}

// Kullanıcıları göster
function showUsers() {
    hideAllSections();
    document.getElementById('users').style.display = 'block';
    loadUsers();
}

// Tüm bölümleri gizle
function hideAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');
}

// Dashboard verilerini yükle
function loadDashboardData() {
    fetch('http://localhost:3000/api/admin/dashboard', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('totalSales').textContent = `₺${parseFloat(data.totalSales || 0).toFixed(2)}`;
        document.getElementById('pendingOrders').textContent = data.pendingOrders || 0;
        document.getElementById('totalProducts').textContent = data.totalProducts || 0;
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;
    })
    .catch(error => {
        console.error('Dashboard verisi yüklenemedi:', error);
        showNotification('Dashboard verisi yüklenemedi', 'error');
    });
}

// Siparişleri yükle
function loadOrders() {
    fetch('http://localhost:3000/api/orders', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(orders => {
        const tableBody = document.querySelector('#ordersTable tbody');
        tableBody.innerHTML = '';

        if (!Array.isArray(orders)) {
            console.error('Orders data is not an array:', orders);
            return;
        }

        orders.forEach(order => {
            const total = typeof order.total === 'number' ? order.total :
                         typeof order.total === 'string' ? parseFloat(order.total) : 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${order.id || ''}</td>
                <td>${order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}</td>
                <td>${order.user_id || ''}</td>
                <td>₺${total.toFixed(2)}</td>
                <td>${order.status || 'Beklemede'}</td>
                <td>
                    ${order.status === 'pending' ? `
                        <button onclick="approveOrder(${order.id})" class="approve-btn">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </td>
            `;
            tableBody.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Siparişler yüklenemedi:', error);
        showNotification('Siparişler yüklenemedi', 'error');
    });
}

// Siparişi onayla
function approveOrder(orderId) {
    fetch(`http://localhost:3000/api/orders/${orderId}/approve`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        showNotification('Sipariş onaylandı', 'success');
        loadOrders();
    })
    .catch(error => {
        console.error('Sipariş onaylanamadı:', error);
        showNotification('Sipariş onaylanamadı', 'error');
    });
}

// Çıkış yap
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Ürün düzenleme modalını göster
function showAddProductModal() {
    document.getElementById('modalTitle').textContent = 'Yeni Ürün Ekle';
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productImage').value = '';
    
    // Kategorileri yükle
    loadCategories();
    
    const modal = document.getElementById('productModal');
    modal.style.display = 'block';
}

// Ürün modalını kapat
function closeProductModal() {
    const modal = document.getElementById('productModal');
    modal.style.display = 'none';
}

// Ürün formunu dinle
document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const formData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        category_id: document.getElementById('productCategory').value,
        image_url: document.getElementById('currentImageUrl')?.value || ''
    };

    // Eğer yeni bir dosya seçildiyse, onu işle
    const imageFile = document.getElementById('productImage').files[0];
    if (imageFile) {
        // Burada dosya yükleme işlemi yapılabilir
        // Örnek olarak base64'e çevirip gönderebiliriz
        const reader = new FileReader();
        reader.onload = function(e) {
            formData.image_url = e.target.result;
            sendProductData(productId, formData);
        };
        reader.readAsDataURL(imageFile);
    } else {
        // Dosya seçilmediyse mevcut URL ile devam et
        sendProductData(productId, formData);
    }
});

// Ürün verilerini gönder
function sendProductData(productId, formData) {
    const url = productId ? 
        `http://localhost:3000/api/products/${productId}` : 
        'http://localhost:3000/api/products';

    const method = productId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        showNotification(productId ? 'Ürün güncellendi' : 'Ürün eklendi', 'success');
        closeProductModal();
        loadProducts();
    })
    .catch(error => {
        console.error('Ürün kaydedilemedi:', error);
        showNotification('Ürün kaydedilemedi', 'error');
    });
}

// Kategorileri yükle
function loadCategories() {
    fetch('http://localhost:3000/api/categories')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(categories => {
            const categorySelect = document.getElementById('productCategory');
            categorySelect.innerHTML = '<option value="">Kategori Seçin</option>';

            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Kategoriler yüklenemedi:', error);
            showNotification('Kategoriler yüklenemedi', 'error');
        });
}

// Kullanıcıları yükle
function loadUsers() {
    fetch('http://localhost:3000/api/users', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(users => {
        const tableBody = document.querySelector('#usersTable tbody');
        tableBody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id || ''}</td>
                <td>${user.full_name || ''}</td>
                <td>${user.email || ''}</td>
                <td>${user.role || 'user'}</td>
                <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</td>
                <td>
                    <button onclick="showRoleModal(${JSON.stringify(user).replace(/"/g, '&quot;')})" class="edit-btn">
                        <i class="fas fa-user-edit"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    })
    .catch(error => {
        console.error('Kullanıcılar yüklenemedi:', error);
        showNotification('Kullanıcılar yüklenemedi', 'error');
    });
}

// Rol değiştirme modalını göster
function showRoleModal(user) {
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').textContent = user.full_name;
    document.getElementById('userRole').value = user.role || 'user';
    
    const modal = document.getElementById('roleModal');
    modal.style.display = 'block';
}

// Rol değiştirme modalını kapat
function closeRoleModal() {
    const modal = document.getElementById('roleModal');
    modal.style.display = 'none';
}

// Rol değiştirme formunu dinle
document.getElementById('roleForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const userId = document.getElementById('userId').value;
    const role = document.getElementById('userRole').value;

    fetch(`http://localhost:3000/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        showNotification('Kullanıcı rolü güncellendi', 'success');
        closeRoleModal();
        loadUsers();
    })
    .catch(error => {
        console.error('Rol güncellenemedi:', error);
        showNotification('Rol güncellenirken bir hata oluştu', 'error');
    });
}); 