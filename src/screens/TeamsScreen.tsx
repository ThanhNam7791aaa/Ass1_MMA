import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Team } from '../types/team';
import {
  subscribeUserTeams,
  createTeam,
  joinTeamByCode,
} from '../services/teamService';

interface TeamsScreenProps {
  navigation: any;
}

export const TeamsScreen: React.FC<TeamsScreenProps> = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeUserTeams(user.uid, (userTeams) => {
      setTeams(userTeams);
      setLoading(false);
      setRefreshing(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      Alert.alert('Validation', 'Please enter a team name.');
      return;
    }
    if (!userProfile) return;

    try {
      setCreating(true);
      await createTeam(teamName, teamDesc, userProfile);
      setCreateModalVisible(false);
      setTeamName('');
      setTeamDesc('');
      Alert.alert('Success', 'Team created successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create team.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Validation', 'Please enter the 6-character team invite code.');
      return;
    }
    if (!userProfile) return;

    try {
      setJoining(true);
      const joined = await joinTeamByCode(joinCode, userProfile);
      setJoinModalVisible(false);
      setJoinCode('');
      Alert.alert('Welcome!', `You have joined "${joined.name}".`);
    } catch (err: any) {
      Alert.alert('Could Not Join', err?.message || 'Failed to join team.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <Text style={styles.headerTitle}>Teams & Spaces</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Collaborate on shared tasks
            </Text>
          </View>
          <View style={styles.actionButtonGroup}>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => setJoinModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="key-outline" size={14} color="#4f46e5" />
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setCreateModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#ffffff" />
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Teams List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading your teams...</Text>
          </View>
        ) : (
          <FlatList
            data={teams}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => setRefreshing(false)}
                colors={['#2563eb']}
              />
            }
            renderItem={({ item }) => {
              const teamInitials = item.name ? item.name.substring(0, 2).toUpperCase() : 'TM';
              const isOwner = item.ownerId === user?.uid;
              return (
                <TouchableOpacity
                  style={styles.teamCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('TeamDetail', {
                      teamId: item.id,
                      teamName: item.name,
                    })
                  }
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.teamIconBox}>
                      <Text style={styles.teamInitialsText}>{teamInitials}</Text>
                    </View>
                    <View style={styles.teamTitleBox}>
                      <Text style={styles.teamCardName}>{item.name}</Text>
                      <View style={styles.ownerRow}>
                        <View style={[styles.ownerRoleBadge, isOwner ? styles.ownerBadgeRole : styles.memberBadgeRole]}>
                          <Text style={[styles.ownerRoleText, isOwner ? styles.ownerRoleTextOwner : styles.ownerRoleTextMember]}>
                            {isOwner ? 'Owner' : 'Member'}
                          </Text>
                        </View>
                        <Text style={styles.ownerText}>
                          {isOwner ? 'Created by you' : `By ${item.ownerName || 'Admin'}`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.codeBadge}>
                      <Ionicons name="key" size={11} color="#059669" />
                      <Text style={styles.codeText}>{item.code}</Text>
                    </View>
                  </View>

                  {item.description ? (
                    <Text style={styles.teamCardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <View style={styles.footerLink}>
                      <Text style={styles.footerLinkText}>Open Team Workspace</Text>
                      <Ionicons name="arrow-forward" size={14} color="#4f46e5" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={54} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No Teams Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first team workspace or join an existing team with an invite code!
                </Text>
              </View>
            }
          />
        )}

        {/* Create Team Modal */}
        <Modal
          visible={createModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setCreateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>✨ Create Team Workspace</Text>
              <Text style={styles.modalSubtitle}>
                Add members, manage shared tasks and communicate in real-time
              </Text>

              <Text style={styles.inputLabel}>Team Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Mobile Engineering Team"
                placeholderTextColor="#94a3b8"
                value={teamName}
                onChangeText={setTeamName}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Team mission, project goals or department..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={teamDesc}
                onChangeText={setTeamDesc}
              />

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setCreateModalVisible(false)}
                  disabled={creating}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleCreateTeam}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Create Team</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Join Team Modal */}
        <Modal
          visible={joinModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setJoinModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>🔑 Join Existing Team</Text>
              <Text style={styles.modalSubtitle}>
                Enter the 6-character invite code provided by your team owner
              </Text>

              <Text style={styles.inputLabel}>Invite Code *</Text>
              <TextInput
                style={[styles.modalInput, styles.codeInput]}
                placeholder="e.g. PRJ789"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                maxLength={6}
                value={joinCode}
                onChangeText={setJoinCode}
              />

              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setJoinModalVisible(false)}
                  disabled={joining}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleJoinTeam}
                  disabled={joining}
                >
                  {joining ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Join Team</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  joinButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    fontSize: 12,
    fontWeight: '700',
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
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  teamCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  teamInitialsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamTitleBox: {
    flex: 1,
  },
  teamCardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  ownerRoleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  ownerBadgeRole: {
    backgroundColor: '#fef3c7',
  },
  memberBadgeRole: {
    backgroundColor: '#f1f5f9',
  },
  ownerRoleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ownerRoleTextOwner: {
    color: '#b45309',
  },
  ownerRoleTextMember: {
    color: '#64748b',
  },
  ownerText: {
    fontSize: 12,
    color: '#64748b',
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 1,
  },
  teamCardDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 19,
    marginTop: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4f46e5',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 14,
  },
  modalTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  codeInput: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 5,
    textAlign: 'center',
    color: '#4f46e5',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
