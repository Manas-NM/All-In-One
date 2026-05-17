import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ExpenseCategory } from '../types';
import {
  COLORS,
  CATEGORY_CONFIG,
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

interface ExpenseFormProps {
  visible: boolean;
  currency: string;
  onClose: () => void;
  onSubmit: (expense: {
    amount: number;
    category: ExpenseCategory;
    description: string;
    date: string;
  }) => void;
}

export default function ExpenseForm({
  visible,
  currency,
  onClose,
  onSubmit,
}: ExpenseFormProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSubmit({
      amount: parsedAmount,
      category,
      description: description.trim(),
      date: new Date().toISOString().split('T')[0],
    });

    // Reset form
    setAmount('');
    setCategory('food');
    setDescription('');
    onClose();
  };

  const categories = Object.entries(CATEGORY_CONFIG) as [
    ExpenseCategory,
    (typeof CATEGORY_CONFIG)[ExpenseCategory]
  ][];

  const horizontalPadding = getScreenHorizontalPadding();
  const maxContentWidth = getMaxContentWidth();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {/* Header. pageSheet modals on iOS already inset from the top, but
            we still defensively account for insets in case of fullScreen
            usage on certain devices. */}
        <View
          style={[
            styles.header,
            {
              borderBottomColor: theme.border,
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.cancelText, { color: COLORS.error }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Add Expense
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.saveText,
                {
                  color:
                    amount && parseFloat(amount) > 0
                      ? COLORS.primary
                      : theme.textTertiary,
                },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.form}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingTop: rs(SPACING.lg),
            paddingBottom: insets.bottom + rs(SPACING.xxl),
            alignSelf: 'center',
            width: '100%',
            maxWidth: maxContentWidth,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Amount
            </Text>
            <View
              style={[
                styles.amountInputContainer,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>
                {currency}
              </Text>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Category
            </Text>
            <View style={styles.categoryGrid}>
              {categories.map(([key, config]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        category === key ? config.color + '20' : theme.surface,
                      borderColor:
                        category === key ? config.color : theme.border,
                    },
                  ]}
                  onPress={() => setCategory(key)}
                >
                  <Ionicons
                    name={config.icon as any}
                    size={ri(16)}
                    color={category === key ? config.color : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      {
                        color:
                          category === key ? config.color : theme.textSecondary,
                      },
                    ]}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Description (optional)
            </Text>
            <TextInput
              style={[
                styles.descInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Coffee at campus café"
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={2}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(SPACING.md + 2),
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: rf(FONT_SIZES.title - 1),
    fontWeight: '600',
  },
  cancelText: {
    fontSize: rf(FONT_SIZES.subtitle),
  },
  saveText: {
    fontSize: rf(FONT_SIZES.subtitle),
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  section: {
    marginBottom: rs(SPACING.xxl),
  },
  label: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '500',
    marginBottom: rs(SPACING.sm),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rr(RADIUS.lg),
    borderWidth: 1,
    paddingHorizontal: rs(SPACING.lg),
  },
  currencySymbol: {
    fontSize: rf(FONT_SIZES.heading),
    fontWeight: '600',
    marginRight: rs(SPACING.sm),
  },
  amountInput: {
    flex: 1,
    fontSize: rf(FONT_SIZES.hero),
    fontWeight: '700',
    paddingVertical: rs(SPACING.lg),
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(SPACING.sm),
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(SPACING.md + 2),
    paddingVertical: rs(SPACING.sm + 2),
    borderRadius: rr(RADIUS.md),
    borderWidth: 1.5,
    gap: rs(6),
  },
  categoryText: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '500',
  },
  descInput: {
    borderRadius: rr(RADIUS.lg),
    borderWidth: 1,
    padding: rs(SPACING.md + 2),
    fontSize: rf(FONT_SIZES.bodyLarge),
    minHeight: rs(60),
    textAlignVertical: 'top',
  },
});
