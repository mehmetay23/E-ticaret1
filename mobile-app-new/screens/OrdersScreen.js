import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import { MaterialIcons } from '@expo/vector-icons';

const OrdersScreen = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Uyarı', 'Lütfen giriş yapınız.');
        navigation.navigate('Login');
        return;
      }

      const response = await fetch(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Siparişler getirilemedi');
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      Alert.alert('Hata', 'Siparişler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { order: item })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>Sipariş #{item.id}</Text>
        <Text style={[
          styles.orderStatus,
          { color: item.status === 'completed' ? '#2ecc71' : '#f39c12' }
        ]}>
          {item.status === 'completed' ? 'Tamamlandı' : 'Hazırlanıyor'}
        </Text>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.orderDate}>
          {new Date(item.created_at).toLocaleDateString('tr-TR')}
        </Text>
        <Text style={styles.orderTotal}>
          {parseFloat(item.total).toFixed(2)} TL
        </Text>
      </View>

      <View style={styles.orderItems}>
        {item.items.slice(0, 2).map((product, index) => (
          <View key={index} style={styles.orderItem}>
            <Image
              source={{ uri: product.image_url || 'https://via.placeholder.com/50' }}
              style={styles.productImage}
            />
            <Text style={styles.productName} numberOfLines={1}>
              {product.name}
            </Text>
            <Text style={styles.productQuantity}>
              {product.quantity} adet
            </Text>
          </View>
        ))}
        {item.items.length > 2 && (
          <Text style={styles.moreItems}>
            +{item.items.length - 2} ürün daha
          </Text>
        )}
      </View>

      <View style={styles.orderFooter}>
        <TouchableOpacity 
          style={styles.detailButton}
          onPress={() => navigation.navigate('OrderDetail', { order: item })}
        >
          <Text style={styles.detailButtonText}>Detayları Gör</Text>
          <MaterialIcons name="chevron-right" size={20} color="#2ecc71" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={styles.loadingText}>Siparişler Yükleniyor...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="receipt-long" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Henüz siparişiniz bulunmuyor.</Text>
        <TouchableOpacity 
          style={styles.shopButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.shopButtonText}>Alışverişe Başla</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        onRefresh={fetchOrders}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  moreItems: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonText: {
    color: '#2ecc71',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 4,
  },
  shopButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrdersScreen; 