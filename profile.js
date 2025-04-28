const profile = {
    init() {
        this.loadUserProfile();
        this.initEventListeners();
    },

    initEventListeners() {
        const form = document.querySelector('.profile-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }
    },

    loadUserProfile() {
        try {
            // LocalStorage'dan kullanıcı bilgilerini al
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                throw new Error('Profil bilgileri yüklenemedi');
            }

            // Form alanlarını doldur
            document.getElementById('fullName').value = user.name || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('phone').value = user.phone || '';
            document.getElementById('birthDate').value = user.birthDate || '';

            // Profil başlığını güncelle
            document.querySelector('.profile-name').textContent = user.name || 'Kullanıcı';
            document.querySelector('.profile-email').textContent = user.email || '';

        } catch (error) {
            console.error('Profil yükleme hatası:', error);
            showNotification('Profil bilgileri yüklenemedi', 'error');
        }
    },

    saveProfile() {
        try {
            const formData = {
                name: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                birthDate: document.getElementById('birthDate').value
            };

            // Verileri doğrula
            if (!formData.name || !formData.email) {
                throw new Error('Lütfen gerekli alanları doldurun');
            }

            // LocalStorage'a kaydet
            const user = JSON.parse(localStorage.getItem('user')) || {};
            const updatedUser = { ...user, ...formData };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Başarı mesajı göster
            showNotification('Profil bilgileriniz güncellendi', 'success');

            // Profil görünümünü güncelle
            this.loadUserProfile();

        } catch (error) {
            console.error('Profil kaydetme hatası:', error);
            showNotification(error.message, 'error');
        }
    }
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    profile.init();
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