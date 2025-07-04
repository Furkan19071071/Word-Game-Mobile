import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
} from 'react-native';
import {
  createUserWithEmailAndPassword
} from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  addDoc
} from 'firebase/firestore';
import { auth, db } from '../../src/firebase/firebaseConfig';

// Firestore bağlantısını test eden fonksiyon
const testFirestoreConnection = async () => {
  try {
    const testRef = await addDoc(collection(db, 'test-firestore-connection'), {
      ping: true,
      timestamp: new Date(),
    });
    console.log("✅ Firestore bağlantı başarılı. Doküman ID:", testRef.id);
  } catch (err) {
    console.error("❌ Firestore bağlantı hatası:", err);
  }
};

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

  const checkUsernameExists = async (username: string) => {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleRegister = async () => {
    console.log("🔥 Kayıt işlemine başlandı");
    console.log("📧 Email:", email);
    console.log("👤 Username:", username);

    if (!username || !email || !password) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(
        'Zayıf Şifre',
        'Şifre en az 8 karakter olmalı, büyük harf, küçük harf ve rakam içermelidir.'
      );
      return;
    }

    try {
      const usernameExists = await checkUsernameExists(username);
      if (usernameExists) {
        Alert.alert('Hata', 'Bu kullanıcı adı zaten alınmış.');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        username,
        email,
      });

      Alert.alert('Kayıt Başarılı', 'Hesabınız oluşturuldu.');
    } catch (error: any) {
      console.error("❌ Firebase hatası:", error);
      Alert.alert('Hata', error.message);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/foto.jpeg')} // arka plan görselini buraya ekle
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Kayıt Ol</Text>

        <TextInput
          style={styles.input}
          placeholder="Kullanıcı Adı"
          placeholderTextColor="#999"
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor="#999"
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor="#999"
          secureTextEntry
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Kayıt Ol</Text>
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
    backgroundColor: 'rgba(255,255,255,0.88)',
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
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#131232',
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
