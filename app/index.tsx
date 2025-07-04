import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Pressable } from 'react-native';
import { auth, db } from '../src/firebase/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigation } from 'expo-router';
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';
import { ImageBackground } from 'react-native';

export default function HomeScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    successRate: 0
  });
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
        
        const completedGamesQuery = query(
          collection(db, 'completed_games'),
          where('status', '==', 'completed')
        );
        
        const querySnapshot = await getDocs(completedGamesQuery);
        
        let totalGames = 0;
        let wonGames = 0;
        
        querySnapshot.forEach((doc) => {
          const gameData = doc.data();
          
          if (gameData.player1?.uid === uid || gameData.player2?.uid === uid) {
            totalGames++;
            
            if (gameData.winner === uid) {
              wonGames++;
            }
          }
        });
        
        const successRate = totalGames > 0 ? Math.round((wonGames / totalGames) * 100) : 0;
        
        setGameStats({
          gamesPlayed: totalGames,
          gamesWon: wonGames,
          successRate
        });
        
        console.log(`Found ${totalGames} completed games, ${wonGames} won by user. Success rate: ${successRate}%`);
        
      } catch (error) {
        console.error('Kullanıcı verisi alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth); 
      Alert.alert('Çıkış Yapıldı', 'Başarıyla çıkış yaptınız.');
      router.replace('/login'); 
    } catch (error) {
      console.error('Çıkış yapılamadı:', error);
      Alert.alert('Hata', 'Çıkış sırasında bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const { username } = userData || {};

  return (
    <ImageBackground
      source={require('../assets/images/foto.jpeg')} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.header}>Hoş Geldin, {username} 👋</Text>


          <Text style={styles.statText}>Başarı Yüzdesi: %{gameStats.successRate}</Text>
      

        {[
          { title: 'Yeni Oyun', onPress: () => navigation.navigate('newgame' as never) },
          { title: 'Aktif Oyunlar', onPress: () => navigation.navigate('activegames' as never) },
          { title: 'Biten Oyunlar', onPress: () => navigation.navigate('completedgames' as never) },
          { title: 'Çıkış Yap', onPress: handleLogout, style: styles.logoutButton },
        ].map((button, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.button,
              button.style,
              pressed && styles.buttonHover, 
            ]}
            onPress={button.onPress}
          >
            <Text style={styles.buttonText}>{button.title}</Text>
          </Pressable>
        ))}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 150 }, 
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  subtext: { fontSize: 16, color: '#555', marginBottom: 30 },
  button: {
    backgroundColor: '#78cf8b',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    width: '70%',
    borderWidth: 2, 
    borderColor: '#2d2f52', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    opacity: 0.8, 
    transform: [{ scale: 1 }], 
  },
  buttonHover: {
    backgroundColor: '#0d6966', 
    transform: [{ scale: 1.05 }], 
  },
  logoutButton: {
    backgroundColor: '#131232', 
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0d6966',
  },
  statText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 2,
    fontWeight: '500',
  },
});