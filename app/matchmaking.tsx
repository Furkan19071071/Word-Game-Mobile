import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert,ImageBackground } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { auth, db } from '../src/firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import kelimelerJson from '../assets/kelimeler.json';

interface Tile {
  letter: string;
  count: number;
  point: number;
  id?: string;
}

const tileBag: Tile[] = [
  { letter: 'A', count: 12, point: 1 },
  { letter: 'B', count: 2, point: 3 },
  { letter: 'C', count: 2, point: 4 },
  { letter: 'Ç', count: 2, point: 4 },
  { letter: 'D', count: 3, point: 3 },
  { letter: 'E', count: 8, point: 1 },
  { letter: 'F', count: 2, point: 7 },
  { letter: 'G', count: 2, point: 5 },
  { letter: 'Ğ', count: 1, point: 8 },
  { letter: 'H', count: 1, point: 5 },
  { letter: 'I', count: 2, point: 2 },
  { letter: 'İ', count: 4, point: 1 },
  { letter: 'J', count: 1, point: 10 },
  { letter: 'K', count: 6, point: 1 },
  { letter: 'L', count: 1, point: 1 },
  { letter: 'M', count: 4, point: 2 },
  { letter: 'N', count: 5, point: 1 },
  { letter: 'O', count: 3, point: 2 },
  { letter: 'Ö', count: 1, point: 7 },
  { letter: 'P', count: 2, point: 5 },
  { letter: 'R', count: 6, point: 1 },
  { letter: 'S', count: 4, point: 2 },
  { letter: 'Ş', count: 1, point: 4 },
  { letter: 'T', count: 5, point: 1 },
  { letter: 'U', count: 2, point: 2 },
  { letter: 'Ü', count: 2, point: 3 },
  { letter: 'V', count: 1, point: 7 },
  { letter: 'Y', count: 2, point: 3 },
  { letter: 'Z', count: 2, point: 4 },
  { letter: '*', count: 2, point: 0 },
];

type CellType = '' | 'H²' | 'H³' | 'K²' | 'K³' | '★';

const boardMatrix: CellType[][] = [
  ['', '', 'K³', '', '', 'H²', '', '', '', 'H²', '', '', 'K³', '', ''],
  ['', 'H³', '', '', '', '', 'H²', '', 'H²', '', '', '', '', 'H³', ''],
  ['K³', '', '', '', '', '', '', 'K²', '', '', '', '', '', '', 'K³'],
  ['', '', '', 'K²', '', '', '', '', '', '', '', 'K²', '', '', ''],
  ['', '', '', '', 'H³', '', '', '', '', '', 'H³', '', '', '', ''],
  ['H²', '', '', '', '', 'H²', '', '', '', 'H²', '', '', '', '', 'H²'],
  ['', 'H²', '', '', '', '', 'H²', '', 'H²', '', '', '', '', 'H²', ''],
  ['', '', 'K²', '', '', '', '', '★', '', '', '', '', 'K²', '', ''],
  ['', 'H²', '', '', '', '', 'H²', '', 'H²', '', '', '', '', 'H²', ''],
  ['H²', '', '', '', '', 'H²', '', '', '', 'H²', '', '', '', '', 'H²'],
  ['', '', '', '', 'H³', '', '', '', '', '', 'H³', '', '', '', ''],
  ['', '', '', 'K²', '', '', '', '', '', '', '', 'K²', '', '', ''],
  ['K³', '', '', '', '', '', '', 'K²', '', '', '', '', '', '', 'K³'],
  ['', 'H³', '', '', '', '', 'H²', '', 'H²', '', '', '', '', 'H³', ''],
  ['', '', 'K³', '', '', 'H²', '', '', '', 'H²', '', '', 'K³', '', ''],
];

interface WaitingUser {
  id: string;
  uid: string;
  username: string;
}

const createBoardFromMatrix = () => {
  return boardMatrix.map(row => row.map(cell => String(cell)));
};

const prepareInitialTileBag = () => {
  let completeBag: Tile[] = [];
  tileBag.forEach(tile => {
    for (let i = 0; i < tile.count; i++) {
      completeBag.push({
        letter: tile.letter,
        point: tile.point,
        count: 1
      });
    }
  });
  return completeBag;
};

const drawInitialHands = () => {
  const sevenLetterWords = kelimelerJson.filter(word => word.length === 7);
  
  if (sevenLetterWords.length < 2) {
    console.error("Not enough 7-letter words in the dictionary!");
    return drawRandomInitialHands();
  }
  
  const randomWords = sevenLetterWords
    .sort(() => 0.5 - Math.random())
    .slice(0, 2);
  
  console.log(`[İNİTİAL ELLER] Seçilen kelimeler: "${randomWords[0]}" ve "${randomWords[1]}"`);
  
  const player1Letters = randomWords[0].toUpperCase().split('').sort(() => 0.5 - Math.random());
  const player2Letters = randomWords[1].toUpperCase().split('').sort(() => 0.5 - Math.random());
  
  let gameTileBag = prepareInitialTileBag();
  
  const player1Hand: (Tile & { id: string })[] = [];
  const player2Hand: (Tile & { id: string })[] = [];
  
  player1Letters.forEach(letter => {
    const tileIndex = gameTileBag.findIndex(tile => tile.letter === letter);
    
    if (tileIndex !== -1) {
      const tile = gameTileBag.splice(tileIndex, 1)[0];
      
      player1Hand.push({
        ...tile,
        id: `${letter}-${Math.random().toString(36).substr(2, 9)}`
      });
    } else {
      console.warn(`Letter ${letter} not found in tile bag for player 1`);

    }
  });
  
  player2Letters.forEach(letter => {
    const tileIndex = gameTileBag.findIndex(tile => tile.letter === letter);
    
    if (tileIndex !== -1) {
      const tile = gameTileBag.splice(tileIndex, 1)[0];
      player2Hand.push({
        ...tile,
        id: `${letter}-${Math.random().toString(36).substr(2, 9)}`
      });
    } else {
      console.warn(`Letter ${letter} not found in tile bag for player 2`);
    }
  });
  
  while (player1Hand.length < 7 && gameTileBag.length > 0) {
    const randomIndex = Math.floor(Math.random() * gameTileBag.length);
    const tile = gameTileBag.splice(randomIndex, 1)[0];
    player1Hand.push({
      ...tile,
      id: `${tile.letter}-${Math.random().toString(36).substr(2, 9)}`
    });
  }
  
  while (player2Hand.length < 7 && gameTileBag.length > 0) {
    const randomIndex = Math.floor(Math.random() * gameTileBag.length);
    const tile = gameTileBag.splice(randomIndex, 1)[0];
    player2Hand.push({
      ...tile,
      id: `${tile.letter}-${Math.random().toString(36).substr(2, 9)}`
    });
  }
  
  console.log(`[İNİTİAL ELLER] Oyuncu 1 eli: ${player1Hand.map(t => t.letter).join('')} (Kelime: ${randomWords[0]})`);
  console.log(`[İNİTİAL ELLER] Oyuncu 2 eli: ${player2Hand.map(t => t.letter).join('')} (Kelime: ${randomWords[1]})`);
  
  return {
    player1Hand,
    player2Hand,
    remainingTileBag: gameTileBag
  };
};

const drawRandomInitialHands = () => {
  let gameTileBag = prepareInitialTileBag();
  
  const drawTiles = (count: number) => {
    const hand: (Tile & { id: string })[] = [];
    for (let i = 0; i < count; i++) {
      if (gameTileBag.length === 0) break;
      
      const randomIndex = Math.floor(Math.random() * gameTileBag.length);
      const tile = gameTileBag.splice(randomIndex, 1)[0];
      
      hand.push({
        ...tile,
        id: `${tile.letter}-${Math.random().toString(36).substr(2, 9)}`
      });
    }
    return hand;
  };
  
  const player1Hand = drawTiles(7);
  const player2Hand = drawTiles(7);
  
  return {
    player1Hand,
    player2Hand,
    remainingTileBag: gameTileBag
  };
};

export default function MatchmakingScreen() {
  const { time } = useLocalSearchParams<{ time: string }>(); 
  const [status, setStatus] = useState('Eşleşme aranıyor...');

  useEffect(() => {
    const findMatch = async () => {
      try {
        const uid = auth.currentUser?.uid;
        const username = auth.currentUser?.email?.split('@')[0]; 

        if (!uid || !username) {
          Alert.alert('Hata', 'Kullanıcı bilgileriniz alınamadı.');
          return;
        }

        const q = query(collection(db, 'waiting_games'), where('selectedTime', '==', time));
        const querySnapshot = await getDocs(q);

        let matchedUser: WaitingUser | null = null;
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.uid !== uid && !matchedUser) {
            matchedUser = {
              id: docSnap.id,
              uid: data.uid,
              username: data.username,
            };
          }
        });

        if (matchedUser) {

          const initialBoard = createBoardFromMatrix();
          const { player1Hand, player2Hand, remainingTileBag } = drawInitialHands();

          console.log(`[EŞİTLEME] ${username} için eller ayarlandı. Oyuncu 1: ${player1Hand.map(t => t.letter).join('')}`);
          console.log(`[EŞİTLEME] ${matchedUser.username} için eller ayarlandı. Oyuncu 2: ${player2Hand.map(t => t.letter).join('')}`);

          const newGame = {
            player1: { uid: uid, username },
            player2: { uid: matchedUser.uid, username: matchedUser.username },
            selectedTime: time,
            createdAt: Timestamp.now(),
            turn: uid,
            status: 'active',
            player1Score: 0,
            player2Score: 0,
            boardData: initialBoard.flat(),
            tileBag: remainingTileBag,
            hands: {
              [uid]: player1Hand,
              [matchedUser.uid]: player2Hand
            },
            placedTiles: []
          };

          const newGameRef = await addDoc(collection(db, 'active_games'), newGame);
          await deleteDoc(doc(db, 'waiting_games', matchedUser.id));
          setStatus('Eşleşme bulundu! Oyun başlıyor...');

          setTimeout(() => {
            router.push({
              pathname: '/game',
              params: {
              gameId: newGameRef.id,
              player1: username,
              player2: matchedUser.username,
              player1Uid: uid,
              player2Uid: matchedUser.uid,
              turn: uid,
              player1Score: '0',
              player2Score: '0',
              selectedTime: time!,
              },
            });
          }, 1500);
        } else {
          const alreadyWaiting = querySnapshot.docs.some((docSnap) => docSnap.data().uid === uid);
          if (!alreadyWaiting) {
            await addDoc(collection(db, 'waiting_games'), {
              uid,
              username,
              selectedTime: time,
              timestamp: Timestamp.now(),
            });
          }

          setStatus('Eşleşme bekleniyor... Lütfen diğer oyuncuyu bekleyin.');
        }
      } catch (err) {
        console.error('Eşleşme hatası:', err);
        Alert.alert('Hata', 'Eşleşme sırasında bir hata oluştu.');
      }
    };

    findMatch();
  }, [time]);

  return (
    <ImageBackground
      source={require('../assets/images/foto.jpeg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0d6966" />
        <Text style={styles.text}>{status}</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center'},
  text: { marginTop: 20, fontSize: 18, color: '#333' },
});
