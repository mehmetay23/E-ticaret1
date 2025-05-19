import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  Modal,
  TextInput,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { API_URL } from '../config';

const AdminScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalSales: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalUsers: 0
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Verileri yükle
  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Dashboard verileri
      const statsResponse = await fetch(`${API_URL}/admin/dashboard`, { headers });
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Ürünler
      const productsResponse = await fetch(`${API_URL}/products`, { headers });
      const productsData = await productsResponse.json();
      setProducts(productsData);

      // Siparişler
      const ordersResponse = await fetch(`${API_URL}/orders`, { headers });
      const ordersData = await ordersResponse.json();
      setOrders(ordersData);

      // Kullanıcılar
      const usersResponse = await fetch(`${API_URL}/users`, { headers });
      const usersData = await usersResponse.json();
      setUsers(usersData);
    } catch (error) {
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    }
  };

  // Sayfa yüklendiğinde
  useEffect(() => {
    loadData();
  }, []);

  // Pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Dashboard kartı
  const StatCard = ({ title, value, icon }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color="#3498db" />
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  // Ürün kartı
  const ProductCard = ({ product }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        setSelectedProduct(product);
        setModalVisible(true);
      }}
    >
      <Image 
        source={{ uri: product.image_url || 'https://via.placeholder.com/100' }}
        style={styles.productImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{product.name}</Text>
        <Text style={styles.cardPrice}>₺{parseFloat(product.price).toFixed(2)}</Text>
        <Text style={styles.cardStock}>Stok: {product.stock}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            setSelectedProduct(product);
            setModalVisible(true);
          }}
        >
          <Ionicons name="pencil" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteProduct(product.id)}
        >
          <Ionicons name="trash" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Sipariş kartı
  const OrderCard = ({ order }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderNumber}>Sipariş #{order.id}</Text>
        <Text style={[
          styles.orderStatus,
          { color: order.status === 'pending' ? '#f1c40f' : '#2ecc71' }
        ]}>
          {order.status === 'pending' ? 'Beklemede' : 'Onaylandı'}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.orderDate}>
          {new Date(order.created_at).toLocaleDateString()}
        </Text>
        <Text style={styles.orderTotal}>
          ₺{parseFloat(order.total).toFixed(2)}
        </Text>
      </View>
      {order.status === 'pending' && (
        <TouchableOpacity 
          style={styles.approveButton}
          onPress={() => approveOrder(order.id)}
        >
          <Text style={styles.approveButtonText}>Onayla</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Kullanıcı kartı
  const UserCard = ({ user }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.userName}>{user.full_name}</Text>
        <Text style={styles.userRole}>{user.role}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.userDate}>
          Kayıt: {new Date(user.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.roleButton}
        onPress={() => showRoleModal(user)}
      >
        <Text style={styles.roleButtonText}>Rol Değiştir</Text>
      </TouchableOpacity>
    </View>
  );

  // Ana içerik
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ScrollView 
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View style={styles.statsContainer}>
              <StatCard 
                title="Toplam Satış" 
                value={`₺${parseFloat(stats.totalSales).toFixed(2)}`}
                icon="cash-outline"
              />
              <StatCard 
                title="Bekleyen Siparişler" 
                value={stats.pendingOrders}
                icon="time-outline"
              />
              <StatCard 
                title="Toplam Ürün" 
                value={stats.totalProducts}
                icon="cube-outline"
              />
              <StatCard 
                title="Toplam Kullanıcı" 
                value={stats.totalUsers}
                icon="people-outline"
              />
            </View>
          </ScrollView>
        );

      case 'products':
        return (
          <FlatList
            data={products}
            renderItem={({ item }) => <ProductCard product={item} />}
            keyExtractor={item => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListHeaderComponent={
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  setSelectedProduct(null);
                  setModalVisible(true);
                }}
              >
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.addButtonText}>Yeni Ürün Ekle</Text>
              </TouchableOpacity>
            }
          />
        );

      case 'orders':
        return (
          <FlatList
            data={orders}
            renderItem={({ item }) => <OrderCard order={item} />}
            keyExtractor={item => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        );

      case 'users':
        return (
          <FlatList
            data={users}
            renderItem={({ item }) => <UserCard user={item} />}
            keyExtractor={item => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        );
    }
  };

  // Ürün silme
  const deleteProduct = async (productId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Ürün başarıyla silindi');
        loadData(); // Verileri yenile
      } else {
        Alert.alert('Hata', 'Ürün silinirken bir hata oluştu');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu');
    }
  };

  // Ürün kaydetme/güncelleme
  const saveProduct = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const url = selectedProduct?.id 
        ? `${API_URL}/products/${selectedProduct.id}`
        : `${API_URL}/products`;
      
      const response = await fetch(url, {
        method: selectedProduct?.id ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedProduct)
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Ürün başarıyla kaydedildi');
        setModalVisible(false);
        loadData(); // Verileri yenile
      } else {
        Alert.alert('Hata', 'Ürün kaydedilirken bir hata oluştu');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu');
    }
  };

  // Sipariş onaylama
  const approveOrder = async (orderId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/orders/${orderId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Sipariş başarıyla onaylandı');
        loadData(); // Verileri yenile
      } else {
        Alert.alert('Hata', 'Sipariş onaylanırken bir hata oluştu');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu');
    }
  };

  // Kullanıcı rolü değiştirme modalı
  const showRoleModal = (user) => {
    setSelectedUser(user);
    setRoleModalVisible(true);
  };

  // Kullanıcı rolü değiştirme
  const changeUserRole = async (newRole) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        Alert.alert('Başarılı', 'Kullanıcı rolü başarıyla güncellendi');
        setRoleModalVisible(false);
        loadData(); // Verileri yenile
      } else {
        Alert.alert('Hata', 'Rol değiştirilirken bir hata oluştu');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bir hata oluştu');
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      
      {/* Alt navigasyon */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('dashboard')}
        >
          <Ionicons 
            name="home" 
            size={24} 
            color={activeTab === 'dashboard' ? '#3498db' : '#666'} 
          />
          <Text style={[
            styles.navText,
            { color: activeTab === 'dashboard' ? '#3498db' : '#666' }
          ]}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('products')}
        >
          <Ionicons 
            name="cube" 
            size={24} 
            color={activeTab === 'products' ? '#3498db' : '#666'} 
          />
          <Text style={[
            styles.navText,
            { color: activeTab === 'products' ? '#3498db' : '#666' }
          ]}>Ürünler</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('orders')}
        >
          <Ionicons 
            name="cart" 
            size={24} 
            color={activeTab === 'orders' ? '#3498db' : '#666'} 
          />
          <Text style={[
            styles.navText,
            { color: activeTab === 'orders' ? '#3498db' : '#666' }
          ]}>Siparişler</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem} 
          onPress={() => setActiveTab('users')}
        >
          <Ionicons 
            name="people" 
            size={24} 
            color={activeTab === 'users' ? '#3498db' : '#666'} 
          />
          <Text style={[
            styles.navText,
            { color: activeTab === 'users' ? '#3498db' : '#666' }
          ]}>Kullanıcılar</Text>
        </TouchableOpacity>
      </View>

      {/* Ürün Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Ürün Adı"
              value={selectedProduct?.name || ''}
              onChangeText={(text) => setSelectedProduct({...selectedProduct, name: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Fiyat"
              keyboardType="numeric"
              value={selectedProduct?.price?.toString() || ''}
              onChangeText={(text) => setSelectedProduct({...selectedProduct, price: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Stok"
              keyboardType="numeric"
              value={selectedProduct?.stock?.toString() || ''}
              onChangeText={(text) => setSelectedProduct({...selectedProduct, stock: text})}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveProduct}
              >
                <Text style={styles.buttonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rol Değiştirme Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={roleModalVisible}
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kullanıcı Rolü Değiştir</Text>
            <Text style={styles.modalSubtitle}>
              {selectedUser?.full_name} için yeni rol seçin
            </Text>

            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: '#3498db' }]}
              onPress={() => changeUserRole('user')}
            >
              <Text style={styles.roleButtonText}>Kullanıcı</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.roleButton, { backgroundColor: '#2ecc71' }]}
              onPress={() => changeUserRole('admin')}
            >
              <Text style={styles.roleButtonText}>Admin</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton, { marginTop: 20 }]}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.buttonText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '45%',
    backgroundColor: 'white',
    padding: 15,
    margin: '2.5%',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 5,
  },
  card: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardContent: {
    marginTop: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  cardPrice: {
    fontSize: 14,
    color: '#3498db',
    marginTop: 5,
  },
  cardStock: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    marginLeft: 5,
  },
  editButton: {
    backgroundColor: '#f1c40f',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 5,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
  },
  saveButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderStatus: {
    fontSize: 14,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 16,
    color: '#3498db',
    marginTop: 5,
  },
  approveButton: {
    backgroundColor: '#2ecc71',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  approveButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userRole: {
    fontSize: 14,
    color: '#3498db',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  roleButton: {
    backgroundColor: '#f1c40f',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  roleButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default AdminScreen; 