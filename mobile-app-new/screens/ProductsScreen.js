import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import { MaterialIcons } from '@expo/vector-icons';

const ProductsScreen = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const route = useRoute();
  const { categoryId, categoryName, filter, filterType } = route.params || {};

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      if (filter && filterType === 'feature') {
        const filtered = products.filter(product => 
          product && 
          typeof product === 'object' && 
          product.description && 
          typeof product.description === 'string' && 
          product.description.toLowerCase().includes(filter.toLowerCase())
        );
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts(products);
      }
    } else {
      const filtered = products.filter(product => 
        product && 
        typeof product === 'object' && 
        (product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [products, filter, filterType, searchQuery]);

  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      let url = `${API_URL}/api/products`;
      if (categoryId) {
        url = `${API_URL}/api/products/category/${categoryId}`;
      }
      console.log('Fetching products from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`Ürünler getirilemedi: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received products data:', data);
      
      const validProducts = data.filter(product => 
        product && 
        typeof product === 'object' && 
        product.id !== undefined
      );
      
      console.log('Filtered valid products:', validProducts);
      setProducts(validProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Hata', 'Ürünler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Uyarı', 'Lütfen önce giriş yapınız.');
        navigation.navigate('Login');
        return;
      }

      let cart = await AsyncStorage.getItem('cart');
      cart = cart ? JSON.parse(cart) : [];
      
      const existingItem = cart.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      
      await AsyncStorage.setItem('cart', JSON.stringify(cart));
      Alert.alert('Başarılı', 'Ürün sepete eklendi!');
    } catch (error) {
      Alert.alert('Hata', 'Ürün sepete eklenirken bir hata oluştu.');
    }
  };

  const renderProduct = ({ item }) => {
    if (!item) {
      console.warn('Received undefined item in renderProduct');
      return null;
    }
    
    // Ensure all required properties exist with fallbacks
    const product = {
      id: item.id,
      name: item.name || 'İsimsiz Ürün',
      description: item.description || '',
      price: item.price || 0,
      image_url: item.image_url || 'https://via.placeholder.com/150',
      stock: item.stock || 0
    };

    console.log('Rendering product:', product); // Debug için log ekle

    return (
      <View style={styles.productCard}>
        <TouchableOpacity 
          onPress={() => {
            console.log('Navigating to ProductDetail with product:', product); // Debug için log ekle
            navigation.navigate('ProductDetail', { product });
          }}
        >
          <Image 
            source={{ uri: product.image_url }} 
            style={styles.productImage}
            defaultSource={{ uri: 'https://via.placeholder.com/150' }}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription} numberOfLines={2}>
              {product.description}
            </Text>
            <Text style={styles.productPrice}>{parseFloat(product.price).toFixed(2)} TL</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={() => addToCart(product)}
        >
          <MaterialIcons name="shopping-cart" size={20} color="#fff" />
          <Text style={styles.addToCartButtonText}>Sepete Ekle</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
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

      {filter && filterType === 'feature' && (
        <View style={styles.filterHeader}>
          <Text style={styles.filterTitle}>
            {filter.charAt(0).toUpperCase() + filter.slice(1)} Ürünleri
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2ecc71" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.productList}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Ürün bulunamadı'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  addToCartButton: {
    backgroundColor: '#2ecc71',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  addToCartButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  filterHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ProductsScreen; 