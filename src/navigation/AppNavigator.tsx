import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootTabParamList, NotesStackParamList } from '../types';
import { COLORS } from '../utils/constants';
import { rf, rs, ri, pickByDevice } from '../utils/responsive';

// Screens
import NotesListScreen from '../screens/NotesListScreen';
import NoteEditorScreen from '../screens/NoteEditorScreen';
import SubjectsScreen from '../screens/SubjectsScreen';
import TasksScreen from '../screens/TasksScreen';
import HabitsScreen from '../screens/HabitsScreen';
import FinanceScreen from '../screens/FinanceScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import FlashcardDeckScreen from '../screens/FlashcardDeckScreen';
import FlashcardStudyScreen from '../screens/FlashcardStudyScreen';

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
      <NotesStack.Screen
        name="Subjects"
        component={SubjectsScreen}
        options={{ gestureEnabled: true }}
      />
      <NotesStack.Screen
        name="Flashcards"
        component={FlashcardsScreen}
        options={{ gestureEnabled: true }}
      />
      <NotesStack.Screen
        name="FlashcardDeck"
        component={FlashcardDeckScreen}
        options={{ gestureEnabled: true }}
      />
      <NotesStack.Screen
        name="FlashcardStudy"
        component={FlashcardStudyScreen}
        options={{ gestureEnabled: false }}
      />
    </NotesStack.Navigator>
  );
}

// ─── Bottom Tabs ────────────────────────────────────────────────

const Tab = createBottomTabNavigator<RootTabParamList>();

function AppTabs() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const baseTabHeight = pickByDevice({
    small: 56,
    medium: 60,
    large: 62,
    tablet: 72,
  });
  const tabBarHeight = baseTabHeight + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Notes':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Tasks':
              iconName = focused ? 'checkbox' : 'checkbox-outline';
              break;
            case 'Habits':
              iconName = focused ? 'flame' : 'flame-outline';
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

          return <Ionicons name={iconName} size={ri(size)} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: isDark
          ? COLORS.dark.textTertiary
          : COLORS.light.textTertiary,
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: isDark ? COLORS.dark.border : COLORS.light.border,
          paddingTop: rs(4),
          paddingBottom: insets.bottom > 0 ? insets.bottom : rs(8),
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: rf(10),
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Notes" component={NotesStackNavigator} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Habits" component={HabitsScreen} />
      <Tab.Screen name="Finance" component={FinanceScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

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
      <AppTabs />
    </NavigationContainer>
  );
}
