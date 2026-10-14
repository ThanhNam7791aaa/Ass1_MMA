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
import { Team, TeamMember } from '../types/team';
import { useAuth } from '../context/AuthContext';
import { subscribeUserTeams, subscribeTeamMembers } from '../services/teamService';

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    teamId?: string | null;
    teamName?: string;
    assigneeId?: string | null;
    assigneeName?: string;
  }) => Promise<void>;
  initialTask?: Task | null;
  preselectedTeamId?: string;
  preselectedTeamName?: string;
}

const STATUS_OPTIONS: TaskStatus[] = ['To Do', 'In Progress', 'Done'];
const PRIORITY_OPTIONS: TaskPriority[] = ['Low', 'Medium', 'High'];

export const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  onClose,
  onSave,
  initialTask,
  preselectedTeamId,
  preselectedTeamName,
}) => {
  const { user } = useAuth();
  const isEditing = !!initialTask;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState('');

  // Teams & Assignees state
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [selectedAssigneeName, setSelectedAssigneeName] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch teams of current user
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeUserTeams(user.uid, (teams) => {
      setUserTeams(teams);
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch members when selected team changes
  useEffect(() => {
    if (!selectedTeamId) {
      setTeamMembers([]);
      return;
    }
    const unsubscribe = subscribeTeamMembers(selectedTeamId, (members) => {
      setTeamMembers(members);
    });
    return () => unsubscribe();
  }, [selectedTeamId]);

  // Populate form on open
  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title || '');
      setDescription(initialTask.description || '');
      setStatus(initialTask.status || 'To Do');
      setPriority(initialTask.priority || 'Medium');
      setDueDate(initialTask.dueDate || '');
      setSelectedTeamId(initialTask.teamId || null);
      setSelectedTeamName(initialTask.teamName || '');
      setSelectedAssigneeId(initialTask.assigneeId || null);
      setSelectedAssigneeName(initialTask.assigneeName || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('To Do');
      setPriority('Medium');
      setDueDate('');

      if (preselectedTeamId) {
        setSelectedTeamId(preselectedTeamId);
        setSelectedTeamName(preselectedTeamName || '');
      } else {
        setSelectedTeamId(null);
        setSelectedTeamName('');
      }

      setSelectedAssigneeId(null);
      setSelectedAssigneeName('');
    }
    setError(null);
  }, [initialTask, visible, preselectedTeamId, preselectedTeamName]);

  const handleSave = async () => {
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
        teamId: selectedTeamId,
        teamName: selectedTeamName,
        assigneeId: selectedAssigneeId,
        assigneeName: selectedAssigneeName,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save task.');
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
                {isEditing ? 'Update task details and assignments' : 'Fill in task details and assign to team/member'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Title <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, error && !title.trim() ? styles.inputError : null]}
                placeholder="e.g. Implement authentication module"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (error) setError(null);
                }}
              />
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes, requirements, checklist..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Team Picker (Exam 2 Requirement) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Team (Workspace)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.chip,
                    selectedTeamId === null && styles.chipActive,
                  ]}
                  onPress={() => {
                    setSelectedTeamId(null);
                    setSelectedTeamName('');
                    setSelectedAssigneeId(null);
                    setSelectedAssigneeName('');
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedTeamId === null && styles.chipTextActive,
                    ]}
                  >
                    No Team (Personal)
                  </Text>
                </TouchableOpacity>

                {userTeams.map((team) => {
                  const isSelected = selectedTeamId === team.id;
                  return (
                    <TouchableOpacity
                      key={team.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => {
                        setSelectedTeamId(team.id);
                        setSelectedTeamName(team.name);
                        setSelectedAssigneeId(null);
                        setSelectedAssigneeName('');
                      }}
                    >
                      <Ionicons
                        name="people"
                        size={14}
                        color={isSelected ? '#ffffff' : '#2563eb'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {team.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Assignee Picker (Exam 2 Requirement) */}
            {selectedTeamId ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Assign To (Team Member)</Text>
                {teamMembers.length === 0 ? (
                  <Text style={styles.subHint}>Loading team members...</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        selectedAssigneeId === null && styles.chipActive,
                      ]}
                      onPress={() => {
                        setSelectedAssigneeId(null);
                        setSelectedAssigneeName('');
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedAssigneeId === null && styles.chipTextActive,
                        ]}
                      >
                        Unassigned
                      </Text>
                    </TouchableOpacity>

                    {teamMembers.map((member) => {
                      const isSelected = selectedAssigneeId === member.userId;
                      return (
                        <TouchableOpacity
                          key={member.id || member.userId}
                          style={[
                            styles.chip,
                            isSelected && styles.chipActiveGreen,
                          ]}
                          onPress={() => {
                            setSelectedAssigneeId(member.userId);
                            setSelectedAssigneeName(member.userName);
                          }}
                        >
                          <Ionicons
                            name="person"
                            size={14}
                            color={isSelected ? '#ffffff' : '#059669'}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextActive,
                            ]}
                          >
                            {member.userName}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            ) : null}

            {/* Status */}
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
                      <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Priority */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.segmentedContainer}>
                {PRIORITY_OPTIONS.map((item) => {
                  const selected = priority === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.segmentButton, selected && styles.segmentButtonActive]}
                      onPress={() => setPriority(item)}
                    >
                      <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2026-10-25"
                placeholderTextColor="#94a3b8"
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
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
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  subHint: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
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
    minHeight: 70,
    paddingTop: 10,
  },
  chipRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipActiveGreen: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
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
