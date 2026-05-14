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
import { Ionicons } from '@expo/vector-icons';
import { ExpenseCategory } from '../types';
import { COLORS, CATEGORY_CONFIG } from '../utils/constants';

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
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.cancelText, { color: COLORS.error }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Add Expense
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0}
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

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {/* Amount Input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Amount</Text>
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
            <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
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
                    size={16}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 16,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    paddingVertical: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  descInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
