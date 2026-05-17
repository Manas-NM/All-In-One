import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSubjectsStore } from '../store/subjectsStore';
import SubjectForm from '../components/SubjectForm';
import { Subject } from '../types';
import { getNotesCountBySubject } from '../services/database';
import {
  COLORS,
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

export default function SubjectsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const { subjects, loadSubjects, addSubject, updateSubject, deleteSubject } =
    useSubjectsStore();

  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    loadCounts();
  }, [subjects]);

  const loadCounts = async () => {
    const counts: Record<string, number> = {};
    for (const s of subjects) {
      try {
        counts[s.id] = await getNotesCountBySubject(s.id);
      } catch {
        counts[s.id] = 0;
      }
    }
    setNoteCounts(counts);
  };

  const handleSave = async (data: { name: string; color: string; icon: string }) => {
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, data);
      } else {
        await addSubject(data);
      }
      setEditingSubject(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save subject.');
    }
  };

  const handleDelete = (subject: Subject) => {
    Alert.alert(
      'Delete Subject',
      `Delete "${subject.name}"? Notes in this subject won't be deleted, but will be unlinked.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSubject(subject.id),
        },
      ]
    );
  };

  const headerTopPadding = Math.max(insets.top, rs(12)) + rs(8);
  const horizontalPadding = getScreenHorizontalPadding();
  const maxContentWidth = getMaxContentWidth();

  const renderItem = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={[
        styles.subjectRow,
        { backgroundColor: theme.surface, marginHorizontal: horizontalPadding },
      ]}
      onPress={() => {
        setEditingSubject(item);
        setShowForm(true);
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.subjectIcon, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={ri(20)} color="#FFF" />
      </View>
      <View style={styles.subjectInfo}>
        <Text style={[styles.subjectName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.subjectCount, { color: theme.textSecondary }]}>
          {noteCounts[item.id] ?? 0} {(noteCounts[item.id] ?? 0) === 1 ? 'note' : 'notes'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDelete(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={ri(18)} color={theme.textTertiary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: headerTopPadding, paddingHorizontal: horizontalPadding },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={ri(24)} color={COLORS.primary} />
          <Text style={[styles.backText, { color: COLORS.primary }]}>Notes</Text>
        </TouchableOpacity>
        <Text
          style={[styles.title, { color: theme.text }]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          Subjects
        </Text>
      </View>

      {subjects.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: rf(48), marginBottom: rs(16) }}>📂</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No subjects</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Tap + to create your first subject
          </Text>
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingVertical: rs(SPACING.sm),
            paddingBottom: insets.bottom + rs(100),
            alignSelf: 'center',
            width: '100%',
            maxWidth: maxContentWidth,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: COLORS.primary,
            bottom: insets.bottom + rs(24),
          },
        ]}
        onPress={() => {
          setEditingSubject(null);
          setShowForm(true);
        }}
      >
        <Ionicons name="add" size={ri(28)} color="#FFF" />
      </TouchableOpacity>

      <SubjectForm
        visible={showForm}
        subject={editingSubject}
        onClose={() => {
          setShowForm(false);
          setEditingSubject(null);
        }}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: rs(SPACING.md),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: rs(SPACING.xs),
  },
  backText: {
    fontSize: rf(FONT_SIZES.subtitle),
    marginLeft: 2,
  },
  title: {
    fontSize: rf(FONT_SIZES.display),
    fontWeight: '700',
    lineHeight: rf(FONT_SIZES.display) * 1.2,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: rr(RADIUS.lg),
    padding: rs(SPACING.md + 2),
    marginVertical: rs(4),
  },
  subjectIcon: {
    width: ri(40),
    height: ri(40),
    borderRadius: rr(RADIUS.md),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rs(SPACING.md),
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: rf(FONT_SIZES.bodyLarge),
    fontWeight: '600',
  },
  subjectCount: {
    fontSize: rf(FONT_SIZES.small),
    marginTop: rs(2),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: rf(FONT_SIZES.titleLarge),
    fontWeight: '600',
    marginBottom: rs(SPACING.sm),
  },
  emptySubtitle: {
    fontSize: rf(FONT_SIZES.body),
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: rs(20),
    width: ri(56),
    height: ri(56),
    borderRadius: ri(56) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
