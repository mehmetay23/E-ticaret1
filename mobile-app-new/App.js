import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProductsScreen from './screens/ProductsScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import AdminScreen from './screens/AdminScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import HomeScreen from './screens/HomeScreen';
import PaymentScreen from './screens/PaymentScreen';
import OrderSuccessScreen from './screens/OrderSuccessScreen';
import OrdersScreen from './screens/OrdersScreen';
import CartScreen from './screens/CartScreen';
import ChatScreen from './screens/ChatScreen';
import { API_URL } from './config';
import { TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');
        setUserToken(token);
        setUserRole(role);
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2ecc71',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          options={{ 
            title: 'AlışverişAdresi',
            headerRight: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Cart')}
                style={{ marginRight: 15 }}
              >
                <MaterialIcons name="shopping-cart" size={24} color="#2ecc71" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen 
          name="Categories" 
          component={CategoriesScreen} 
          options={{ 
            title: 'Kategoriler',
          }}
        />
        <Stack.Screen 
          name="Products" 
          component={ProductsScreen}
          options={({ route }) => ({ 
            title: route.params?.categoryName ? `${route.params.categoryName} Ürünleri` : 'Ürünler'
          })}
        />
        <Stack.Screen 
          name="ProductDetail" 
          component={ProductDetailScreen} 
          options={{ 
            title: 'Ürün Detayı',
          }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ title: 'Giriş Yap' }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: 'Kayıt Ol' }}
        />
        <Stack.Screen 
          name="Admin" 
          component={AdminScreen} 
          options={{ 
            title: 'Admin Panel',
            headerLeft: null,
          }}
        />
        <Stack.Screen 
          name="Cart" 
          component={CartScreen}
          options={{ title: 'Sepetim' }}
        />
        <Stack.Screen 
          name="Checkout" 
          component={require('./screens/CheckoutScreen').default} 
          options={{ 
            title: 'Ödeme',
          }}
        />
        <Stack.Screen 
          name="Payment" 
          component={PaymentScreen} 
          options={{ 
            title: 'Ödeme',
          }}
        />
        <Stack.Screen 
          name="OrderSuccess" 
          component={OrderSuccessScreen} 
          options={{ 
            title: 'Sipariş Başarılı',
            headerLeft: null,
          }}
        />
        <Stack.Screen 
          name="Orders" 
          component={OrdersScreen} 
          options={{ 
            title: 'Siparişlerim',
          }}
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{ title: 'Yardımcı Asistan' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App; 