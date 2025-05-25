import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';

function renderMessageText(text, handleLinkPress) {
  // Linkleri bulmak için regex
  const linkRegex = /<a[^>]*href=['\"]([^'\"]+)['\"][^>]*>(.*?)<\/a>/gi;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    // Linkten önceki düz metin
    if (match.index > lastIndex) {
      parts.push(
        <Text key={key++}>{text.substring(lastIndex, match.index)}</Text>
      );
    }
    // Tıklanabilir link (güvenli kontrol)
    if (match[1] && match[2]) {
      const url = match[1];
      parts.push(
        <Text
          key={key++}
          style={{ color: '#3498db', textDecorationLine: 'underline' }}
          onPress={() => handleLinkPress(url)}
        >
          {match[2]}
        </Text>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  // Sonraki düz metin
  if (lastIndex < text.length) {
    parts.push(<Text key={key++}>{text.substring(lastIndex)}</Text>);
  }
  return parts;
}

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    // Başlangıç mesajını ekle
    setMessages([
      {
        id: '1',
        text: 'Merhaba! Size nasıl yardımcı olabilirim?',
        isUser: false,
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Hata', 'Sohbet edebilmek için giriş yapmalısınız.');
        return;
      }

      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: inputMessage })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bir hata oluştu');
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Mesaj gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Link tıklanınca çalışacak fonksiyon
  const handleLinkPress = (url) => {
    // Uygulama içi yönlendirme kuralları
    // Örnek: http://localhost:5500/categories/1
    if (url.includes('/categories/')) {
      const match = url.match(/categories\/(\d+)/);
      if (match && match[1]) {
        navigation.navigate('Products', { categoryId: Number(match[1]) });
        return;
      }
    }
    if (url.includes('/products/')) {
      const match = url.match(/products\/(\d+)/);
      if (match && match[1]) {
        navigation.navigate('ProductDetail', { productId: Number(match[1]) });
        return;
      }
    }
    if (url.includes('/products.html')) {
      navigation.navigate('Products');
      return;
    }
    // Diğer tüm linkler için dışarı aç
    Linking.openURL(url);
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.botMessage
    ]}>
      <Text style={styles.messageText}>
        {item.isUser ? item.text : renderMessageText(item.text, handleLinkPress)}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        style={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Mesajınızı yazın..."
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <MaterialIcons name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messagesList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2ecc71',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    backgroundColor: '#2ecc71',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen; 