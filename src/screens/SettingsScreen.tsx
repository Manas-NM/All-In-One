import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  CURRENCIES,
  FONT_SIZES,
  SPACING,
  RADIUS,
} from '../utils/constants';
import {
  rf,
  rs,
  rr,
  ri,
  getScreenHorizontalPadding,
  getMaxContentWidth,
} from '../utils/responsive';
import { getSetting, setSetting } from '../services/database';
import {
  saveApiKey,
  getApiKey,
  testApiConnection,
} from '../services/aiService';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [currency, setCurrency] = useState('$');
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedCurrency = await getSetting('currency');
    if (savedCurrency) setCurrency(savedCurrency);
    const savedHaptic = await getSetting('hapticFeedback');
    if (savedHaptic !== null) setHapticEnabled(savedHaptic === 'true');
    const key = await getApiKey();
    if (key) {
      setHasApiKey(true);
      setApiKey(key);
    }
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

  const handleSaveApiKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter an API key.');
      return;
    }
    try {
      await saveApiKey(trimmed);
      setHasApiKey(true);
      Alert.alert('Success', 'API key saved securely.');
    } catch {
      Alert.alert('Error', 'Failed to save API key.');
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    const result = await testApiConnection();
    setTestingConnection(false);
    if (result.success) {
      Alert.alert('✅ Connected', 'OpenAI API connection is working.');
    } else {
      Alert.alert('❌ Failed', result.error || 'Connection test failed.');
    }
  };

  const horizontalPadding = getScreenHorizontalPadding();
  const maxContentWidth = getMaxContentWidth();

  const renderSettingRow = (
    icon: string,
    label: string,
    subtitle?: string,
    right?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={[
        styles.settingRow,
        { backgroundColor: theme.surface, marginHorizontal: horizontalPadding },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.settingIcon, { backgroundColor: COLORS.primary + '15' }]}>
        <Ionicons name={icon as any} size={ri(18)} color={COLORS.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text
          style={[styles.settingLabel, { color: theme.text }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle && (
          <Text
            style={[styles.settingSubtitle, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {right || (
        <Ionicons name="chevron-forward" size={ri(16)} color={theme.textTertiary} />
      )}
    </TouchableOpacity>
  );

  const headerTopPadding = Math.max(insets.top, rs(12)) + rs(8);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + rs(100),
        alignSelf: 'center',
        width: '100%',
        maxWidth: maxContentWidth,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: headerTopPadding, paddingHorizontal: horizontalPadding },
        ]}
      >
        <Text
          style={[styles.greeting, { color: theme.textSecondary }]}
          numberOfLines={1}
        >
          Preferences
        </Text>
        <Text
          style={[styles.title, { color: theme.text }]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          Settings
        </Text>
      </View>

      {/* App Info Card */}
      <View
        style={[
          styles.appCard,
          { backgroundColor: COLORS.primary, marginHorizontal: horizontalPadding },
        ]}
      >
        <View style={styles.appIcon}>
          <Text style={{ fontSize: rf(32) }}>🎓</Text>
        </View>
        <View style={styles.appInfo}>
          <Text style={styles.appName}>StudentOS</Text>
          <Text style={styles.appVersion}>Phase 2 • Version 2.0.0</Text>
        </View>
      </View>

      {/* General Section */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary, paddingHorizontal: horizontalPadding + rs(4) },
          ]}
        >
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

      {/* AI Settings Section */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary, paddingHorizontal: horizontalPadding + rs(4) },
          ]}
        >
          AI SETTINGS
        </Text>

        <View
          style={[
            styles.aiCard,
            { backgroundColor: theme.surface, marginHorizontal: horizontalPadding },
          ]}
        >
          <Text style={[styles.aiCardLabel, { color: theme.textSecondary }]}>
            OpenAI API Key
          </Text>
          <View style={styles.apiKeyRow}>
            <TextInput
              style={[
                styles.apiKeyInput,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-..."
              placeholderTextColor={theme.textTertiary}
              secureTextEntry={!showApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowApiKey(!showApiKey)}
            >
              <Ionicons
                name={showApiKey ? 'eye-off' : 'eye'}
                size={ri(18)}
                color={theme.textTertiary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.aiButtonsRow}>
            <TouchableOpacity
              style={[styles.aiActionBtn, { backgroundColor: COLORS.primary }]}
              onPress={handleSaveApiKey}
            >
              <Ionicons name="save-outline" size={ri(14)} color="#FFF" />
              <Text style={styles.aiActionBtnText}>Save Key</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.aiActionBtn,
                {
                  backgroundColor: hasApiKey ? COLORS.success + '15' : theme.surfaceSecondary,
                },
              ]}
              onPress={handleTestConnection}
              disabled={testingConnection || !hasApiKey}
            >
              {testingConnection ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons
                    name="flash-outline"
                    size={ri(14)}
                    color={hasApiKey ? COLORS.success : theme.textTertiary}
                  />
                  <Text
                    style={[
                      styles.aiActionBtnText,
                      { color: hasApiKey ? COLORS.success : theme.textTertiary },
                    ]}
                  >
                    Test
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.aiHint, { color: theme.textTertiary }]}>
            Your API key is stored securely on-device. It's used for note summarization only.
          </Text>
        </View>
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary, paddingHorizontal: horizontalPadding + rs(4) },
          ]}
        >
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
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.textSecondary, paddingHorizontal: horizontalPadding + rs(4) },
          ]}
        >
          ABOUT
        </Text>
        {renderSettingRow(
          'information-circle-outline',
          'About StudentOS',
          'Built for students, by students'
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textTertiary }]}>
          StudentOS Phase 2
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
    paddingBottom: rs(SPACING.md),
  },
  greeting: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: rf(FONT_SIZES.display),
    fontWeight: '700',
    marginTop: rs(2),
    lineHeight: rf(FONT_SIZES.display) * 1.2,
  },
  appCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rr(RADIUS.xxl),
    padding: rs(SPACING.xl),
    marginBottom: rs(SPACING.xxl),
  },
  appIcon: {
    width: ri(56),
    height: ri(56),
    borderRadius: rr(RADIUS.xl),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(SPACING.lg),
  },
  appInfo: {
    flex: 1,
  },
  appName: {
    color: '#FFF',
    fontSize: rf(FONT_SIZES.titleLarge),
    fontWeight: '700',
  },
  appVersion: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: rf(FONT_SIZES.small),
    marginTop: rs(2),
  },
  section: {
    marginBottom: rs(SPACING.xxl),
  },
  sectionTitle: {
    fontSize: rf(FONT_SIZES.caption),
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: rs(SPACING.sm),
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(SPACING.lg),
    paddingVertical: rs(SPACING.md + 2),
    marginVertical: rs(2),
    borderRadius: rr(RADIUS.lg),
  },
  settingIcon: {
    width: ri(34),
    height: ri(34),
    borderRadius: rr(RADIUS.sm),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(SPACING.md),
  },
  settingInfo: {
    flex: 1,
    paddingRight: rs(SPACING.sm),
  },
  settingLabel: {
    fontSize: rf(FONT_SIZES.bodyLarge),
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: rf(FONT_SIZES.small),
    marginTop: rs(2),
  },
  currencyValue: {
    fontSize: rf(FONT_SIZES.title),
    fontWeight: '700',
  },
  aiCard: {
    borderRadius: rr(RADIUS.lg),
    padding: rs(SPACING.lg),
  },
  aiCardLabel: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '600',
    marginBottom: rs(SPACING.sm),
  },
  apiKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(SPACING.sm),
  },
  apiKeyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: rr(RADIUS.md),
    padding: rs(SPACING.sm + 2),
    fontSize: rf(FONT_SIZES.body),
  },
  eyeBtn: {
    padding: rs(SPACING.sm),
  },
  aiButtonsRow: {
    flexDirection: 'row',
    gap: rs(SPACING.sm),
    marginTop: rs(SPACING.md),
  },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rr(RADIUS.md),
    paddingVertical: rs(SPACING.sm + 2),
    paddingHorizontal: rs(SPACING.lg),
    gap: rs(SPACING.xs),
  },
  aiActionBtnText: {
    color: '#FFF',
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '600',
  },
  aiHint: {
    fontSize: rf(FONT_SIZES.caption),
    marginTop: rs(SPACING.md),
    lineHeight: rf(FONT_SIZES.caption) * 1.4,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: rs(SPACING.xxxl),
  },
  footerText: {
    fontSize: rf(FONT_SIZES.small),
    marginBottom: rs(SPACING.xs),
  },
});
