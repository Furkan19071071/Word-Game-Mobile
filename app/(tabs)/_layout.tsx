import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import { MaterialIcons } from '@expo/vector-icons';

import { TextStyle } from 'react-native';

type IconSymbolProps = {
  name: keyof typeof MaterialIcons.glyphMap;
  color: string;
  size: number;
  style?: TextStyle;
};

export function IconSymbol({ name, color, size, style }: IconSymbolProps) {
  return <MaterialIcons name={name} color={color} size={size} style={style} />;
}
export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#fff',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="register"
        options={{
          title: 'Üye Ol',
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="person-add" // Burada doğru ikon: person-add
              color={color}
              size={24}
              style={{ marginBottom: -3 }}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="login"
        options={{
          title: 'Giriş Yap',
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="login" // Burayı düzelttim: login ikonu kullanıyoruz!
              color={color}
              size={24}
              style={{ marginBottom: -3 }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
