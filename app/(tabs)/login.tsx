import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../src/firebase/firebaseConfig';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Uyarı', 'Lütfen kullanıcı adı ve şifreyi girin.');
      return;
    }

    try {
      const q = query(collection(db, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Hata', 'Kullanıcı adı bulunamadı.');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const email = userDoc.data().email;

      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Giriş Başarılı', `Hoş geldin ${username} 🎉`);
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Giriş Hatası', error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/foto.jpeg')} // 📸 Arka plan resmi
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Giriş Yap</Text>

        <TextInput
          style={styles.input}
          placeholder="Kullanıcı Adı"
          placeholderTextColor="#999"
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor="#999"
          secureTextEntry
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 30,
    padding: 30,
    borderRadius: 15,
    opacity: 0.85,
    shadowColor: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
    opacity: 1,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    opacity: 1,
  },
  button: {
    backgroundColor: '#131232',
    paddingVertical: 15,
    borderRadius: 10,
    opacity: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
