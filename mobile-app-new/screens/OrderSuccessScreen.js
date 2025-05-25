import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const OrderSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderDetails } = route.params || {};

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✓</Text>
        </View>
        
        <Text style={styles.title}>Siparişiniz Alındı!</Text>
        <Text style={styles.subtitle}>
          Ödemeniz başarıyla tamamlandı. Siparişiniz en kısa sürede hazırlanacak.
        </Text>

        {orderDetails && (
          <View style={styles.orderDetails}>
            <Text style={styles.sectionTitle}>Sipariş Detayları</Text>
            
            {orderDetails.items.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Image
                  source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>{item.quantity} adet</Text>
                  <Text style={styles.itemPrice}>
                    {(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)} TL
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Toplam Tutar</Text>
              <Text style={styles.totalAmount}>{orderDetails.total.toFixed(2)} TL</Text>
            </View>

            <Text style={styles.orderDate}>
              Sipariş Tarihi: {new Date(orderDetails.date).toLocaleDateString('tr-TR')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('Home')}
        >
          <Text style={styles.buttonText}>Alışverişe Devam Et</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  orderDetails: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemQuantity: {
    color: '#666',
    marginBottom: 4,
  },
  itemPrice: {
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  orderDate: {
    marginTop: 15,
    color: '#666',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2ecc71',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderSuccessScreen; 