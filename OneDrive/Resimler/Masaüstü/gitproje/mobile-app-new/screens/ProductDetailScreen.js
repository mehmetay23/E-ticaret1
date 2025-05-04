import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';

const ProductDetailScreen = ({ route }) => {
  const { product } = route.params;

  return (
    <ScrollView style={styles.container}>
      <Image 
        source={{ uri: product.image_url || 'https://via.placeholder.com/300' }} 
        style={styles.productImage}
        defaultSource={{ uri: 'https://via.placeholder.com/300' }}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productPrice}>{parseFloat(product.price).toFixed(2)} TL</Text>
        <Text style={styles.productDescription}>{product.description}</Text>
        <View style={styles.stockInfo}>
          <Text style={styles.stockText}>
            Stok Durumu: {product.stock > 0 ? 'Stokta Var' : 'Stokta Yok'}
          </Text>
          <Text style={styles.stockCount}>{product.stock} adet</Text>
        </View>
      </View>
    </ScrollView>
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
  productDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  stockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
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
});

export default ProductDetailScreen; 