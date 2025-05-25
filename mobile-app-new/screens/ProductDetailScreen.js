import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable, Alert, Animated, Linking, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const ProductDetailScreen = ({ route }) => {
  const { product } = route.params || {};
  const navigation = useNavigation();
  const [isPressed, setIsPressed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastOpacity] = useState(new Animated.Value(0));

  // Ürün verilerini kontrol et
  useEffect(() => {
    console.log('ProductDetailScreen received product:', product); // Debug için log ekle
    if (!product) {
      Alert.alert('Hata', 'Ürün bilgileri yüklenemedi');
      navigation.goBack();
    }
  }, [product, navigation]);

  const showToastMessage = () => {
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowToast(false);
    });
  };

  const addToCart = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
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
      showToastMessage();
    } catch (error) {
      Alert.alert('Hata', 'Ürün sepete eklenirken bir hata oluştu.');
    }
  };

  const handleFeaturePress = (feature) => {
    // Özelliğe göre ürünleri filtreleyerek Products ekranına yönlendir
    navigation.navigate('Products', {
      filter: feature.toLowerCase(),
      filterType: 'feature'
    });
  };

  // Ürün özelliklerini ayır
  const features = React.useMemo(() => {
    if (!product || !product.description) {
      console.log('No product or description available'); // Debug için log ekle
      return [];
    }
    
    try {
      const featureList = product.description
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);
      console.log('Extracted features:', featureList); // Debug için log ekle
      return featureList;
    } catch (error) {
      console.error('Error parsing product features:', error);
      return [];
    }
  }, [product]);

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={styles.loadingText}>Ürün yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image 
          source={{ uri: product.image_url || 'https://via.placeholder.com/300' }} 
          style={styles.productImage}
          defaultSource={{ uri: 'https://via.placeholder.com/300' }}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name || 'İsimsiz Ürün'}</Text>
          <Text style={styles.productPrice}>
            {parseFloat(product.price || 0).toFixed(2)} TL
          </Text>
          
          {/* Ürün Özellikleri */}
          {features.length > 0 && (
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Benzer Ürünler:</Text>
              {features.map((feature, index) => (
                <Pressable
                  key={index}
                  style={styles.featureButton}
                  onPress={() => handleFeaturePress(feature)}
                >
                  <Text style={styles.featureText}>{feature} ürünlerini gör</Text>
                  <MaterialIcons name="arrow-forward-ios" size={16} color="#2ecc71" />
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.stockInfo}>
            <Text style={styles.stockText}>
              Stok Durumu: {product.stock > 0 ? 'Stokta Var' : 'Stokta Yok'}
            </Text>
            <Text style={styles.stockCount}>{product.stock || 0} adet</Text>
          </View>

          <Pressable
            style={[
              styles.addToCartButton,
              isPressed && styles.addToCartButtonPressed
            ]}
            onPress={addToCart}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
          >
            <Text style={styles.addToCartButtonText}>Sepete Ekle</Text>
          </Pressable>
        </View>
      </ScrollView>

      {showToast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <MaterialIcons name="check-circle" size={24} color="#fff" />
          <Text style={styles.toastText}>Ürün sepete eklendi!</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 15,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  stockText: {
    fontSize: 16,
    color: '#666',
  },
  stockCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  addToCartButton: {
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addToCartButtonPressed: {
    backgroundColor: '#27ae60',
    transform: [{ scale: 0.98 }],
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#2ecc71',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default ProductDetailScreen; 