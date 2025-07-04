import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router, Tabs } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useColorScheme } from '@/hooks/useColorScheme';

import {

  Text,

  TouchableOpacity,

} from 'react-native';

SplashScreen.preventAutoHideAsync();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#131232',
    card: '#131232',
    text: '#fff', 
  },
};

const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#131232', 
    card: '#131232', 
    text: '#131232', 
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const originalNavigate = router.navigate;
    
    router.navigate = (name, params) => {
      console.log(`[DEBUG] Navigation attempted to: ${name}`, params);
      
      if (name === 'finishedgames') {
        console.warn('Redirecting from finishedgames to completedgames');
        return originalNavigate('completedgames', params);
      }
      
      return originalNavigate(name, params);
    };
    
    return () => {
      router.navigate = originalNavigate;
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
      <Stack
        screenOptions={{
          headerShown: true, 
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 10 }}>
              <Text style={{ color: '#fff', fontSize: 16 }}>Geri</Text>
            </TouchableOpacity>
          ),
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export function AppLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="newgame"
        options={{
          title: 'Yeni Oyun',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activegames"
        options={{
          title: 'Aktif Oyunlar',
          tabBarIcon: ({ color }) => <Ionicons name="game-controller" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="completedgames"
        options={{
          title: 'Tamamlanan Oyunlar',
          tabBarIcon: ({ color }) => <Ionicons name="trophy" size={24} color={color} />,
          tabBarLabel: 'Tamamlanan',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="matchmaking"
        options={{
          href: null, 
        }}
      />
      <Tabs.Screen
        name="game"
        options={{
          href: null, 
        }}
      />
    </Tabs>
  );
}