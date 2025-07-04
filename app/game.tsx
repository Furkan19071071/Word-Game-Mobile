import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, PanResponder, Animated, Dimensions, SafeAreaView, Alert, Button } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isMoveValid, loadWordList } from '../utils/gameValidation';
import kelimelerJson from '../assets/kelimeler.json';
import { getAuth } from 'firebase/auth';
import { db } from '../src/firebase/firebaseConfig';
import {
  doc, getDoc, setDoc, updateDoc, onSnapshot, addDoc, collection, Timestamp
} from 'firebase/firestore';

type CellType = '' | 'H²' | 'H³' | 'K²' | 'K³' | '★';

// Board matrix
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

type Tile = {
  letter: string;
  count: number;
  point: number;
  id?: string;
};

type PlacedTile = {
  letter: string;
  point: number;
  id: string;
  row: number;
  col: number;
};

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


type GameState = {
  boardData: (string)[][];
  availableTiles: Tile[];
  hands: {
    [uid: string]: (Tile & { id: string })[];
  };
  player1Score: number;
  player2Score: number;
  turn: string;
  placedTiles: PlacedTile[];
};

export default function GameScreen() {
  const {
    player1,
    player2,
    player1Uid: rawPlayer1Uid,
    player2Uid: rawPlayer2Uid,
    turn: rawInitialTurn,
    player1Score: initialPlayer1Score = "0",
    player2Score: initialPlayer2Score = "0",
    selectedTime,
    gameId,
  } = useLocalSearchParams();

  const currentUserUid = getAuth().currentUser?.uid;

  const player1Uid = Array.isArray(rawPlayer1Uid) ? rawPlayer1Uid[0] : rawPlayer1Uid;
  const player2Uid = Array.isArray(rawPlayer2Uid) ? rawPlayer2Uid[0] : rawPlayer2Uid;
  const initialTurn = Array.isArray(rawInitialTurn) ? rawInitialTurn[0] : rawInitialTurn;

  const [availableTiles, setAvailableTiles] = useState<Tile[]>([]);
  const [lettersInHand, setLettersInHand] = useState<(Tile & { id: string })[]>([]);
  const [boardData, setBoardData] = useState<string[][]>(() => {
    return boardMatrix.map(row => row.map(cell => String(cell)));
  });
  const [draggedTile, setDraggedTile] = useState<{
    index: number,
    tileId: string,
    pan: Animated.ValueXY
  } | null>(null);
  const [boardDataBeforeMove, setBoardDataBeforeMove] = useState<string[][]>(() => {
    return boardMatrix.map(row => row.map(cell => String(cell)));
  });
  
  const [placedTiles, setPlacedTiles] = useState<PlacedTile[]>([]);

  const [turn, setTurn] = useState<string>(initialTurn || player1Uid || "");
  const [player1Score, setPlayer1Score] = useState<number>(Number(initialPlayer1Score));
  const [player2Score, setPlayer2Score] = useState<number>(Number(initialPlayer2Score));
  
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());
  const [consecutivePasses, setConsecutivePasses] = useState<{[key: string]: number}>({});
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const boardRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  const cellSize = screenWidth / 17; 
  
  const GAME_STATE_KEY = `scrabble_game_state_${gameId || 'default'}`;
  
  useEffect(() => {
    console.log("Game screen mounted, checking for saved state...");
    loadWordList(); 
    
    setupFirebaseListener();
    
    checkAndInitializeGame();
  }, []);

  useEffect(() => {
    if (isGameOver) return;

    const getTimeLimitInMs = () => {
      switch(selectedTime) {
        case '2m': return 2 * 60 * 1000; 
        case '5m': return 5 * 60 * 1000; 
        case '12h': return 12 * 60 * 60 * 1000; 
        case '24h': return 24 * 60 * 60 * 1000; 
        default: return 5 * 60 * 1000; 
      }
    };

    const updateTimeLeft = async () => {
      try {
        if (!gameId) return;
        
        const gameRef = doc(db, 'active_games', gameId as string);
        const gameSnap = await getDoc(gameRef);
        
        if (gameSnap.exists()) {
          const data = gameSnap.data();
          const currentTime = Date.now();
          let moveTime = data.lastMoveTime?.toMillis() || currentTime;
          
          if (!data.lastMoveTime) {
            await updateDoc(gameRef, {
              lastMoveTime: Timestamp.fromMillis(currentTime)
            });
            moveTime = currentTime;
          }
          
          setLastMoveTime(moveTime);
          
          const timeLimit = getTimeLimitInMs();
          const elapsed = currentTime - moveTime;
          const remaining = Math.max(0, timeLimit - elapsed);
          
          setTimeLeft(remaining);
        }
      } catch (error) {
        console.error("Error updating time left:", error);
      }
    };
    
    updateTimeLeft();
    
    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = Math.max(0, prev - 1000);
        
        if (newTime === 0 && !isGameOver) {
          clearInterval(timerInterval);
          handleTimeOut();
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [turn, isGameOver, selectedTime]);

  const setupFirebaseListener = () => {
    if (!gameId) {
      console.error("No game ID provided!");
      return;
    }

    const gameRef = doc(db, 'active_games', gameId as string);
    const unsubscribe = onSnapshot(gameRef, (snap) => {
      if (!snap.exists()) {
        console.log("Game document doesn't exist, might need to initialize it");
        return;
      }
      
      const data = snap.data();
      console.log("Firebase data update received");

      if (data.boardData) {
        try {
          const boardArray = data.boardData;
          if (Array.isArray(boardArray)) {
            const newBoard = unflattenBoardData(boardArray);
            setBoardData(newBoard);
          }
        } catch (error) {
          console.error("Error processing board data:", error);
        }
      }
      
      if (data.hands && currentUserUid) {
        const currentHand = data.hands[currentUserUid];
        if (Array.isArray(currentHand)) {
          setLettersInHand(currentHand);
        }
      }
      
      if (data.tileBag && Array.isArray(data.tileBag)) {
        console.log(`Updating tile bag from Firebase: ${data.tileBag.length} tiles remaining`);
        setAvailableTiles(data.tileBag);
      }
      
      if (data.player1Score !== undefined) setPlayer1Score(data.player1Score);
      if (data.player2Score !== undefined) setPlayer2Score(data.player2Score);
      
      if (data.turn !== turn) {
        setTurn(data.turn);
        if (data.consecutivePasses) {
          setConsecutivePasses(data.consecutivePasses);
        }
      }
      
      if (data.lastMoveTime) {
        setLastMoveTime(data.lastMoveTime.toMillis());
      }
      
      if (data.placedTiles) setPlacedTiles(data.placedTiles);
      
      if (data.status === 'completed') {
        setIsGameOver(true);
      }
    }, (error) => {
      console.error("Firebase listener error:", error);
      Alert.alert("Bağlantı Hatası", "Oyun verileri güncellenemedi. Lütfen internet bağlantınızı kontrol edin.");
    });

    return () => unsubscribe();
  };

    const createPanResponder = (index: number, tileId: string) => {
      const pan = new Animated.ValueXY();
    
      return PanResponder.create({
        onStartShouldSetPanResponder: () => {
          const isActivePlayer = isCurrentPlayerTurn();
          if (!isActivePlayer) {
            console.log("Not your turn, cannot drag tiles.");
            Alert.alert("Uyarı", "Şu anda sizin sıranız değil!");
          }
          return isActivePlayer;
        },
        onPanResponderGrant: () => {
          if (!isCurrentPlayerTurn()) {
            console.log("Not your turn, ignoring drag attempt.");
            return;
          }
    
          if (placedTiles.length === 0) {
            console.log("Saving board state before move.");
            setBoardDataBeforeMove(JSON.parse(JSON.stringify(boardData)));
          }
    
          console.log(`Started dragging tile ${tileId}`);
          setDraggedTile({ index, tileId, pan });
        },
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: (_, gesture) => {
          if (!isCurrentPlayerTurn()) {
            console.log("Not your turn, returning tile.");
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 5,
              useNativeDriver: false
            }).start();
            setDraggedTile(null);
            return;
          }
    
          if (!boardRef.current) {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 5,
              useNativeDriver: false
            }).start();
            setDraggedTile(null);
            return;
          }
          
          // @ts-ignore - boardRef.current.measure exists
          boardRef.current.measure((x, y, width, height, pageX, pageY) => {
            console.log(`Board position: x=${pageX}, y=${pageY}, width=${width}, height=${height}`);
            console.log(`Release position: x=${gesture.moveX}, y=${gesture.moveY}`);
            
            if (
              gesture.moveX >= pageX && 
              gesture.moveX <= pageX + width &&
              gesture.moveY >= pageY && 
              gesture.moveY <= pageY + height
            ) {
              const relativeX = gesture.moveX - pageX - 10;
              const relativeY = gesture.moveY - pageY;
              
              const col = Math.floor(relativeX / cellSize);
              const row = Math.floor(relativeY / cellSize);
              
              console.log(`Trying to place at cell: row=${row}, col=${col}`);
              
              if (
                row >= 0 && row < 15 && 
                col >= 0 && col < 15 && 
                (boardData[row][col] === '' || 
                 boardData[row][col] === 'H²' || 
                 boardData[row][col] === 'H³' || 
                 boardData[row][col] === 'K²' || 
                 boardData[row][col] === 'K³' || 
                 boardData[row][col] === '★')
              ) {
                const newBoard = [...boardData];
                const currentTile = lettersInHand.find(t => t.id === tileId);
                
                if (currentTile) {
                  console.log(`Placing letter ${currentTile.letter} at [${row},${col}]`);
                  newBoard[row][col] = currentTile.letter;
                  setBoardData(newBoard);
                  
                  const newHand = lettersInHand.filter(tile => tile.id !== tileId);
                  setLettersInHand(newHand);
                  
                  const newPlacedTile = {
                    letter: currentTile.letter,
                    point: currentTile.point,
                    id: currentTile.id,
                    row,
                    col
                  };
                  
                  const newPlacedTiles = [...placedTiles, newPlacedTile];
                  setPlacedTiles(newPlacedTiles);
                  
                  updateDoc(doc(db, 'active_games', gameId as string), {
                    boardData: flattenBoardData(newBoard),
                    [`hands.${currentUserUid}`]: newHand,
                    placedTiles: newPlacedTiles
                  }).catch(error => {
                    console.error("Error updating Firebase after tile placement:", error);
                  });
                }
                
                setDraggedTile(null);
                return;
              } else {
                console.log("Cannot place tile at this location.");
              }
            }
            
            console.log("Returning tile to hand.");
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 5,
              useNativeDriver: false
            }).start();
            setDraggedTile(null);
          });
        }
      });
    };

  const checkAndInitializeGame = async () => {
    try {
      if (!gameId) {
        console.error("No game ID provided!");
        return;
      }

      const gameRef = doc(db, 'active_games', gameId as string);
      const gameSnap = await getDoc(gameRef);
      
      if (!gameSnap.exists()) {
        console.log("Game doesn't exist, initializing new game");
        initializeNewGame();
      } else {
        console.log("Game exists, data will be loaded via listener");
      }
    } catch (error) {
      console.error("Error checking game existence:", error);
      Alert.alert("Hata", "Oyun durumu kontrol edilemedi.");
    }
  };

  const initializeNewGame = async () => {
    try {
      const expandedTiles: Tile[] = [];
      tileBag.forEach(tile => {
        for (let i = 0; i < tile.count; i++) {
          expandedTiles.push({ ...tile, count: 1 }); 
        }
      });
      const shuffledTiles = [...expandedTiles].sort(() => 0.5 - Math.random());
      
      console.log(`[YENİ OYUN] ${shuffledTiles.length} harften oluşan torba oluşturuldu`);
      
      const sevenLetterWords = kelimelerJson.filter(word => word.length === 7);
      if (sevenLetterWords.length < 2) {
        console.error("Not enough 7-letter words!");
        return;
      }

      const randomWords = sevenLetterWords
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      console.log(`[YENİ OYUN] Seçilen kelimeler: "${randomWords[0]}" ve "${randomWords[1]}"`);

      const player1Letters = randomWords[0].toUpperCase().split('').sort(() => 0.5 - Math.random());
      const player2Letters = randomWords[1].toUpperCase().split('').sort(() => 0.5 - Math.random());

      const player1Hand = player1Letters.map(letter => ({
        letter,
        count: 1,
        point: tileBag.find(tile => tile.letter === letter)?.point || 0,
        id: `${letter}-${Math.random().toString(36).substr(2, 9)}`
      }));
      
      const player2Hand = player2Letters.map(letter => ({
        letter,
        count: 1,
        point: tileBag.find(tile => tile.letter === letter)?.point || 0,
        id: `${letter}-${Math.random().toString(36).substr(2, 9)}`
      }));

      console.log(`[YENİ OYUN] Oyuncu 1 eli: ${player1Hand.map(t => t.letter).join('')} (Kelime: ${randomWords[0]})`);
      console.log(`[YENİ OYUN] Oyuncu 2 eli: ${player2Hand.map(t => t.letter).join('')} (Kelime: ${randomWords[1]})`);

      let remainingTiles = [...shuffledTiles];
      player1Letters.concat(player2Letters).forEach(letter => {
        const index = remainingTiles.findIndex(tile => tile.letter === letter);
        if (index !== -1) {
          remainingTiles.splice(index, 1);
        }
      });

      console.log(`[YENİ OYUN] İlk ellerden sonra torbada ${remainingTiles.length} harf kaldı`);

      const initialBoardData = boardMatrix.map(row => row.map(cell => String(cell)));
      const flattenedBoard = flattenBoardData(initialBoardData);
      
      if (gameId) {
        await setDoc(doc(db, 'active_games', gameId as string), {
          boardData: flattenedBoard,
          tileBag: remainingTiles, 
          hands: {
            [player1Uid as string]: player1Hand,
            [player2Uid as string]: player2Hand
          },
          player1Score: 0,
          player2Score: 0,
          turn: player1Uid,
          lastMoveTime: Timestamp.now(),
          consecutivePasses: {
            [player1Uid as string]: 0,
            [player2Uid as string]: 0
          },
          placedTiles: [],
          status: 'active'
        });
        console.log("Initial game state saved to Firebase with tile bag");
      }

      if (currentUserUid === player1Uid) {
        setLettersInHand(player1Hand);
      } else if (currentUserUid === player2Uid) {
        setLettersInHand(player2Hand);
      }
      
      setAvailableTiles(remainingTiles);
      setBoardData(initialBoardData);
      setTurn(player1Uid as string);
      
    } catch (error) {
      console.error("Error initializing new game:", error);
      Alert.alert("Hata", "Yeni oyun başlatılamadı.");
    }
  };

  const flattenBoardData = (board: string[][]): string[] => {
    return board.flat();
  };

  const unflattenBoardData = (flatBoard: string[]): string[][] => {
    const size = 15; // Board size
    const board: string[][] = [];
    for (let i = 0; i < size; i++) {
      board.push(flatBoard.slice(i * size, (i + 1) * size));
    }
    return board;
  };

  const saveGameState = async () => {
    try {
      if (!gameId || !currentUserUid) {
        console.error("Missing gameId or currentUserUid");
        return;
      }

      const gameRef = doc(db, 'active_games', gameId as string);
      
      const flatBoard = flattenBoardData(boardData);
      
      const updateData: any = {
        boardData: flatBoard,
        [`hands.${currentUserUid}`]: lettersInHand,
        tileBag: availableTiles, 
        player1Score,
        player2Score,
        turn,
        placedTiles
      };
      
   
      const gameSnap = await getDoc(gameRef);
      if (gameSnap.exists()) {
        const data = gameSnap.data();
        if (data.hands) {
          const otherPlayerId = currentUserUid === player1Uid ? player2Uid : player1Uid;
          if (otherPlayerId && data.hands[otherPlayerId]) {
            updateData.hands = {
              [currentUserUid]: lettersInHand,
              [otherPlayerId]: data.hands[otherPlayerId]
            };
          }
        }
      }

      await updateDoc(gameRef, updateData);
      console.log("Game state saved to Firebase successfully with updated tile bag");
    } catch (error) {
      console.error("Error saving game state to Firebase:", error);
      Alert.alert("Kaydetme Hatası", "Oyun durumu kaydedilemedi. Lütfen internet bağlantınızı kontrol edin.");
    }
  };

  const drawRandomLetters = async (count: number) => {
    try {
      if (!gameId || !currentUserUid) {
        console.error("Missing gameId or currentUserUid");
        return;
      }
      
      const gameRef = doc(db, 'active_games', gameId as string);
      const gameSnap = await getDoc(gameRef);
      
      if (!gameSnap.exists()) {
        console.error("Game document not found");
        return;
      }
      
      const gameData = gameSnap.data();
      const currentTileBag = gameData.tileBag || [];
      
      if (currentTileBag.length === 0) {
        console.log("[HARF ÇEKİMİ] Harf torbası boş!");
        Alert.alert("Bilgi", "Harf torbası boş!");
        return;
      }
      
      console.log(`[HARF ÇEKİMİ] ${count} harf çekiliyor. Torbada ${currentTileBag.length} harf var.`);
      
      const shuffled = [...currentTileBag].sort(() => 0.5 - Math.random());
      
      const drawCount = Math.min(count, shuffled.length);
      const drawn = shuffled.slice(0, drawCount);
      
      const tilesWithIds = drawn.map(tile => ({
        ...tile,
        id: `${tile.letter}-${Math.random().toString(36).substr(2, 9)}`
      }));
      
      console.log(`[HARF ÇEKİMİ] Çekilen harfler: ${tilesWithIds.map(t => t.letter).join(', ')}`);
      
      const currentHand = gameData.hands?.[currentUserUid] || [];
      
      const newHand = [...currentHand, ...tilesWithIds];
      
      const newAvailableTiles = shuffled.slice(drawCount);
      
      console.log(`Adding ${tilesWithIds.length} new letters to hand, ${newAvailableTiles.length} remain in bag`);
      
      setLettersInHand(newHand);
      setAvailableTiles(newAvailableTiles);
      
      await updateDoc(gameRef, {
        tileBag: newAvailableTiles,
        [`hands.${currentUserUid}`]: newHand
      });
      
      console.log("Successfully updated hand and tile bag in Firebase");
      
      if (newAvailableTiles.length === 0) {
        Alert.alert("Dikkat", "Harf torbası boşaldı! Oyun sonuna yaklaşıyorsunuz.");
      }
    } catch (error) {
      console.error("Error drawing random letters:", error);
      Alert.alert("Hata", "Yeni harf çekilemedi. Lütfen internet bağlantınızı kontrol edin.");
    }
  };

  const isCurrentPlayerTurn = () => {
    return turn === currentUserUid;
  };

  const changeTurn = async () => {
    if (isGameOver) return;
    
    const newTurn = turn === player1Uid ? player2Uid : player1Uid;
    setTurn(newTurn || "");
    console.log(`Turn changed to: ${newTurn}`);
    
    const currentPlayerPasses = (consecutivePasses[turn] || 0) + 1;
    const newConsecutivePasses = {
      ...consecutivePasses,
      [turn]: currentPlayerPasses
    };
    
    setConsecutivePasses(newConsecutivePasses);
    
    try {
      const currentTime = Date.now();
      await updateDoc(doc(db, 'active_games', gameId as string), {
        turn: newTurn,
        lastMoveTime: Timestamp.fromMillis(currentTime),
        consecutivePasses: newConsecutivePasses
      });
      
      setLastMoveTime(currentTime);
      
      if (currentPlayerPasses >= 2) {
        handleConsecutivePasses();
        return;
      }
    } catch (error) {
      console.error("Error updating turn in Firebase:", error);
    }

    Alert.alert(
      "Sıra Değişti", 
      `Şimdi sıra ${newTurn === player1Uid ? player1 : player2}'de`
    );
  };

  const handleTimeOut = async () => {
    if (isGameOver) return;
    
    console.log("Time is up!");
    setIsGameOver(true);
    
    const winner = turn === player1Uid ? player2Uid : player1Uid;
    const winnerName = turn === player1Uid ? player2 : player1;
    
    Alert.alert(
      "Süre Doldu!", 
      `${turn === player1Uid ? player1 : player2} süreyi aştı. ${winnerName} kazandı!`
    );
    
    await endGame(winner, 'timeout');
  };

  const handleConsecutivePasses = async () => {
    if (isGameOver) return;
    
    console.log("Player passed consecutively!");
    setIsGameOver(true);
    
    const winner = turn === player1Uid ? player2Uid : player1Uid;
    const loserName = turn === player1Uid ? player1 : player2;
    const winnerName = turn === player1Uid ? player2 : player1;
    
    Alert.alert(
      "Üst üste Pas Geçildi!", 
      `${loserName} üst üste pas geçti. ${winnerName} kazandı!`
    );
    
    await endGame(winner, 'consecutive_passes');
  };

  const handleSurrender = async () => {
    if (isGameOver || !isCurrentPlayerTurn()) return;
    
    Alert.alert(
      "Teslim Ol",
      "Oyunu teslim etmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Teslim Ol", 
          style: "destructive",
          onPress: async () => {
            setIsGameOver(true);
            
            const winner = turn === player1Uid ? player2Uid : player1Uid;
            const winnerName = turn === player1Uid ? player2 : player1;
            
            Alert.alert(
              "Oyun Bitti!", 
              `Teslim oldunuz. ${winnerName} kazandı!`
            );
            
            await endGame(winner, 'surrender');
          }
        }
      ]
    );
  };

  const endGame = async (winnerId: string, reason: string) => {
    try {
      if (!gameId) return;
      
      const gameRef = doc(db, 'active_games', gameId as string);
      
      await updateDoc(gameRef, {
        status: 'completed',
        winner: winnerId,
        endReason: reason,
        endedAt: Timestamp.now()
      });
      
      await addDoc(collection(db, 'completed_games'), {
        player1: { uid: player1Uid, username: player1 },
        player2: { uid: player2Uid, username: player2 },
        player1Score: player1Score,
        player2Score: player2Score,
        winner: winnerId,
        endReason: reason,
        status: 'completed',
        gameId: gameId,
        completedAt: Timestamp.now().toMillis(),
        selectedTime
      });
      
      setTimeout(() => {
        router.replace('/completedgames');
      }, 3000);
    } catch (error) {
      console.error("Error ending game:", error);
      Alert.alert("Hata", "Oyun kapatılırken bir sorun oluştu.");
    }
  };

  const formatTime = (ms: number) => {
    if (ms <= 0) return "00:00";
    
    if (selectedTime === '12h' || selectedTime === '24h') {
      const hours = Math.floor(ms / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      const minutes = Math.floor(ms / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  const updateScore = async (playerId: string, points: number) => {
      let newScore = 0;
      
      if (playerId === player1Uid) {
        newScore = Number(player1Score) + points;
        setPlayer1Score(newScore);
      } else if (playerId === player2Uid) {
        newScore = Number(player2Score) + points;
        setPlayer2Score(newScore);
      }
      
      try {
        const scoreField = playerId === player1Uid ? 'player1Score' : 'player2Score';
        await updateDoc(doc(db, 'active_games', gameId as string), {
          [scoreField]: newScore
        });
      } catch (error) {
        console.error("Error updating score in Firebase:", error);
      }
    };

  const handleValidateMove = async () => {
    if (!isCurrentPlayerTurn()) {
      Alert.alert("Uyarı", "Şu anda sizin sıranız değil!");
      return;
    }
  
    if (placedTiles.length === 0) {
      Alert.alert("Dikkat", "Önce tahtaya harf yerleştirin!");
      return;
    }
  
    console.log("Validating move...");
    console.log("Placed tiles:", placedTiles);
  
    const formedWords = findFormedWords(boardDataBeforeMove, boardData, placedTiles);
    console.log(`[HAMLE] Oluşturulan kelimeler: ${formedWords.map(w => w.word).join(', ')}`);
  
    const areWordsValid = validateWords(formedWords);
  
    if (!areWordsValid) {
      Alert.alert("Geçersiz Hamle", "Oluşturduğunuz kelimelerden en az biri sözlükte bulunmuyor.");
      
      setBoardData(JSON.parse(JSON.stringify(boardDataBeforeMove)));
      
      const returnedTiles = placedTiles.map(tile => ({
        letter: tile.letter,
        count: 1,
        point: tile.point,
        id: tile.id
      }));
      
      const newHand = [...lettersInHand, ...returnedTiles];
      setLettersInHand(newHand);
      setPlacedTiles([]);
      
      try {
        await updateDoc(doc(db, 'active_games', gameId as string), {
          boardData: flattenBoardData(boardDataBeforeMove),
          [`hands.${currentUserUid}`]: newHand,
          placedTiles: []
        });
      } catch (error) {
        console.error("Error updating Firebase after invalid move:", error);
      }
      
      return;
    }
  
    console.log("Valid move!");
  
    let moveScore = 0;
    
    formedWords.forEach(word => {
      let wordScore = 0;
      let wordMultiplier = 1;
      
      word.tiles.forEach(tile => {
        let letterMultiplier = 1;
        const row = tile.row;
        const col = tile.col;
        const cellType = boardMatrix[row][col];
        const isNewlyPlaced = placedTiles.some(p => p.row === row && p.col === col);
        
        if (isNewlyPlaced) {
          if (cellType === 'H²') letterMultiplier = 2;
          else if (cellType === 'H³') letterMultiplier = 3;
          else if (cellType === 'K²') wordMultiplier *= 2;
          else if (cellType === 'K³') wordMultiplier *= 3;
        }
        
        wordScore += tile.point * letterMultiplier;
      });
      
      wordScore *= wordMultiplier;
      moveScore += wordScore;
    });
  
    Alert.alert("Başarılı Hamle", `${moveScore} puan kazandınız!`);
  
    await updateScore(turn || player1Uid, moveScore);
  
    const tilesNeeded = placedTiles.length;
    await drawRandomLetters(tilesNeeded);
  
    setPlacedTiles([]);
  
    await changeTurn();
    
    try {
      await updateDoc(doc(db, 'active_games', gameId as string), {
        placedTiles: []
      });
    } catch (error) {
      console.error("Error clearing placed tiles in Firebase:", error);
    }
  };
  
  const findFormedWords = (prevBoard: string[][], currentBoard: string[][], placedTiles: PlacedTile[]) => {
    if (placedTiles.length === 0) return [];
    
    const allSameRow = placedTiles.every(tile => tile.row === placedTiles[0].row);
    const allSameCol = placedTiles.every(tile => tile.col === placedTiles[0].col);
    
    if (!allSameRow && !allSameCol) {
      return [];
    }
    
    const formedWords: { 
      word: string, 
      tiles: { letter: string, point: number, row: number, col: number }[] 
    }[] = [];
    
    if (allSameRow) {
      const row = placedTiles[0].row;
      let startCol = placedTiles[0].col;
      let endCol = placedTiles[0].col;
      
      placedTiles.forEach(tile => {
        if (tile.col < startCol) startCol = tile.col;
        if (tile.col > endCol) endCol = tile.col;
      });
      
      while (startCol > 0 && currentBoard[row][startCol - 1].length === 1) {
        startCol--;
      }
      
      while (endCol < 14 && currentBoard[row][endCol + 1].length === 1) {
        endCol++;
      }
      
      let word = '';
      const wordTiles = [];
      
      for (let col = startCol; col <= endCol; col++) {
        const letterCell = currentBoard[row][col];
        if (letterCell.length !== 1) {
          return [];
        }
        
        word += letterCell;
        const placedTile = placedTiles.find(t => t.row === row && t.col === col);
        
        if (placedTile) {
          wordTiles.push({ 
            letter: placedTile.letter, 
            point: placedTile.point,
            row,
            col
          });
        } else {
          const existingLetter = currentBoard[row][col];
          const pointValue = tileBag.find(t => t.letter === existingLetter)?.point || 0;
          
          wordTiles.push({ 
            letter: existingLetter, 
            point: pointValue,
            row,
            col
          });
        }
      }
      
      if (word.length > 1) {
        formedWords.push({ word, tiles: wordTiles });
      }
      
      placedTiles.forEach(placedTile => {
        const { row, col, letter, point } = placedTile;
        let startRow = row;
        let endRow = row;
        
        while (startRow > 0 && currentBoard[startRow - 1][col].length === 1) {
          startRow--;
        }
        
        while (endRow < 14 && currentBoard[endRow + 1][col].length === 1) {
          endRow++;
        }
        
        if (endRow - startRow > 0) {
          let vertWord = '';
          const vertWordTiles = [];
          
          for (let r = startRow; r <= endRow; r++) {
            const letterCell = currentBoard[r][col];
            if (letterCell.length !== 1) {
              continue;
            }
            
            vertWord += letterCell;
            
            if (r === row) {
              vertWordTiles.push({ 
                letter, 
                point,
                row: r,
                col
              });
            } else {
              const existingLetter = currentBoard[r][col];
              const pointValue = tileBag.find(t => t.letter === existingLetter)?.point || 0;
              
              vertWordTiles.push({ 
                letter: existingLetter, 
                point: pointValue,
                row: r,
                col
              });
            }
          }
          
          if (vertWord.length > 1) {
            formedWords.push({ word: vertWord, tiles: vertWordTiles });
          }
        }
      });
    } else if (allSameCol) {
      const col = placedTiles[0].col;
      let startRow = placedTiles[0].row;
      let endRow = placedTiles[0].row;
      
      placedTiles.forEach(tile => {
        if (tile.row < startRow) startRow = tile.row;
        if (tile.row > endRow) endRow = tile.row;
      });
      
      while (startRow > 0 && currentBoard[startRow - 1][col].length === 1) {
        startRow--;
      }
      
      while (endRow < 14 && currentBoard[endRow + 1][col].length === 1) {
        endRow++;
      }
      
      let word = '';
      const wordTiles = [];
      
      for (let row = startRow; row <= endRow; row++) {
        const letterCell = currentBoard[row][col];
        if (letterCell.length !== 1) {
          return [];
        }
        
        word += letterCell;
        const placedTile = placedTiles.find(t => t.row === row && t.col === col);
        
        if (placedTile) {
          wordTiles.push({ 
            letter: placedTile.letter, 
            point: placedTile.point,
            row,
            col
          });
        } else {
          const existingLetter = currentBoard[row][col];
          const pointValue = tileBag.find(t => t.letter === existingLetter)?.point || 0;
          
          wordTiles.push({ 
            letter: existingLetter, 
            point: pointValue,
            row,
            col
          });
        }
      }
      
      if (word.length > 1) {
        formedWords.push({ word, tiles: wordTiles });
      }
      
      placedTiles.forEach(placedTile => {
        const { row, col, letter, point } = placedTile;
        let startCol = col;
        let endCol = col;
        
        while (startCol > 0 && currentBoard[row][startCol - 1].length === 1) {
          startCol--;
        }
        
        while (endCol < 14 && currentBoard[row][endCol + 1].length === 1) {
          endCol++;
        }
        
        if (endCol - startCol > 0) {
          let horzWord = '';
          const horzWordTiles = [];
          
          for (let c = startCol; c <= endCol; c++) {
            const letterCell = currentBoard[row][c];
            if (letterCell.length !== 1) {
              continue;
            }
            
            horzWord += letterCell;
            
            if (c === col) {
              horzWordTiles.push({ 
                letter, 
                point,
                row,
                col: c
              });
            } else {
              const existingLetter = currentBoard[row][c];
              const pointValue = tileBag.find(t => t.letter === existingLetter)?.point || 0;
              
              horzWordTiles.push({ 
                letter: existingLetter, 
                point: pointValue,
                row,
                col: c
              });
            }
          }
          
          if (horzWord.length > 1) {
            formedWords.push({ word: horzWord, tiles: horzWordTiles });
          }
        }
      });
    }
    
    return formedWords;
  };

  const validateWords = (words: { word: string, tiles: any[] }[]) => {
    if (words.length === 0) return false;
    
    return words.every(({ word }) => {
      const lowerWord = word.toLowerCase();
      return kelimelerJson.includes(lowerWord);
    });
  };

  function renderCell(type: string, row: number, col: number) {
    const isSpecialCell = type === 'H²' || type === 'H³' || type === 'K²' || type === 'K³' || type === '★';
    const isLetter = type.length === 1 && type !== '';
    
    const cellColors: Record<string, string> = {
      '': '#e1e1e1',
      'H²': '#aec7e1',  
      'H³': '#e5bbd5', 
      'K²': '#b3d8a2',  
      'K³': '#b3a396',  
      '★': '#e09c3a',  
    };
    
    
    return (
      <View
        key={`${row}-${col}`}
        style={[
          styles.cell, 
          { 
            backgroundColor: isSpecialCell ? cellColors[type as CellType] : '#e1e1e1',
            width: cellSize,
            height: cellSize
          }
        ]}
      >
        {!isLetter ? (
          <Text style={styles.cellText}>
            {isSpecialCell ? type : ''}
          </Text>
        ) : (
          <View style={styles.placedTile}>
            <Text style={styles.placedTileLetter}>{type}</Text>
            {type !== '*' && (
              <Text style={styles.placedTilePoint}>
                {tileBag.find(t => t.letter === type)?.point || 0}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  }

  const renderDebugInfo = () => {
    if (__DEV__) {
      return (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Hand: {lettersInHand.map(tile => tile.letter).join(', ')}
          </Text>
        </View>
      );
    }
    return null;
  };

  const styles = StyleSheet.create({
    background: {
      flex: 1,
      justifyContent: 'center'
    },
    container: {
      flex: 1,
      alignItems: 'center',
      padding: 10,
      position: 'relative'
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#000',
      textAlign: 'center'
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'center'
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: 20,
      marginBottom: 10
    },
    playerContainer: {
      flex: 3,
      alignItems: 'center'
    },
    playerBox: {
      backgroundColor: '#e5e7eb',
      paddingTop: 3,
      paddingBottom: 3,
      paddingHorizontal: 10,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      width: 130,
      height: 35,
      margin: 15
    },
    activePlayer: {
      backgroundColor: '#bbf7d0', 
      borderWidth: 2,
      borderColor: '#22c55e', 
    },
    username: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#111',
      marginBottom: 5
    },
    scoreCircle: {
      backgroundColor: '#fff',
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#ccc',
      margin: 5,
      zIndex: 1
    },
    score: {
      fontSize: 16,
      fontWeight: 'bold'
    },
    timerContainer: {
      flex: 2,
      alignItems: 'center',
      justifyContent: 'center'
    },
    timerText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: timeLeft < 60000 ? '#dc2626' : '#000' 
    },
    board: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 5,
      zIndex: 1
    },
    cell: {
      margin: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 2,
      borderColor: '#000',
      borderWidth: 0.2
    },
    cellText: {
      fontSize: 10,
      color: '#000',
      fontWeight: 'bold'
    },
    handContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
      paddingBottom: 10
    },
    hand: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderRadius: 5,
      zIndex: 5,
      marginHorizontal: 10,
      borderWidth: 1,
      borderColor: '#ddd'
    },
    tile: {
      width: 40,
      height: 40,
      backgroundColor: '#fff',
      borderRadius: 5,
      margin: 5,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#ccc',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      zIndex: 10
    },
    tileLetter: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333'
    },
    tilePoint: {
      fontSize: 10,
      color: '#555',
      position: 'absolute',
      bottom: 2,
      right: 3
    },
    placedTile: {
      width: '100%',
      height: '100%',
      backgroundColor: '#fff',
      borderRadius: 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#000'
    },
    placedTileLetter: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#000'
    },
    placedTilePoint: {
      fontSize: 8,
      color: '#555',
      position: 'absolute',
      bottom: 1,
      right: 2
    },
    infoContainer: {
      padding: 5,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 20,
      marginVertical: 10
    },
    infoText: {
      fontSize: 14,
      color: '#333',
      fontWeight: 'bold'
    },
    debugContainer: {
      padding: 5,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 5,
      margin: 5,
      position: 'absolute',
      top: 120,
      left: 10,
      zIndex: 100
    },
    debugText: {
      color: '#fff',
      fontSize: 10
    },
    turnIndicatorContainer: {
      padding: 10,
      borderRadius: 5,
      marginVertical: 10,
      alignItems: 'center',
      justifyContent: 'center'
    },
    turnIndicatorText: {
      fontSize: 16,
      fontWeight: 'bold'
    },
    disabledHand: {
      opacity: 0.5
    },
    disabledTile: {
      opacity: 0.5
    },
    hiddenHandText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#888',
      textAlign: 'center',
      marginTop: 10,
    },
    buttonContainer: {
      marginTop: 10, 
      flexDirection: 'row', 
      justifyContent: 'space-around', 
      width: '100%'
    },
    buttonWarning: {
      backgroundColor: '#ef4444',
      color: '#fff'
    },
    gameOverOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100
    },
    gameOverText: {
      color: '#fff',
      fontSize: 32,
      fontWeight: 'bold'
    }
  });
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={require('../assets/images/foto.jpeg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <Text style={styles.title}>Oyun Başladı!</Text>
  
          {/* Oyuncular ve Süre */}
          <View style={styles.topRow}>
            <View style={styles.playerContainer}>
              <View style={[styles.playerBox, turn === player1Uid ? styles.activePlayer : null]}>
                <Text style={styles.username}>{player1}</Text>
              </View>
            </View>
  
            <View style={styles.scoreCircle}>
              <Text style={styles.score}>{player1Score}</Text>
            </View>
  
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>
  
            <View style={styles.scoreCircle}>
              <Text style={styles.score}>{player2Score}</Text>
            </View>
  
            <View style={styles.playerContainer}>
              <View style={[styles.playerBox, turn === player2Uid ? styles.activePlayer : null]}>
                <Text style={styles.username}>{player2}</Text>
              </View>
            </View>
          </View>
  
          {/* Sıra Göstergesi */}
          <View style={[
            styles.turnIndicatorContainer, 
            { backgroundColor: isCurrentPlayerTurn() ? '#d4edda' : '#f8d7da' }
          ]}>
            <Text style={[
              styles.turnIndicatorText,
              { color: isCurrentPlayerTurn() ? '#155724' : '#721c24' }
            ]}>
              {isCurrentPlayerTurn() 
                ? "✓ Sıra Sizde!" 
                : `⏳ Sıra ${turn === player1Uid ? player1 : player2}'de`}
            </Text>
          </View>
  
          {/* Oyun Tahtası */}
          <View style={styles.board} ref={boardRef}>
            {boardData?.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.row}>
                {row?.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
              </View>
            ))}
          </View>
  
          {/* Kontrol Butonları */}
          <View style={styles.buttonContainer}>
            <Button 
              title="Pas Geç"
              onPress={changeTurn}
              color="#f39c12"
              disabled={!isCurrentPlayerTurn() || isGameOver} 
            />
            
            <Button 
              title="Onayla"
              onPress={handleValidateMove}
              color={isCurrentPlayerTurn() ? '#4ade80' : '#60a5fa'}
              disabled={!isCurrentPlayerTurn() || placedTiles.length === 0 || isGameOver} 
            />

            <Button 
              title="Teslim Ol"
              onPress={handleSurrender}
              color="#ef4444"
              disabled={!isCurrentPlayerTurn() || isGameOver}
            />
          </View>
  
          {/* Kalan Harfler Bilgisi */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>Havuzda kalan: {availableTiles.length} harf</Text>
          </View>
  
          {/* Debug Info */}
          {renderDebugInfo()}
  
          {/* Oyuncunun Elindeki Harfler */}
          <View style={styles.handContainer}>
            <View style={[
              styles.hand,
              !isCurrentPlayerTurn() && styles.disabledHand
            ]}>
              {isCurrentPlayerTurn() && !isGameOver ? (
                lettersInHand?.map((tile, index) => {
                  const panResponder = createPanResponder(index, tile.id);

                  return (
                    <Animated.View
                      key={tile.id}
                      {...panResponder.panHandlers}
                      style={[
                        styles.tile,
                        draggedTile?.tileId === tile.id
                          ? {
                              transform: [
                                { translateX: draggedTile.pan.x },
                                { translateY: draggedTile.pan.y }
                              ],
                              zIndex: 10
                            }
                          : {}
                      ]}
                    >
                      <Text style={styles.tileLetter}>{tile.letter}</Text>
                      {tile.letter !== '*' && (
                        <Text style={styles.tilePoint}>{tile.point}</Text>
                      )}
                    </Animated.View>
                  );
                })
              ) : (
                <Text style={styles.hiddenHandText}>
                  {isGameOver ? "Oyun Bitti!" : "Sıra Karşı Tarafta"}
                </Text>
              )}
            </View>
          </View>
          
          {isGameOver && (
            <View style={styles.gameOverOverlay}>
              <Text style={styles.gameOverText}>OYUN BİTTİ</Text>
            </View>
          )}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}