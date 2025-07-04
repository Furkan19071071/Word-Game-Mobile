import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity,ImageBackground } from 'react-native';
import { auth, db } from '../src/firebase/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigation } from 'expo-router';
import { router } from 'expo-router';


export default function ActiveGamesScreen() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchActiveGames = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        const q = query(
          collection(db, 'active_games'),
          where('status', '==', 'active')
        );
        const querySnapshot = await getDocs(q);

        const userGames = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((game: any) => game.player1.uid === uid || game.player2.uid === uid);

        setGames(userGames);
      } catch (error) {
        console.error('Aktif oyunlar alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveGames();
    
    const refreshInterval = setInterval(fetchActiveGames, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  const formatTimeRemaining = (game: any) => {
    if (!game.lastMoveTime) return "Süre bilgisi yok";
    
    const getTimeLimitInMs = (gameType: string) => {
      switch(gameType) {
        case '2m': return 2 * 60 * 1000; 
        case '5m': return 5 * 60 * 1000; 
        case '12h': return 12 * 60 * 60 * 1000; 
        case '24h': return 24 * 60 * 60 * 1000; 
        default: return 5 * 60 * 1000;
      }
    };
    
    const moveTime = game.lastMoveTime.toMillis();
    const currentTime = Date.now();
    const timeLimit = getTimeLimitInMs(game.selectedTime);
    const elapsed = currentTime - moveTime;
    const remaining = Math.max(0, timeLimit - elapsed);
    
    if (game.selectedTime === '12h' || game.selectedTime === '24h') {
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}s ${minutes}d kaldı`;
    } else {
      const minutes = Math.floor(remaining / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')} kaldı`;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (games.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Hiç aktif oyun bulunamadı.</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/foto.jpeg')}
      style={styles.background}
      resizeMode="cover"
    >
    <View style={styles.container}>
      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const currentUser = auth.currentUser?.uid;
          const isPlayer1 = item.player1.uid === currentUser;
          const rakip = isPlayer1 ? item.player2.username : item.player1.username;
          const kendiSkor = isPlayer1 ? item.player1Score : item.player2Score;
          const rakipSkor = isPlayer1 ? item.player2Score : item.player1Score;
          const siraKimde = item.turn === currentUser ? 'Sıra Sende' : 'Sıra Rakipte';
          const timeRemaining = formatTimeRemaining(item);

          return (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/game',
                  params: {
                    gameId: item.id,
                    player1: item.player1.username,
                    player2: item.player2.username,
                    player1Uid: item.player1.uid,
                    player2Uid: item.player2.uid,
                    turn: item.turn,
                    player1Score: item.player1Score.toString(),
                    player2Score: item.player2Score.toString(),
                    selectedTime: item.selectedTime,
                  },
                })
              }
            >
              <View style={styles.card}>
                <Text style={styles.title}>Rakip: {rakip}</Text>
                <Text>Sen: {kendiSkor} - Rakip: {rakipSkor}</Text>
                <Text style={styles.turn}>{siraKimde}</Text>
                <Text style={[styles.timeText, item.turn === currentUser ? styles.yourTurnTime : {}]}>
                  {timeRemaining}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
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
  container: { flex: 1, padding: 20 },
  card: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
    opacity: 0.8,
    borderColor: '#0d6966',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  turn: { marginTop: 8, color: '#0d6966', fontWeight: 'bold' },
  timeText: { 
    marginTop: 5, 
    fontSize: 12, 
    color: '#666',
    textAlign: 'right',
  },
  yourTurnTime: {
    color: '#e11d48', 
    fontWeight: 'bold',
  },
  emptyText: { fontSize: 16, color: '#999' },
});
