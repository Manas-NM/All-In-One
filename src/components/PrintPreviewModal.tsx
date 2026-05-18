import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  useColorScheme,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, SPACING, RADIUS } from '../utils/constants';
import { rf, rs, rr, ri, getScreenHorizontalPadding } from '../utils/responsive';

interface PrintOption {
  key: string;
  label: string;
  value: boolean;
}

interface PrintPreviewModalProps {
  visible: boolean;
  title: string;
  options: PrintOption[];
  onToggleOption: (key: string) => void;
  onPrint: () => void;
  onClose: () => void;
}

export default function PrintPreviewModal({
  visible,
  title,
  options,
  onToggleOption,
  onPrint,
  onClose,
}: PrintPreviewModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

          {options.map((opt) => (
            <View key={opt.key} style={[styles.optionRow, { borderBottomColor: theme.border }]}>
              <Text style={[styles.optionLabel, { color: theme.text }]}>{opt.label}</Text>
              <Switch
                value={opt.value}
                onValueChange={() => onToggleOption(opt.key)}
                trackColor={{ true: COLORS.primary, false: theme.surfaceSecondary }}
              />
            </View>
          ))}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.printBtn, { backgroundColor: COLORS.primary }]}
              onPress={onPrint}
            >
              <Ionicons name="print" size={ri(18)} color="#FFF" />
              <Text style={styles.printText}>Print</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: rs(SPACING.xl),
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: rr(RADIUS.xxl),
    padding: rs(SPACING.xl),
  },
  title: {
    fontSize: rf(FONT_SIZES.title),
    fontWeight: '700',
    marginBottom: rs(SPACING.lg),
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: rs(SPACING.md),
    borderBottomWidth: 0.5,
  },
  optionLabel: {
    fontSize: rf(FONT_SIZES.body),
  },
  actions: {
    flexDirection: 'row',
    gap: rs(SPACING.md),
    marginTop: rs(SPACING.xl),
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: rs(SPACING.md),
    borderRadius: rr(RADIUS.md),
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: rf(FONT_SIZES.body),
    fontWeight: '600',
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: rs(SPACING.sm),
    paddingVertical: rs(SPACING.md),
    borderRadius: rr(RADIUS.md),
    justifyContent: 'center',
    alignItems: 'center',
  },
  printText: {
    color: '#FFF',
    fontSize: rf(FONT_SIZES.body),
    fontWeight: '600',
  },
});
