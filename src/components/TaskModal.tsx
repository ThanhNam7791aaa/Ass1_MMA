import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task, TaskPriority, TaskStatus } from '../types/task';

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
  }) => Promise<void>;
  initialTask?: Task | null;
}

const STATUS_OPTIONS: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
const PRIORITY_OPTIONS: TaskPriority[] = ['Low', 'Medium', 'High'];

export const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  onClose,
  onSave,
  initialTask,
}) => {
  const isEditing = !!initialTask;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setStatus(initialTask.status || 'To Do');
      setPriority(initialTask.priority || 'Medium');
      setDueDate(initialTask.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('To Do');
      setPriority('Medium');
      setDueDate('');
    }
    setError(null);
  }, [initialTask, visible]);

  const handleSave = async () => {
    // Client-side validation (Bonus feature requirement)
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        dueDate: dueDate.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {isEditing ? '✏️ Edit Task' : '✨ Create New Task'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {isEditing ? 'Update the details for this task' : 'Fill in the information to add a task'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Error Message */}
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Title <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, error && !title.trim() ? styles.inputError : null]}
                placeholder="e.g. Design app wireframes"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (error) setError(null);
                }}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Optional notes, requirements or context..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Status Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.segmentedContainer}>
                {STATUS_OPTIONS.map((item) => {
                  const selected = status === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.segmentButton, selected && styles.segmentButtonActive]}
                      onPress={() => setStatus(item)}
                    >
                      <Text
                        style={[styles.segmentText, selected && styles.segmentTextActive]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Priority Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.segmentedContainer}>
                {PRIORITY_OPTIONS.map((item) => {
                  const selected = priority === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.segmentButton,
                        selected && styles.segmentButtonActive,
                      ]}
                      onPress={() => setPriority(item)}
                    >
                      <Text
                        style={[styles.segmentText, selected && styles.segmentTextActive]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Due Date Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2026-10-15"
                placeholderTextColor="#94a3b8"
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Save Changes' : 'Create Task'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  formScroll: {
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  textArea: {
    minHeight: 75,
    paddingTop: 10,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 4,
    gap: 6,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
