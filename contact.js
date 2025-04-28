document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };

    try {
        // Burada gerçek bir API çağrısı yapılabilir
        // Şimdilik sadece simülasyon yapıyoruz
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
        e.target.reset();
    } catch (error) {
        alert('Mesaj gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    }
}); 