import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  useColorScheme,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURRENCIES } from '../utils/constants';
import { getSetting, setSetting } from '../services/database';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [currency, setCurrency] = useState('$');
  const [hapticEnabled, setHapticEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedCurrency = await getSetting('currency');
    if (savedCurrency) setCurrency(savedCurrency);
    const savedHaptic = await getSetting('hapticFeedback');
    if (savedHaptic !== null) setHapticEnabled(savedHaptic === 'true');
  };

  const handleCurrencyChange = () => {
    const currentIndex = CURRENCIES.findIndex((c) => c.symbol === currency);
    const nextIndex = (currentIndex + 1) % CURRENCIES.length;
    const newCurrency = CURRENCIES[nextIndex].symbol;
    setCurrency(newCurrency);
    setSetting('currency', newCurrency);
  };

  const handleToggleHaptic = (value: boolean) => {
    setHapticEnabled(value);
    setSetting('hapticFeedback', String(value));
  };

  const renderSettingRow = (
    icon: string,
    label: string,
    subtitle?: string,
    right?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[styles.settingRow, { backgroundColor: theme.surface }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '15' }]}>
        <Ionicons name={icon as any} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {right || (
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>
          Preferences
        </Text>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      {/* App Info Card */}
      <View style={[styles.appCard, { backgroundColor: COLORS.primary }]}>
        <View style={styles.appIcon}>
          <Text style={{ fontSize: 32 }}>🎓</Text>
        </View>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>StudentOS</Text>
          <Text style={styles.appVersion}>Phase 1 • Version 1.0.0</Text>
        </View>
      </View>

      {/* General Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          GENERAL
        </Text>
        {renderSettingRow(
          'moon-outline',
          'Appearance',
          `Using ${isDark ? 'Dark' : 'Light'} mode (System)`,
          undefined,
          () =>
            Alert.alert(
              'Theme',
              'StudentOS follows your system appearance setting. Change it in iOS Settings > Display & Brightness.'
            )
        )}
        {renderSettingRow(
          'cash-outline',
          'Currency',
          `Currently: ${currency} (${CURRENCIES.find((c) => c.symbol === currency)?.label || 'USD'})`,
          <Text style={[styles.currencyValue, { color: COLORS.primary }]}>
            {currency}
          </Text>,
          handleCurrencyChange
        )}
        {renderSettingRow(
          'phone-portrait-outline',
          'Haptic Feedback',
          'Vibration on interactions',
          <Switch
            value={hapticEnabled}
            onValueChange={handleToggleHaptic}
            trackColor={{ false: theme.border, true: COLORS.primary + '60' }}
            thumbColor={hapticEnabled ? COLORS.primary : theme.textTertiary}
          />
        )}
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          DATA
        </Text>
        {renderSettingRow(
          'cloud-download-outline',
          'Export All Data',
          'Export notes and expenses as PDF',
          undefined,
          () =>
            Alert.alert(
              'Export',
              'Individual note export is available in the note editor via the share button.'
            )
        )}
        {renderSettingRow(
          'trash-outline',
          'Clear All Data',
          'Permanently delete all notes and expenses',
          undefined,
          () =>
            Alert.alert(
              'Clear All Data',
              'This will permanently delete all your notes and expenses. This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Everything',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Data Cleared', 'All data has been deleted.');
                  },
                },
              ]
            )
        )}
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ABOUT
        </Text>
        {renderSettingRow(
          'information-circle-outline',
          'About StudentOS',
          'Built for students, by students',
        )}
        {renderSettingRow(
          'heart-outline',
          'Rate the App',
          'If you enjoy using StudentOS',
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textTertiary }]}>
          StudentOS Phase 1
        </Text>
        <Text style={[styles.footerText, { color: theme.textTertiary }]}>
          Made with ❤️ for students everywhere
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 2,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  appInfo: {},
  appName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  appVersion: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  currencyValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 100,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
});
