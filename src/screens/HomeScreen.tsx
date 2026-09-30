import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskPriority, TaskStatus } from '../types/task';
import {
  subscribeToTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../services/taskService';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';

type FilterType = 'All' | TaskStatus;

export const HomeScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTasks(
      (newTasks) => {
        setTasks(newTasks);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        setLoading(false);
        setRefreshing(false);
        Alert.alert('Database Connection', 'Could not sync real-time tasks. Please verify Firebase settings.');
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    // Real-time listener already syncs, but this satisfies pull-to-refresh UX
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  // Open modal to create a task
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  // Open modal to edit a task
  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  // Save (Create or Update) task
  const handleSaveTask = async (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
  }) => {
    try {
      if (editingTask && editingTask.id) {
        await updateTask(editingTask.id, taskData);
      } else {
        await createTask({
          ...taskData,
          teamId: null,
          assigneeId: null,
        });
      }
    } catch (error: any) {
      console.error('Failed to save task:', error);
      Alert.alert('Error', error?.message || 'Could not save task to Firestore.');
      throw error;
    }
  };

  // Delete task with confirmation dialog
  const handleDeleteTask = (id: string, title: string) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to permanently delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(id);
            } catch (error: any) {
              console.error('Failed to delete task:', error);
              Alert.alert('Error', 'Failed to delete task from Firestore.');
            }
          },
        },
      ]
    );
  };

  // Filter tasks based on selected status
  const filteredTasks = useMemo(() => {
    if (selectedFilter === 'All') return tasks;
    return tasks.filter((t) => t.status === selectedFilter);
  }, [tasks, selectedFilter]);

  // Status counts for filter chips
  const counts = useMemo(() => {
    return {
      All: tasks.length,
      'To Do': tasks.filter((t) => t.status === 'To Do').length,
      'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
      Done: tasks.filter((t) => t.status === 'Done').length,
    };
  }, [tasks]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        {/* App Intro / Header */}
        <View style={styles.header}>
          <View style={styles.headerTextGroup}>
            <Text style={styles.appName}>TaskPulse</Text>
            <Text style={styles.appDescription}>
              Real-time Task Manager powered by React Native & Firebase
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleOpenCreateModal}
            accessibilityLabel="Create Task"
          >
            <Ionicons name="add" size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>New Task</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter Chips (Bonus Feature) */}
        <View style={styles.filterBar}>
          {(['All', 'To Do', 'In Progress', 'Done'] as FilterType[]).map((tab) => {
            const isActive = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(tab)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {tab}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    isActive ? styles.countBadgeActive : styles.countBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isActive ? styles.countTextActive : styles.countTextInactive,
                    ]}
                  >
                    {counts[tab]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Task List Section */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Syncing tasks with Firestore...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={({ item }) => (
              <TaskCard
                task={item}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteTask}
              />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#2563eb']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="clipboard-outline" size={54} color="#cbd5e1" />
                <Text style={styles.emptyStateTitle}>No Tasks Found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  {selectedFilter === 'All'
                    ? "You don't have any tasks yet. Tap '+ New Task' above to create one!"
                    : `No tasks matching the "${selectedFilter}" status.`}
                </Text>
              </View>
            }
          />
        )}

        {/* Create / Edit Modal */}
        <TaskModal
          visible={modalVisible}
          initialTask={editingTask}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveTask}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  appDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeInactive: {
    backgroundColor: '#e2e8f0',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  countTextInactive: {
    color: '#475569',
  },
  countTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 30,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
