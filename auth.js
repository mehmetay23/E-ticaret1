// Auth işlemleri
document.addEventListener('DOMContentLoaded', function() {
    // Giriş formu işlemleri
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = {
                    email: e.target.email.value,
                    password: e.target.password.value
                };

                console.log('Giriş denemesi:', { email: formData.email }); // Debug log

                const response = await fetch(`${window.API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Giriş başarısız');
                }

                const data = await response.json();

                // Token ve kullanıcı bilgilerini kaydet
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                showNotification('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
                
                // Kullanıcı rolüne göre yönlendir
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin-panel.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1500);

            } catch (error) {
                console.error('Giriş hatası:', error);
                showNotification(error.message || 'Giriş başarısız', 'error');
            }
        });
    }

    // Şifre göster/gizle butonları
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // İkon değiştir
            const icon = this.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
    });

    // Kayıt formu işlemleri
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                // Şifre kontrolü
                if (e.target.password.value !== e.target.confirmPassword.value) {
                    throw new Error('Şifreler eşleşmiyor');
                }

                const formData = {
                    fullName: e.target.fullName.value,
                    email: e.target.email.value,
                    phone: e.target.phone.value,
                    password: e.target.password.value
                };

                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Kayıt başarısız');
                }

                const data = await response.json();

                // Token ve kullanıcı bilgilerini kaydet
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                showNotification('Kayıt başarılı! Yönlendiriliyorsunuz...', 'success');
                
                // Ana sayfaya yönlendir
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);

            } catch (error) {
                console.error('Kayıt hatası:', error);
                showNotification(error.message || 'Kayıt başarısız', 'error');
            }
        });
    }
});

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

// Profil menüsünü aç/kapat
function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    dropdown.classList.toggle('active');
}

// Sayfa dışına tıklandığında menüyü kapat
document.addEventListener('click', (e) => {
    const profileMenu = document.querySelector('.profile-menu');
    const dropdown = document.getElementById('profileDropdown');
    
    if (profileMenu && dropdown && !profileMenu.contains(e.target) && dropdown.classList.contains('active')) {
        dropdown.classList.remove('active');
    }
});

// Çıkış yap
function handleLogout() {
    try {
        // LocalStorage'dan kullanıcı verilerini temizle
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Kullanıcıya bildirim göster
        showNotification('Başarıyla çıkış yapıldı', 'success');
        
        // UI'ı güncelle
        checkAuthStatus();
        
        // 1 saniye sonra ana sayfaya yönlendir
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Çıkış yapma hatası:', error);
        showNotification('Çıkış yapılırken bir hata oluştu', 'error');
    }
}

// Kullanıcı durumunu kontrol et
function checkAuthStatus() {
    const user = localStorage.getItem('user');
    const authButtons = document.getElementById('authLinks');
    const profileMenu = document.getElementById('profileMenu');
    const adminLink = document.getElementById('adminLink');
    
    // Elementlerin varlığını kontrol et
    if (!authButtons || !profileMenu) {
        return; // Elementler yoksa fonksiyondan çık
    }
    
    if (user) {
        try {
            // Kullanıcı giriş yapmış
            authButtons.style.display = 'none';
            profileMenu.style.display = 'block';
            
            // Kullanıcı bilgilerini parse et
            const userData = JSON.parse(user);
            const displayName = userData.name || userData.full_name || userData.username || '';
            
            // Tüm kullanıcı adı alanlarını güncelle
            const usernameElements = [
                document.querySelector('.username'),
                document.querySelector('#profileUsername'),
                document.querySelector('#welcomeUsername'),
                document.querySelector('.dropdown-header .user-welcome strong')
            ];
            
            usernameElements.forEach(element => {
                if (element) {
                    element.textContent = displayName;
                }
            });

            // E-posta alanını güncelle
            const emailElement = document.querySelector('#profileEmail');
            if (emailElement) {
                emailElement.textContent = userData.email || '';
            }

            // Avatar'ı güncelle
            const avatarElements = document.querySelectorAll('.profile-avatar');
            avatarElements.forEach(avatar => {
                if (avatar) {
                    avatar.innerHTML = userData.avatar_url ? 
                        `<img src="${userData.avatar_url}" alt="${displayName}">` : 
                        '<i class="fas fa-user"></i>';
                }
            });

            // Admin kontrolü
            if (adminLink && userData.role === 'admin') {
                adminLink.style.display = 'block';
            }
        } catch (error) {
            console.error('Kullanıcı durumu kontrolünde hata:', error);
        }
    } else {
        // Kullanıcı giriş yapmamış
        authButtons.style.display = 'flex';
        profileMenu.style.display = 'none';
        if (adminLink) {
            adminLink.style.display = 'none';
        }
    }
}

// Sayfa yüklendiğinde kontrol et
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// LocalStorage değişikliklerini dinle
window.addEventListener('storage', function(e) {
    if (e.key === 'user') {
        checkAuthStatus(); // Kullanıcı bilgileri değiştiğinde UI'ı güncelle
    }
});
