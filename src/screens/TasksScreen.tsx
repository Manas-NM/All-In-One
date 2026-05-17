import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTasksStore } from '../store/tasksStore';
import { useSubjectsStore } from '../store/subjectsStore';
import { useNotesStore } from '../store/notesStore';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { Task } from '../types';
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

type FilterTab = 'all' | 'active' | 'completed';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? COLORS.dark : COLORS.light;

  const { tasks, isLoading, loadTasks, toggleTaskComplete, deleteTask } =
    useTasksStore();
  const { subjects, loadSubjects } = useSubjectsStore();
  const { notes, loadNotes } = useNotesStore();

  const [filter, setFilter] = useState<FilterTab>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
      loadSubjects();
      loadNotes();
    }, [])
  );

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  // Sort: active first (by due date asc, then created desc), then completed
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    // Among active: sort by due date (nulls last), then by priority
    if (!a.completed && !b.completed) {
      if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
    }
    return b.createdAt - a.createdAt;
  });

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      'Delete Task',
      `Delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTask(task.id),
        },
      ]
    );
  };

  const handleSaveTask = async (data: any) => {
    try {
      if (editingTask) {
        await useTasksStore.getState().updateTask(editingTask.id, data);
      } else {
        await useTasksStore.getState().addTask({
          ...data,
          completed: false,
        });
      }
      setEditingTask(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to save task.');
    }
  };

  const headerTopPadding = Math.max(insets.top, rs(12)) + rs(8);
  const horizontalPadding = getScreenHorizontalPadding();
  const maxContentWidth = getMaxContentWidth();

  const activeCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: tasks.length },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'completed', label: 'Done', count: completedCount },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: headerTopPadding, paddingHorizontal: horizontalPadding },
        ]}
      >
        <View style={styles.headerTextWrap}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>
            Your Tasks
          </Text>
          <Text
            style={[styles.title, { color: theme.text }]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {activeCount} {activeCount === 1 ? 'task' : 'tasks'} active
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: COLORS.primary }]}
          onPress={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="add" size={ri(24)} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View
        style={[styles.filterRow, { paddingHorizontal: horizontalPadding }]}
      >
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              {
                backgroundColor:
                  filter === tab.key ? COLORS.primary + '15' : 'transparent',
                borderColor:
                  filter === tab.key ? COLORS.primary : theme.border,
              },
            ]}
            onPress={() => setFilter(tab.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                {
                  color:
                    filter === tab.key ? COLORS.primary : theme.textSecondary,
                },
              ]}
            >
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tasks List */}
      {sortedTasks.length === 0 ? (
        <View style={[styles.emptyState, { paddingBottom: insets.bottom + rs(100) }]}>
          <Text style={{ fontSize: rf(48), marginBottom: rs(16) }}>✅</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {filter === 'completed'
              ? 'No completed tasks'
              : filter === 'active'
              ? 'All tasks completed!'
              : 'No tasks yet'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {filter === 'all'
              ? 'Tap the + button to create your first task'
              : 'Switch tabs or add new tasks'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const subject = subjects.find((s) => s.id === item.subjectId);
            const note = notes.find((n) => n.id === item.noteId);
            return (
              <View
                style={{
                  alignSelf: 'center',
                  width: '100%',
                  maxWidth: maxContentWidth,
                }}
              >
                <TaskCard
                  task={item}
                  subject={subject}
                  noteTitle={note?.title}
                  onToggleComplete={() => toggleTaskComplete(item.id)}
                  onPress={() => {
                    setEditingTask(item);
                    setShowForm(true);
                  }}
                  onDelete={() => handleDeleteTask(item)}
                />
              </View>
            );
          }}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + rs(100) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadTasks}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      <TaskForm
        visible={showForm}
        task={editingTask}
        subjects={subjects}
        notes={notes}
        onClose={() => {
          setShowForm(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: rs(SPACING.md),
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: rs(SPACING.md),
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
  addButton: {
    width: ri(44),
    height: ri(44),
    borderRadius: ri(44) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: rs(SPACING.sm),
    marginBottom: rs(SPACING.sm),
  },
  filterTab: {
    borderWidth: 1,
    borderRadius: rr(RADIUS.pill),
    paddingHorizontal: rs(SPACING.md),
    paddingVertical: rs(SPACING.xs + 2),
  },
  filterTabText: {
    fontSize: rf(FONT_SIZES.small),
    fontWeight: '500',
  },
  list: {
    paddingVertical: rs(SPACING.xs),
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
    paddingHorizontal: rs(SPACING.huge),
  },
});
