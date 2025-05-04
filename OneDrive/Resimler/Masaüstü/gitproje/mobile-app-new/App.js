import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainScreen from './screens/MainScreen';
import ProductsScreen from './screens/ProductsScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import { API_URL } from './config';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // API URL'yi kontrol et ve gerekirse güncelle
        const savedApiUrl = await AsyncStorage.getItem('apiUrl');
        if (savedApiUrl) {
          // Eğer kaydedilmiş bir API URL varsa, onu kullan
          global.API_URL = savedApiUrl;
        } else {
          // Yoksa varsayılan URL'yi kaydet
          await AsyncStorage.setItem('apiUrl', API_URL);
          global.API_URL = API_URL;
        }

        const token = await AsyncStorage.getItem('token');
        setUserToken(token);
      } catch (e) {
        console.error('Token alınamadı:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Main" 
          component={MainScreen} 
          options={{ 
            title: 'Ana Sayfa',
            headerStyle: {
              backgroundColor: '#2ecc71',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerLeft: null, // Geri butonunu kaldır
          }}
        />
        <Stack.Screen 
          name="Products" 
          component={ProductsScreen} 
          options={{ 
            title: 'Ürünler',
            headerStyle: {
              backgroundColor: '#2ecc71',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="ProductDetail" 
          component={ProductDetailScreen} 
          options={{ 
            title: 'Ürün Detayı',
            headerStyle: {
              backgroundColor: '#2ecc71',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App; 