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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
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
  const { userProfile, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Subscribe to real-time updates from Firestore for this user
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeToTasks(
      user.uid,
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
  }, [user]);

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
  const handleSaveTask = async (taskData: any) => {
    try {
      if (editingTask && editingTask.id) {
        await updateTask(editingTask.id, taskData);
      } else {
        await createTask({
          ...taskData,
          userId: user?.uid,
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

  const userInitial = userProfile?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        {/* App Intro / Header */}
        <View style={styles.header}>
          <View style={styles.headerUserRow}>
            <View style={styles.avatarBubble}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.greetingText}>
                Hello, {userProfile?.name?.split(' ')[0] || 'User'} 👋
              </Text>
              <Text style={styles.appDescription}>
                TaskPulse Workspace
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleOpenCreateModal}
            accessibilityLabel="Create Task"
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>

        {/* Quick KPI Stats Summary Row */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, selectedFilter === 'All' && styles.statCardSelected]}
            onPress={() => setSelectedFilter('All')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#eef2ff' }]}>
              <Ionicons name="layers" size={15} color="#4f46e5" />
            </View>
            <Text style={styles.statCount}>{counts.All}</Text>
            <Text style={styles.statLabel}>All Tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, selectedFilter === 'In Progress' && styles.statCardSelected]}
            onPress={() => setSelectedFilter('In Progress')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="time" size={15} color="#2563eb" />
            </View>
            <Text style={styles.statCount}>{counts['In Progress']}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, selectedFilter === 'Done' && styles.statCardSelected]}
            onPress={() => setSelectedFilter('Done')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="checkmark-done" size={15} color="#059669" />
            </View>
            <Text style={styles.statCount}>{counts.Done}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter Chips */}
        <View style={styles.filterBar}>
          {(['All', 'To Do', 'In Progress', 'Done'] as FilterType[]).map((tab) => {
            const isActive = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setSelectedFilter(tab)}
                activeOpacity={0.7}
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
            <ActivityIndicator size="large" color="#4f46e5" />
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
                colors={['#4f46e5']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="sparkles" size={36} color="#818cf8" />
                </View>
                <Text style={styles.emptyStateTitle}>No Tasks Found</Text>
                <Text style={styles.emptyStateSubtitle}>
                  {selectedFilter === 'All'
                    ? "You're all caught up! Tap '+ Add Task' above to create one!"
                    : `No tasks currently marked as "${selectedFilter}".`}
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
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  headerTextGroup: {
    flex: 1,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  appDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  statCardSelected: {
    borderColor: '#c7d2fe',
    backgroundColor: '#fafafa',
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statCount: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
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
    backgroundColor: '#f1f5f9',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  countTextInactive: {
    color: '#64748b',
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
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 6,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 19,
  },
});
