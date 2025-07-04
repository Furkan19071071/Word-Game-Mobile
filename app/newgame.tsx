import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert,ImageBackground } from 'react-native';
import { useNavigation } from 'expo-router';

const timeOptions = [
  { label: '⏱️ 2 Dakika (Hızlı)', value: '2m' },
  { label: '⏱️ 5 Dakika (Hızlı)', value: '5m' },
  { label: '🕓 12 Saat (Geniş)', value: '12h' },
  { label: '🕛 24 Saat (Geniş)', value: '24h' },
];

export default function NewGameScreen() {
  const navigation = useNavigation();

  const handleTimeSelect = (time: string) => {
    Alert.alert('Süre Seçildi', `${time} olarak eşleşme aranıyor...`);
    navigation.navigate('matchmaking' as never, { time } as never); // bir sonraki ekran için
  };

  return (
            <ImageBackground
              source={require('../assets/images/foto.jpeg')} // arka plan görselini buraya ekle
              style={styles.background}
              resizeMode="cover"
            >
    <View style={styles.container}>
      <Text style={styles.title}>Oyun Süresi Seç</Text>
      {timeOptions.map((option) => (
        <TouchableOpacity key={option.value} style={styles.button} onPress={() => handleTimeSelect(option.value)}>
          <Text style={styles.buttonText}>{option.label}</Text>
        </TouchableOpacity>
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, color: '#333' },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    width: '80%',
    opacity: 0.8,
    borderWidth: 2,
    borderColor: '#0d6966', // Border rengi
  },
  buttonText: { color: '#0d6966', fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
});
