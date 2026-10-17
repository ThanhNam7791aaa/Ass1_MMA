import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Team, TeamMember } from '../types/team';
import { Task } from '../types/task';
import {
  subscribeTeamDetails,
  subscribeTeamMembers,
  subscribeTeamTasks,
  updateTeam,
} from '../services/teamService';
import { createTask, updateTask, deleteTask } from '../services/taskService';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { useAuth } from '../context/AuthContext';

interface TeamDetailScreenProps {
  route: any;
  navigation: any;
}

export const TeamDetailScreen: React.FC<TeamDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { teamId, teamName } = route.params;
  const { user } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'members'>('tasks');
  const [loading, setLoading] = useState(true);

  // Task Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Edit Team Modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingTeam, setSavingTeam] = useState(false);

  const handleOpenEditTeam = () => {
    setEditName(team?.name || teamName);
    setEditDesc(team?.description || '');
    setEditModalVisible(true);
  };

  const handleSaveTeam = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter a team name.');
      return;
    }

    try {
      setSavingTeam(true);
      await updateTeam(teamId, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setTeam((prev) =>
        prev
          ? { ...prev, name: editName.trim(), description: editDesc.trim() }
          : null
      );
      setEditModalVisible(false);
      Alert.alert('Success', 'Team information updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update team.');
    } finally {
      setSavingTeam(false);
    }
  };

  useEffect(() => {
    // 1. Subscribe Team Details Real-time
    const unsubTeam = subscribeTeamDetails(teamId, (data) => {
      if (data) setTeam(data);
    });

    // 2. Subscribe Team Members
    const unsubMembers = subscribeTeamMembers(teamId, (teamMembers) => {
      setMembers(teamMembers);
    });

    // 3. Subscribe Team Tasks
    const unsubTasks = subscribeTeamTasks(teamId, (teamTasks) => {
      setTasks(teamTasks);
      setLoading(false);
    });

    return () => {
      unsubTeam();
      unsubMembers();
      unsubTasks();
    };
  }, [teamId]);

  const handleShareCode = async () => {
    if (!team) return;
    try {
      await Share.share({
        message: `Join our team "${team.name}" on TaskPulse using code: ${team.code}`,
      });
    } catch (err: any) {
      Alert.alert('Share', `Team Code: ${team.code}`);
    }
  };

  const handleSaveTask = async (taskData: any) => {
    if (editingTask && editingTask.id) {
      await updateTask(editingTask.id, {
        ...taskData,
        teamId,
        teamName: team?.name || teamName,
      });
    } else {
      await createTask({
        ...taskData,
        userId: user?.uid,
        teamId,
        teamName: team?.name || teamName,
      });
    }
  };

  const handleDeleteTask = (id: string, title: string) => {
    Alert.alert('Delete Task', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTask(id);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>
            {team?.name || teamName}
          </Text>
          <View style={styles.navRightActions}>
            <TouchableOpacity
              onPress={handleOpenEditTeam}
              style={styles.iconActionButton}
              accessibilityLabel="Edit Team"
            >
              <Ionicons name="pencil" size={18} color="#4f46e5" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShareCode}
              style={styles.iconActionButton}
              accessibilityLabel="Share Team Code"
            >
              <Ionicons name="share-outline" size={18} color="#4f46e5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Team Banner Card */}
        <View style={styles.teamBanner}>
          <View style={styles.bannerRow}>
            <View style={styles.teamBadgeCircle}>
              <Ionicons name="people" size={24} color="#4f46e5" />
            </View>
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerName}>{team?.name || teamName}</Text>
              <Text style={styles.bannerDesc} numberOfLines={2}>
                {team?.description || 'No description provided'}
              </Text>
            </View>
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Code</Text>
              <Text style={styles.codeValue}>{team?.code || '------'}</Text>
            </View>
          </View>

          {/* Action Row: Open Team Chat Button */}
          <TouchableOpacity
            style={styles.chatButton}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('Chat', {
                teamId,
                teamName: team?.name || teamName,
              })
            }
          >
            <Ionicons name="chatbubbles" size={18} color="#ffffff" />
            <Text style={styles.chatButtonText}>Open Team Chat Room</Text>
            <Ionicons name="chevron-forward" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Segmented Switch: Tasks vs Members */}
        <View style={styles.tabSwitchContainer}>
          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'tasks' && styles.switchTabActive]}
            onPress={() => setActiveTab('tasks')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="checkbox-outline"
              size={16}
              color={activeTab === 'tasks' ? '#4f46e5' : '#64748b'}
            />
            <Text
              style={[styles.switchTabText, activeTab === 'tasks' && styles.switchTabTextActive]}
            >
              Team Tasks ({tasks.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchTab, activeTab === 'members' && styles.switchTabActive]}
            onPress={() => setActiveTab('members')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="people-outline"
              size={16}
              color={activeTab === 'members' ? '#4f46e5' : '#64748b'}
            />
            <Text
              style={[styles.switchTabText, activeTab === 'members' && styles.switchTabTextActive]}
            >
              Members ({members.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : activeTab === 'tasks' ? (
          <View style={{ flex: 1 }}>
            {/* Create Task Button */}
            <View style={styles.createTaskBar}>
              <Text style={styles.sectionHeaderTitle}>Workspace Tasks</Text>
              <TouchableOpacity
                style={styles.addTaskBtn}
                onPress={() => {
                  setEditingTask(null);
                  setModalVisible(true);
                }}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.addTaskBtnText}>Add Task</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={tasks}
              keyExtractor={(item) => item.id || Math.random().toString()}
              contentContainerStyle={styles.listPad}
              renderItem={({ item }) => (
                <TaskCard
                  task={item}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setModalVisible(true);
                  }}
                  onDelete={handleDeleteTask}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Ionicons name="clipboard-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyTitle}>No tasks for this team yet</Text>
                  <Text style={styles.emptySub}>
                    Tap "+ Add Task" to assign work to members!
                  </Text>
                </View>
              }
            />
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id || item.userId}
            contentContainerStyle={styles.listPad}
            renderItem={({ item }) => (
              <View style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {item.userName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{item.userName}</Text>
                  <Text style={styles.memberEmail}>{item.userEmail}</Text>
                </View>
                <View
                  style={[
                    styles.roleBadge,
                    item.role === 'owner' ? styles.roleBadgeOwner : styles.roleBadgeMember,
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      item.role === 'owner' ? styles.roleTextOwner : styles.roleTextMember,
                    ]}
                  >
                    {item.role.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        {/* Task Creation / Edit Modal */}
        <TaskModal
          visible={modalVisible}
          initialTask={editingTask}
          preselectedTeamId={teamId}
          preselectedTeamName={team?.name || teamName}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveTask}
        />

        {/* Edit Team Modal */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconBox}>
                  <Ionicons name="create-outline" size={20} color="#4f46e5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Edit Team</Text>
                  <Text style={styles.modalSubtitle}>Update team name and description</Text>
                </View>
                <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Team Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter team name"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Team mission or description"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setEditModalVisible(false)}
                  disabled={savingTeam}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSaveBtn, savingTeam && { opacity: 0.6 }]}
                  onPress={handleSaveTeam}
                  disabled={savingTeam}
                >
                  {savingTeam ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    padding: 6,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginLeft: 8,
  },
  navRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionButton: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineEditBtn: {
    padding: 3,
    borderRadius: 6,
    backgroundColor: '#eef2ff',
  },
  teamBanner: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  teamBadgeCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerInfo: {
    flex: 1,
  },
  bannerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  bannerDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  codeContainer: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  codeLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  codeValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: 1,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  switchTabActive: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  switchTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  switchTabTextActive: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  createTaskBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  addTaskBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  listPad: {
    padding: 16,
    paddingBottom: 32,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  memberEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleBadgeOwner: {
    backgroundColor: '#fef3c7',
  },
  roleBadgeMember: {
    backgroundColor: '#f1f5f9',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  roleTextOwner: {
    color: '#b45309',
  },
  roleTextMember: {
    color: '#64748b',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
