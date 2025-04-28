// Türkiye şehirleri ve ilçeleri
const cities = {
    data: {
        "Adana": ["Aladağ", "Ceyhan", "Çukurova", "Feke", "İmamoğlu", "Karaisalı", "Karataş", "Kozan", "Pozantı", "Saimbeyli", "Sarıçam", "Seyhan", "Tufanbeyli", "Yumurtalık", "Yüreğir"],
        "Adıyaman": ["Besni", "Çelikhan", "Gerger", "Gölbaşı", "Kahta", "Merkez", "Samsat", "Sincik", "Tut"],
        "Afyonkarahisar": ["Başmakçı", "Bayat", "Bolvadin", "Çay", "Çobanlar", "Dazkırı", "Dinar", "Emirdağ", "Evciler", "Hocalar", "İhsaniye", "İscehisar", "Kızılören", "Merkez", "Sandıklı", "Sinanpaşa", "Sultandağı", "Şuhut"],
        "Ağrı": ["Diyadin", "Doğubayazıt", "Eleşkirt", "Hamur", "Merkez", "Patnos", "Taşlıçay", "Tutak"],
        "Amasya": ["Göynücek", "Gümüşhacıköy", "Hamamözü", "Merkez", "Merzifon", "Suluova", "Taşova"],
        "Ankara": ["Akyurt", "Altındağ", "Ayaş", "Balâ", "Beypazarı", "Çamlıdere", "Çankaya", "Çubuk", "Elmadağ", "Etimesgut", "Evren", "Gölbaşı", "Güdül", "Haymana", "Kalecik", "Kazan", "Keçiören", "Kızılcahamam", "Mamak", "Nallıhan", "Polatlı", "Pursaklar", "Sincan", "Şereflikoçhisar", "Yenimahalle"],
        "Antalya": ["Akseki", "Aksu", "Alanya", "Demre", "Döşemealtı", "Elmalı", "Finike", "Gazipaşa", "Gündoğmuş", "İbradı", "Kaş", "Kemer", "Kepez", "Konyaaltı", "Korkuteli", "Kumluca", "Manavgat", "Muratpaşa", "Serik"],
        "İstanbul": ["Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüp", "Fatih", "Gaziosmanpaşa", "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik", "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli", "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu"],
        "İzmir": ["Aliağa", "Balçova", "Bayındır", "Bayraklı", "Bergama", "Beydağ", "Bornova", "Buca", "Çeşme", "Çiğli", "Dikili", "Foça", "Gaziemir", "Güzelbahçe", "Karabağlar", "Karaburun", "Karşıyaka", "Kemalpaşa", "Kınık", "Kiraz", "Konak", "Menderes", "Menemen", "Narlıdere", "Ödemiş", "Seferihisar", "Selçuk", "Tire", "Torbalı", "Urla"]
        // Diğer şehirler...
    },

    // Tüm şehirleri getir
    getAllCities() {
        return Object.keys(this.data);
    },

    // Belirli bir şehrin ilçelerini getir
    getDistricts(city) {
        return this.data[city] || [];
    },

    // Select elementlerini doldur
    fillSelects(citySelect, districtSelect) {
        // Şehirleri doldur
        citySelect.innerHTML = `
            <option value="">Şehir Seçin</option>
            ${this.getAllCities().map(city => 
                `<option value="${city}">${city}</option>`
            ).join('')}
        `;

        // Şehir seçildiğinde ilçeleri doldur
        citySelect.addEventListener('change', () => {
            const selectedCity = citySelect.value;
            const districts = this.getDistricts(selectedCity);

            districtSelect.innerHTML = `
                <option value="">İlçe Seçin</option>
                ${districts.map(district => 
                    `<option value="${district}">${district}</option>`
                ).join('')}
            `;
            districtSelect.disabled = !selectedCity;
        });

        // Başlangıçta ilçe select'i disabled
        districtSelect.disabled = true;
    }
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('city');
    const districtSelect = document.getElementById('district');
    
    if (citySelect && districtSelect) {
        cities.fillSelects(citySelect, districtSelect);
    }
}); 