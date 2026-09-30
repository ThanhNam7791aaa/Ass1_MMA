import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskPriority, TaskStatus } from '../types/task';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string, title: string) => void;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'Done':
      return { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' };
    case 'In Progress':
      return { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' };
    case 'To Do':
    default:
      return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
  }
};

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'High':
      return { bg: '#ffe4e6', text: '#be123c' };
    case 'Medium':
      return { bg: '#ffedd5', text: '#c2410c' };
    case 'Low':
    default:
      return { bg: '#f1f5f9', text: '#475569' };
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const statusColor = getStatusColor(task.status);
  const priorityColor = getPriorityColor(task.priority);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          {/* Status Badge */}
          <View style={[styles.badge, { backgroundColor: statusColor.bg, borderColor: statusColor.border }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>{task.status}</Text>
          </View>
          {/* Priority Badge */}
          <View style={[styles.badge, { backgroundColor: priorityColor.bg }]}>
            <Text style={[styles.badgeText, { color: priorityColor.text }]}>{task.priority}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onEdit(task)}
            accessibilityLabel="Edit Task"
          >
            <Ionicons name="pencil-outline" size={18} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.deleteButton]}
            onPress={() => task.id && onDelete(task.id, task.title)}
            accessibilityLabel="Delete Task"
          >
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>{task.title}</Text>

      {task.description ? (
        <Text style={styles.description} numberOfLines={3}>
          {task.description}
        </Text>
      ) : null}

      <View style={styles.footer}>
        {task.dueDate ? (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.metaText}>Due: {task.dueDate}</Text>
          </View>
        ) : (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#94a3b8" />
            <Text style={[styles.metaText, { color: '#94a3b8' }]}>No due date</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
});
