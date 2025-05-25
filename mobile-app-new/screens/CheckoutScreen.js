import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView, Modal, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const CITIES = [
  { name: 'İstanbul', districts: ['Kadıköy', 'Beşiktaş', 'Üsküdar'] },
  { name: 'Ankara', districts: ['Çankaya', 'Keçiören', 'Yenimahalle'] },
  { name: 'İzmir', districts: ['Konak', 'Bornova', 'Karşıyaka'] },
];

const CheckoutScreen = () => {
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', city: '', district: '', address: '' });
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [cart, setCart] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    loadAddresses();
    loadCart();
  }, []);

  const loadAddresses = async () => {
    const data = await AsyncStorage.getItem('addresses');
    const arr = data ? JSON.parse(data) : [];
    setAddresses(arr);
    if (arr.length > 0) setSelectedAddressId(arr.find(a => a.isDefault)?.id || arr[0].id);
  };

  const loadCart = async () => {
    const data = await AsyncStorage.getItem('cart');
    setCart(data ? JSON.parse(data) : []);
  };

  const saveAddress = async () => {
    if (!form.fullName || !form.phone || !form.city || !form.district || !form.address) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }
    const newAddress = {
      id: Date.now(),
      ...form,
      isDefault: addresses.length === 0
    };
    const newAddresses = [...addresses, newAddress];
    await AsyncStorage.setItem('addresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
    setShowAddressForm(false);
    setForm({ fullName: '', phone: '', city: '', district: '', address: '' });
    setSelectedAddressId(newAddress.id);
  };

  const selectAddress = (id) => {
    setSelectedAddressId(id);
    const newAddresses = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    AsyncStorage.setItem('addresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  const removeAddress = async (id) => {
    let newAddresses = addresses.filter(a => a.id !== id);
    if (newAddresses.length > 0 && !newAddresses.some(a => a.isDefault)) {
      newAddresses[0].isDefault = true;
      setSelectedAddressId(newAddresses[0].id);
    }
    await AsyncStorage.setItem('addresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  // Sipariş özeti hesaplamaları
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
  const shipping = subtotal > 150 ? 0 : 29.90;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  const proceedToPayment = () => {
    if (!selectedAddressId) {
      Alert.alert('Uyarı', 'Lütfen teslimat adresi seçin.');
      return;
    }
    
    // Seçili adresi ve sipariş bilgilerini Payment sayfasına gönder
    const selectedAddress = addresses.find(addr => addr.id === selectedAddressId);
    navigation.navigate('Payment', {
      address: selectedAddress,
      orderSummary: {
        subtotal,
        shipping,
        tax,
        total
      }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Teslimat Bilgileri</Text>
        {/* Kayıtlı adresler */}
        {addresses.length === 0 ? (
          <Text style={styles.noAddress}>Kayıtlı adresiniz yok.</Text>
        ) : (
          addresses.map(address => (
            <TouchableOpacity
              key={address.id}
              style={[styles.addressCard, address.id === selectedAddressId && styles.selectedAddress]}
              onPress={() => selectAddress(address.id)}
            >
              <Text style={styles.addressName}>{address.fullName}</Text>
              <Text style={styles.addressDetails}>{address.address}, {address.district} / {address.city}</Text>
              <Text style={styles.addressDetails}>Tel: {address.phone}</Text>
              <TouchableOpacity onPress={() => removeAddress(address.id)} style={styles.removeBtn}>
                <Text style={{ color: '#e74c3c', fontWeight: 'bold' }}>Sil</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
        <TouchableOpacity style={styles.addAddressBtn} onPress={() => setShowAddressForm(true)}>
          <Text style={{ color: '#2ecc71', fontWeight: 'bold' }}>+ Yeni Adres Ekle</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sipariş Özeti */}
      <View style={styles.orderSummaryContainer}>
        <Text style={styles.sectionTitle}>Sipariş Özeti</Text>
        {cart.length === 0 ? (
          <Text style={styles.noAddress}>Sepetiniz boş.</Text>
        ) : (
          <FlatList
            data={cart}
            renderItem={({ item }) => (
              <View style={styles.orderItem}>
                <View style={styles.orderImageBox}>
                  <Image source={{ uri: item.image_url || 'https://via.placeholder.com/80' }} style={styles.orderImage} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderName}>{item.name}</Text>
                  <Text style={styles.orderQty}>Adet: {item.quantity || 1}</Text>
                  <Text style={styles.orderPrice}>{(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)} TL</Text>
                </View>
              </View>
            )}
            keyExtractor={(item, idx) => idx.toString()}
            style={styles.orderList}
          />
        )}
        {/* Toplamlar */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}><Text>Ara Toplam:</Text><Text>{subtotal.toFixed(2)} TL</Text></View>
          <View style={styles.summaryRow}><Text>Kargo:</Text><Text>{shipping.toFixed(2)} TL</Text></View>
          <View style={styles.summaryRow}><Text>KDV (%18):</Text><Text>{tax.toFixed(2)} TL</Text></View>
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderColor: '#eee', marginTop: 8, paddingTop: 8 }]}><Text style={{ fontWeight: 'bold' }}>Genel Toplam:</Text><Text style={{ fontWeight: 'bold', color: '#2ecc71' }}>{total.toFixed(2)} TL</Text></View>
        </View>
        <TouchableOpacity style={styles.paymentBtn} onPress={proceedToPayment}>
          <Text style={styles.paymentBtnText}>Güvenli Ödeme</Text>
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', color: '#888', marginTop: 8 }}>%100 Güvenli Alışveriş</Text>
      </View>

      {/* Adres ekleme formu */}
      <Modal visible={showAddressForm} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Yeni Adres</Text>
            <TextInput placeholder="Ad Soyad" style={styles.input} value={form.fullName} onChangeText={t => setForm(f => ({ ...f, fullName: t }))} />
            <TextInput placeholder="Telefon" style={styles.input} value={form.phone} onChangeText={t => setForm(f => ({ ...f, phone: t }))} keyboardType="phone-pad" />
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text>İl</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => {
                    Alert.alert(
                      'İl Seçin',
                      '',
                      CITIES.map(city => ({
                        text: city.name,
                        onPress: () => setForm(f => ({ ...f, city: city.name, district: '' }))
                      }))
                    );
                  }}
                >
                  <Text>{form.city || 'İl Seçin'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <Text>İlçe</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => {
                    if (!form.city) {
                      Alert.alert('Uyarı', 'Lütfen önce il seçin');
                      return;
                    }
                    const districts = CITIES.find(c => c.name === form.city)?.districts || [];
                    Alert.alert(
                      'İlçe Seçin',
                      '',
                      districts.map(district => ({
                        text: district,
                        onPress: () => setForm(f => ({ ...f, district }))
                      }))
                    );
                  }}
                >
                  <Text>{form.district || 'İlçe Seçin'}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TextInput placeholder="Adres" style={styles.input} value={form.address} onChangeText={t => setForm(f => ({ ...f, address: t }))} multiline />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowAddressForm(false)} style={[styles.formBtn, { backgroundColor: '#e74c3c' }]}> 
                <Text style={{ color: '#fff' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveAddress} style={[styles.formBtn, { backgroundColor: '#2ecc71' }]}> 
                <Text style={{ color: '#fff' }}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  orderSummaryContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  orderList: {
    maxHeight: 200,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 16 },
  noAddress: { color: '#888', fontSize: 16, marginBottom: 12 },
  addressCard: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, marginBottom: 10 },
  selectedAddress: { borderWidth: 2, borderColor: '#2ecc71' },
  addressName: { fontWeight: 'bold', fontSize: 16 },
  addressDetails: { color: '#555', fontSize: 14 },
  removeBtn: { marginTop: 6 },
  addAddressBtn: { backgroundColor: '#e0f7ef', padding: 10, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  formContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%' },
  formTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 16 },
  formBtn: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  orderItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#f5f5f5', borderRadius: 10, padding: 10 },
  orderImageBox: { width: 60, height: 60, marginRight: 10 },
  orderImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#eee' },
  orderName: { fontWeight: 'bold', fontSize: 15 },
  orderQty: { color: '#555', fontSize: 14 },
  orderPrice: { color: '#2ecc71', fontWeight: 'bold', fontSize: 15 },
  summaryBox: { backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, marginTop: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  paymentBtn: { backgroundColor: '#2ecc71', paddingVertical: 16, borderRadius: 8, marginTop: 18, alignItems: 'center' },
  paymentBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
});

export default CheckoutScreen; 