import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, Alert, Image, Modal, RefreshControl, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../config';
import { MaterialIcons, FontAwesome5, Ionicons, Entypo } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const heroImage = { uri: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80' };

const HomeScreen = () => {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [profileVisible, setProfileVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchFeaturedProducts();
    checkLogin();
    updateCartCount();
    const unsubscribe = navigation.addListener('focus', () => {
      checkLogin();
      fetchUserData();
      updateCartCount();
    });
    return unsubscribe;
  }, [navigation]);

  // Arama fonksiyonu
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(featuredProducts);
    } else {
      const filtered = featuredProducts.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, featuredProducts]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      if (!response.ok) throw new Error('Kategoriler getirilemedi');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      Alert.alert('Hata', 'Kategoriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) throw new Error('Ürünler getirilemedi');
      const data = await response.json();
      setFeaturedProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      Alert.alert('Hata', 'Ürünler yüklenirken bir hata oluştu');
    } finally {
      setProductsLoading(false);
    }
  };

  const checkLogin = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error('Login kontrolü hatası:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        setUserData(null);
        return;
      }
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        setUserData(null);
        return;
      }
      const data = await response.json();
      setUserData(data);
    } catch (error) {
      setUserData(null);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      setIsLoggedIn(false);
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
    }
  };

  const updateCartCount = async () => {
    try {
      const cartItems = await AsyncStorage.getItem('cart');
      if (cartItems) {
        const items = JSON.parse(cartItems);
        const count = items.reduce((total, item) => total + (item.quantity || 1), 0);
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error('Sepet sayısı güncellenirken hata:', error);
      setCartCount(0);
    }
  };

  const addToCart = async (product) => {
    if (!isLoggedIn) {
      Alert.alert('Uyarı', 'Lütfen önce giriş yapınız.');
      return;
    }
    let cart = await AsyncStorage.getItem('cart');
    cart = cart ? JSON.parse(cart) : [];
    const existingIndex = cart.findIndex((p) => p.id === product.id);
    if (existingIndex !== -1) {
      cart[existingIndex].quantity = (cart[existingIndex].quantity || 1) + 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    await AsyncStorage.setItem('cart', JSON.stringify(cart));
    setCartCount(cart.length);
    Alert.alert('Sepete Eklendi', `${product.name} sepete eklendi!`);
  };

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate('Products', { categoryId: item.id, categoryName: item.name })}
    >
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderFeaturedProduct = ({ item }) => (
    <View style={styles.featuredCard}>
      <TouchableOpacity onPress={() => navigation.navigate('ProductDetail', { product: item })}>
        <View style={styles.featuredImageWrapper}>
          <ImageBackground
            source={{ uri: item.image_url || 'https://via.placeholder.com/300' }}
            style={styles.featuredImage}
            imageStyle={{ borderRadius: 16 }}
          />
        </View>
        <Text style={styles.featuredName}>{item.name}</Text>
        <Text style={styles.featuredPrice}>{parseFloat(item.price).toFixed(2)} TL</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ marginTop: 8, backgroundColor: '#2ecc71', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12 }} onPress={() => addToCart(item)}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sepete Ekle</Text>
      </TouchableOpacity>
    </View>
  );

  // Sabit marka logoları
  const brands = [
    { id: 1, image: 'https://via.placeholder.com/150x50?text=Marka' },
    { id: 2, image: 'https://via.placeholder.com/150x50?text=Marka+2' },
    { id: 3, image: 'https://via.placeholder.com/150x50?text=Marka+3' },
    { id: 4, image: 'https://via.placeholder.com/150x50?text=Marka+4' },
    { id: 5, image: 'https://via.placeholder.com/150x50?text=Marka+5' },
  ];

  const renderBrand = ({ item }) => (
    <View style={styles.brandCard}>
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.brandImage}
        imageStyle={{ borderRadius: 8 }}
      />
    </View>
  );

  // Sabit müşteri yorumları
  const testimonials = [
    {
      id: 1,
      name: 'Ahmet Y.',
      avatar: 'https://via.placeholder.com/40x40?text=User',
      text: 'Ürünler çok kaliteli ve hızlı teslimat yapılıyor. Kesinlikle tavsiye ederim!'
    },
    {
      id: 2,
      name: 'Ayşe K.',
      avatar: 'https://via.placeholder.com/40x40?text=User',
      text: 'Müşteri hizmetleri çok ilgili, her sorunuma anında çözüm buldular.'
    },
    {
      id: 3,
      name: 'Mehmet S.',
      avatar: 'https://via.placeholder.com/40x40?text=User',
      text: 'Fiyatlar uygun ve ürün çeşitliliği çok fazla. Sürekli alışveriş yapıyorum.'
    },
  ];

  const renderTestimonial = ({ item }) => (
    <View style={styles.testimonialCard}>
      <ImageBackground
        source={{ uri: item.avatar }}
        style={styles.testimonialAvatar}
        imageStyle={{ borderRadius: 20 }}
      />
      <Text style={styles.testimonialText}>
        "{item.text}"
      </Text>
      <Text style={styles.testimonialName}>{item.name}</Text>
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Ürün ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Arama Sonuçları */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResults}>
          <Text style={styles.searchResultsTitle}>
            Arama Sonuçları ({filteredProducts.length})
          </Text>
          <FlatList
            data={filteredProducts}
            renderItem={renderFeaturedProduct}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>
      )}

      {/* Başlık */}
      <View style={styles.headerContainer}>
        <Text style={styles.brandTitle}>AlışverişAdresi</Text>
      </View>

      {/* Giriş/Kayıt/Sepet/Profil Butonları */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16, alignItems: 'center' }}>
        {!isLoggedIn ? (
          <>
            <TouchableOpacity
              style={{ backgroundColor: '#2ecc71', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginRight: 8 }}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Giriş Yap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#3498db', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kayıt Ol</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={{ marginRight: 8 }}
              onPress={() => navigation.navigate('Cart')}
            >
              <View>
                <MaterialIcons name="shopping-cart" size={32} color="#2ecc71" />
                {cartCount > 0 && (
                  <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: 'red', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{cartCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginRight: 8 }}
              onPress={() => setProfileVisible(true)}
            >
              <MaterialIcons name="account-circle" size={32} color="#2ecc71" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginRight: 8 }}
              onPress={() => navigation.navigate('Chat')}
            >
              <MaterialIcons name="chat" size={32} color="#2ecc71" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: '#e74c3c', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8 }}
              onPress={handleLogout}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Çıkış Yap</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Profil Modal */}
      <Modal
        visible={profileVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.profileModal}>
            <Text style={styles.profileTitle}>Profil Bilgileri</Text>
            {userData ? (
              <>
                <Text style={styles.profileText}>Ad Soyad: {userData.full_name}</Text>
                <Text style={styles.profileText}>E-posta: {userData.email}</Text>
                <Text style={styles.profileText}>Telefon: {userData.phone || 'Belirtilmemiş'}</Text>
              </>
            ) : (
              <Text style={styles.profileText}>Kullanıcı bilgileri yüklenemedi.</Text>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setProfileVisible(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hero Alanı */}
      <ImageBackground source={heroImage} style={styles.hero} imageStyle={{ opacity: 0.7 }}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Yeni Sezon Ürünleri</Text>
          <Text style={styles.heroDesc}>En yeni ürünleri keşfedin, en iyi fiyatlarla alışveriş yapın!</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('Categories')}>
            <Text style={styles.ctaButtonText}>Alışverişe Başla</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* Popüler Kategoriler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popüler Kategoriler</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#2ecc71" style={{ marginVertical: 16 }} />
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#2ecc71']}
              />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="category" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Henüz kategori bulunmuyor</Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Öne Çıkan Ürünler */}
      {searchQuery.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Öne Çıkan Ürünler</Text>
          {productsLoading ? (
            <ActivityIndicator size="small" color="#2ecc71" style={{ marginVertical: 16 }} />
          ) : (
            <FlatList
              data={featuredProducts}
              renderItem={renderFeaturedProduct}
              keyExtractor={item => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          )}
        </View>
      )}

      {/* Kampanyalar / Avantajlar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avantajlar</Text>
        <View style={styles.campaignGrid}>
          <View style={styles.campaignCard}>
            <MaterialIcons name="local-shipping" size={32} color="#2ecc71" />
            <Text style={styles.campaignTitle}>Ücretsiz Kargo</Text>
            <Text style={styles.campaignDesc}>250 TL üzeri alışverişlerde</Text>
          </View>
          <View style={styles.campaignCard}>
            <FontAwesome5 name="undo" size={28} color="#2ecc71" />
            <Text style={styles.campaignTitle}>İade Garantisi</Text>
            <Text style={styles.campaignDesc}>14 gün içinde ücretsiz iade</Text>
          </View>
          <View style={styles.campaignCard}>
            <Ionicons name="headset" size={32} color="#2ecc71" />
            <Text style={styles.campaignTitle}>7/24 Destek</Text>
            <Text style={styles.campaignDesc}>Her zaman yanınızdayız</Text>
          </View>
          <View style={styles.campaignCard}>
            <Entypo name="shield" size={32} color="#2ecc71" />
            <Text style={styles.campaignTitle}>Güvenli Ödeme</Text>
            <Text style={styles.campaignDesc}>SSL güvenlik sertifikası</Text>
          </View>
        </View>
      </View>

      {/* Markalar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>İş Ortaklarımız</Text>
        <FlatList
          data={brands}
          renderItem={renderBrand}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.brandList}
        />
      </View>

      {/* Müşteri Yorumları */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Müşteri Yorumları</Text>
        <FlatList
          data={testimonials}
          renderItem={renderTestimonial}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.testimonialList}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2ecc71',
    textAlign: 'center',
  },
  hero: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContent: {
    backgroundColor: 'rgba(40,40,40,0.72)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
    marginHorizontal: 16,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroDesc: {
    color: '#f0f0f0',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: 'orange',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 30,
    marginTop: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 32,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginLeft: 16,
    marginBottom: 12,
  },
  categoryList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 28,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  featuredList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  featuredCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredImageWrapper: {
    width: 120,
    height: 120,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
  },
  featuredPrice: {
    fontSize: 14,
    color: '#2ecc71',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  campaignGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
  },
  campaignCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  campaignDesc: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
  },
  brandList: {
    paddingLeft: 16,
    paddingRight: 8,
    alignItems: 'center',
  },
  brandCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  brandImage: {
    width: 100,
    height: 40,
    resizeMode: 'contain',
  },
  testimonialList: {
    paddingLeft: 16,
    paddingRight: 8,
    alignItems: 'center',
  },
  testimonialCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginRight: 12,
    alignItems: 'center',
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  testimonialText: {
    fontSize: 15,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  testimonialName: {
    fontSize: 14,
    color: '#2ecc71',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2ecc71',
  },
  profileText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#2ecc71',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  searchResults: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
});

export default HomeScreen; 