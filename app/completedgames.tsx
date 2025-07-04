import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ImageBackground } from 'react-native';
import { auth, db } from '../src/firebase/firebaseConfig';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useNavigation } from 'expo-router';

interface CompletedGame {
  id: string;
  player1: { uid: string; username: string };
  player2: { uid: string; username: string };
  player1Score: number;
  player2Score: number;
  winner: string;
  endReason: 'timeout' | 'surrender' | 'consecutive_passes' | 'completed';
  completedAt: number;
}

export default function CompletedGamesScreen() {
  const [games, setGames] = useState<CompletedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchCompletedGames = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) return;

       
        const q = query(
          collection(db, 'completed_games'),
          where('status', '==', 'completed')
        );
        const querySnapshot = await getDocs(q);

        const userGames = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as CompletedGame))
          .filter((game: CompletedGame) => 
            game.player1.uid === uid || game.player2.uid === uid
          )
          .sort((a, b) => b.completedAt - a.completedAt);

        setGames(userGames);
        console.log(`Found ${userGames.length} completed games`);
      } catch (error) {
        console.error('Tamamlanan oyunlar alınamadı:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedGames();
  }, []);

  const getEndReasonText = (reason: string, winner: string, currentUser: string) => {
    const isWinner = winner === currentUser;
    
    switch(reason) {
      case 'timeout':
        return isWinner ? 'Kazandın! (Rakip süreyi aştı)' : 'Kaybettin! (Süreyi aştın)';
      case 'surrender':
        return isWinner ? 'Kazandın! (Rakip teslim oldu)' : 'Kaybettin! (Teslim oldun)';
      case 'consecutive_passes':
        return isWinner ? 'Kazandın! (Rakip üst üste pas geçti)' : 'Kaybettin! (Üst üste pas geçtin)';
      default:
        return isWinner ? 'Kazandın!' : 'Kaybettin!';
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
        <Text style={styles.emptyText}>Henüz tamamlanan oyun bulunmuyor.</Text>
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
        <Text style={styles.headerText}>Tamamlanan Oyunlar</Text>
        <FlatList
          data={games}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const currentUser = auth.currentUser?.uid;
            const isPlayer1 = item.player1.uid === currentUser;
            const rakip = isPlayer1 ? item.player2.username : item.player1.username;
            const kendiSkor = isPlayer1 ? item.player1Score : item.player2Score;
            const rakipSkor = isPlayer1 ? item.player2Score : item.player1Score;
            const result = getEndReasonText(item.endReason, item.winner, currentUser || '');
            
            const completedDate = new Date(item.completedAt);
            const dateString = `${completedDate.toLocaleDateString()} ${completedDate.toLocaleTimeString()}`;

            return (
              <View style={styles.card}>
                <View style={styles.resultBanner}>
                  <Text style={[
                    styles.resultText,
                    { color: item.winner === currentUser ? '#155724' : '#721c24' }
                  ]}>
                    {result}
                  </Text>
                </View>
                <Text style={styles.title}>Rakip: {rakip}</Text>
                <Text style={styles.scoreText}>
                  Sen: <Text style={styles.scoreValue}>{kendiSkor}</Text> - 
                  Rakip: <Text style={styles.scoreValue}>{rakipSkor}</Text>
                </Text>
                <Text style={styles.dateText}>{dateString}</Text>
              </View>
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
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  container: { 
    flex: 1, 
    padding: 20 
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
    borderColor: '#0d6966',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultBanner: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 5,
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  scoreText: { 
    marginTop: 8, 
    fontSize: 16 
  },
  scoreValue: {
    fontWeight: 'bold',
    color: '#0d6966',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  emptyText: { 
    fontSize: 16, 
    color: '#999' 
  },
});
