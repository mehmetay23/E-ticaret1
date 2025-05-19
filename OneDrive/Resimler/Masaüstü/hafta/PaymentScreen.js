import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../config';

const PaymentScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const data = await AsyncStorage.getItem('cart');
      const cartItems = data ? JSON.parse(data) : [];
      
      if (cartItems.length === 0) {
        Alert.alert('Uyarı', 'Sepetiniz boş!');
        navigation.navigate('Cart');
        return;
      }

      setCart(cartItems);
    } catch (error) {
      console.error('Sepet yükleme hatası:', error);
      Alert.alert('Hata', 'Sepet yüklenirken bir hata oluştu');
    }
  };

  // Sipariş özeti hesaplamaları
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
  const shipping = subtotal > 150 ? 0 : 29.90;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiryDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (!form.cardName || !form.cardNumber || !form.expiryDate || !form.cvv) {
      Alert.alert('Hata', 'Lütfen tüm kart bilgilerini doldurun.');
      return;
    }

    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      
      // API'ye ödeme isteği gönder
      const response = await fetch(`${API_URL}/api/orders/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardName: form.cardName,
          cardNumber: form.cardNumber.replace(/\s/g, ''),
          expiryDate: form.expiryDate,
          cvv: form.cvv,
          amount: total,
          cartItems: cart
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.removeItem('cart');
        navigation.reset({
          index: 0,
          routes: [
            { 
              name: 'Orders',
              params: { 
                orderId: data.order_id,
                message: 'Siparişiniz başarıyla oluşturuldu!'
              }
            }
          ],
        });
      } else {
        const errorData = await response.json();
        Alert.alert('Hata', errorData.message || 'Ödeme işlemi başarısız oldu.');
      }
    } catch (error) {
      console.error('Ödeme hatası:', error);
      Alert.alert('Hata', 'Ödeme işlemi sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Kart Önizleme */}
      <View style={styles.cardPreview}>
        <View style={styles.cardChip} />
        <Text style={styles.cardNumber}>
          {form.cardNumber || '**** **** **** ****'}
        </Text>
        <View style={styles.cardInfo}>
          <View>
            <Text style={styles.cardLabel}>KART SAHİBİ</Text>
            <Text style={styles.cardValue}>
              {form.cardName || 'AD SOYAD'}
            </Text>
          </View>
          <View>
            <Text style={styles.cardLabel}>SON KULLANMA</Text>
            <Text style={styles.cardValue}>
              {form.expiryDate || 'AA/YY'}
            </Text>
          </View>
        </View>
      </View>

      {/* Kart Bilgileri Formu */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Kart Bilgileri</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Kart Üzerindeki İsim"
          value={form.cardName}
          onChangeText={(text) => setForm({ ...form, cardName: text.toUpperCase() })}
        />

        <TextInput
          style={styles.input}
          placeholder="Kart Numarası"
          value={form.cardNumber}
          onChangeText={(text) => setForm({ ...form, cardNumber: formatCardNumber(text) })}
          maxLength={19}
          keyboardType="numeric"
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="AA/YY"
            value={form.expiryDate}
            onChangeText={(text) => setForm({ ...form, expiryDate: formatExpiryDate(text) })}
            maxLength={5}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="CVV"
            value={form.cvv}
            onChangeText={(text) => setForm({ ...form, cvv: text.replace(/\D/g, '') })}
            maxLength={3}
            keyboardType="numeric"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Ödemeyi Tamamla</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Sipariş Özeti */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Sipariş Özeti</Text>
        
        {cart.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <Image
              source={{ uri: item.image_url || 'https://via.placeholder.com/80' }}
              style={styles.orderImage}
            />
            <View style={styles.orderDetails}>
              <Text style={styles.orderName}>{item.name}</Text>
              <Text style={styles.orderCategory}>{item.category_name || 'Genel'}</Text>
              <View style={styles.orderPriceQty}>
                <Text>{item.quantity} adet</Text>
                <Text style={styles.orderPrice}>
                  {(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)} TL
                </Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.summaryTotals}>
          <View style={styles.summaryRow}>
            <Text>Ara Toplam</Text>
            <Text>{subtotal.toFixed(2)} TL</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Kargo</Text>
            <Text>{shipping.toFixed(2)} TL</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>KDV (%18)</Text>
            <Text>{tax.toFixed(2)} TL</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalText}>Toplam</Text>
            <Text style={styles.totalAmount}>{total.toFixed(2)} TL</Text>
          </View>
        </View>
      </View>

      <View style={styles.secureInfo}>
        <Text style={styles.secureText}>256-bit SSL şifreleme ile güvenli alışveriş</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  cardPreview: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    minHeight: 200,
  },
  cardChip: {
    width: 50,
    height: 40,
    backgroundColor: '#ffd700',
    borderRadius: 8,
    marginBottom: 20,
  },
  cardNumber: {
    color: '#fff',
    fontSize: 24,
    letterSpacing: 4,
    marginVertical: 20,
    fontFamily: 'monospace',
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cardLabel: {
    color: '#a0aec0',
    fontSize: 12,
    marginBottom: 4,
  },
  cardValue: {
    color: '#fff',
    fontSize: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  payButton: {
    backgroundColor: '#2ecc71',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  orderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
  },
  orderName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderCategory: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 8,
  },
  orderPriceQty: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPrice: {
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  summaryTotals: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 12,
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  totalAmount: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2ecc71',
  },
  secureInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  secureText: {
    color: '#64748b',
    fontSize: 14,
  },
});

export default PaymentScreen; 