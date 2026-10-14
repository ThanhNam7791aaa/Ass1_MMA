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
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', dot: '#10b981', accent: '#10b981' };
    case 'In Progress':
      return { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe', dot: '#6366f1', accent: '#6366f1' };
    case 'To Do':
    default:
      return { bg: '#fffbeb', text: '#b45309', border: '#fde68a', dot: '#f59e0b', accent: '#f59e0b' };
  }
};

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'High':
      return { bg: '#fff1f2', text: '#e11d48', icon: 'flame' as const };
    case 'Medium':
      return { bg: '#fff7ed', text: '#ea580c', icon: 'alert-circle-outline' as const };
    case 'Low':
    default:
      return { bg: '#f8fafc', text: '#64748b', icon: 'flag-outline' as const };
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const statusColor = getStatusColor(task.status);
  const priorityInfo = getPriorityColor(task.priority);

  return (
    <View style={[styles.card, { borderLeftColor: statusColor.accent }]}>
      {/* Top Meta: Status & Priority Badges + Actions */}
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          {/* Status Badge with Dot */}
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg, borderColor: statusColor.border }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor.dot }]} />
            <Text style={[styles.statusBadgeText, { color: statusColor.text }]}>{task.status}</Text>
          </View>

          {/* Priority Badge */}
          <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.bg }]}>
            <Ionicons name={priorityInfo.icon} size={12} color={priorityInfo.text} />
            <Text style={[styles.priorityBadgeText, { color: priorityInfo.text }]}>{task.priority}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => onEdit(task)}
            accessibilityLabel="Edit Task"
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={17} color="#4f46e5" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, styles.deleteButton]}
            onPress={() => task.id && onDelete(task.id, task.title)}
            accessibilityLabel="Delete Task"
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={17} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Title */}
      <Text style={styles.title}>{task.title}</Text>

      {/* Optional Description */}
      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {task.description}
        </Text>
      ) : null}

      {/* Exam 2: Team & Assignee Meta Row */}
      <View style={styles.teamAssigneeRow}>
        {task.teamName ? (
          <View style={styles.teamTag}>
            <Ionicons name="people" size={12} color="#4f46e5" />
            <Text style={styles.teamTagText} numberOfLines={1}>
              {task.teamName}
            </Text>
          </View>
        ) : null}

        {task.assigneeName ? (
          <View style={styles.assigneeTag}>
            <Ionicons name="person-circle" size={14} color="#059669" />
            <Text style={styles.assigneeTagText} numberOfLines={1}>
              {task.assigneeName}
            </Text>
          </View>
        ) : (
          <View style={styles.unassignedTag}>
            <Text style={styles.unassignedText}>Unassigned</Text>
          </View>
        )}
      </View>

      {/* Footer: Due Date */}
      <View style={styles.footer}>
        {task.dueDate ? (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color="#64748b" />
            <Text style={styles.metaText}>Due: {task.dueDate}</Text>
          </View>
        ) : (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color="#94a3b8" />
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderLeftWidth: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
    marginBottom: 12,
  },
  teamAssigneeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  teamTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '50%',
  },
  teamTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338ca',
  },
  assigneeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '50%',
  },
  assigneeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  unassignedTag: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unassignedText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
});
