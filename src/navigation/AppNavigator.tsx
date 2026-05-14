import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootTabParamList, NotesStackParamList } from '../types';
import { COLORS } from '../utils/constants';

// Screens
import NotesListScreen from '../screens/NotesListScreen';
import NoteEditorScreen from '../screens/NoteEditorScreen';
import FinanceScreen from '../screens/FinanceScreen';
import SettingsScreen from '../screens/SettingsScreen';

// ─── Notes Stack ────────────────────────────────────────────────

const NotesStack = createNativeStackNavigator<NotesStackParamList>();

function NotesStackNavigator() {
  return (
    <NotesStack.Navigator screenOptions={{ headerShown: false }}>
      <NotesStack.Screen name="NotesList" component={NotesListScreen} />
      <NotesStack.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={{ gestureEnabled: true }}
      />
    </NotesStack.Navigator>
  );
}

// ─── Bottom Tabs ────────────────────────────────────────────────

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function AppNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: COLORS.light.background,
      card: COLORS.light.surface,
      border: COLORS.light.border,
      text: COLORS.light.text,
      primary: COLORS.primary,
    },
  };

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: COLORS.dark.background,
      card: COLORS.dark.surface,
      border: COLORS.dark.border,
      text: COLORS.dark.text,
      primary: COLORS.primary,
    },
  };

  return (
    <NavigationContainer theme={isDark ? customDarkTheme : customLightTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            switch (route.name) {
              case 'Notes':
                iconName = focused ? 'document-text' : 'document-text-outline';
                break;
              case 'Finance':
                iconName = focused ? 'wallet' : 'wallet-outline';
                break;
              case 'Settings':
                iconName = focused ? 'settings' : 'settings-outline';
                break;
              default:
                iconName = 'ellipse';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: isDark
            ? COLORS.dark.textTertiary
            : COLORS.light.textTertiary,
          tabBarStyle: {
            borderTopWidth: 0.5,
            borderTopColor: isDark ? COLORS.dark.border : COLORS.light.border,
            paddingTop: 4,
            height: 88,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        })}
      >
        <Tab.Screen name="Notes" component={NotesStackNavigator} />
        <Tab.Screen name="Finance" component={FinanceScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
