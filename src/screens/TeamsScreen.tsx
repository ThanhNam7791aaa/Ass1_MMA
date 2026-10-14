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
  SafeAreaView,
} from 'react-native';
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
          <View>
            <Text style={styles.headerTitle}>Teams & Spaces</Text>
            <Text style={styles.headerSubtitle}>
              Collaborate on shared tasks and group chats
            </Text>
          </View>
          <View style={styles.actionButtonGroup}>
            <TouchableOpacity
              style={styles.joinButton}
              onPress={() => setJoinModalVisible(true)}
            >
              <Ionicons name="key-outline" size={16} color="#2563eb" />
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setCreateModalVisible(true)}
            >
              <Ionicons name="add" size={18} color="#ffffff" />
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
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.teamCard}
                onPress={() =>
                  navigation.navigate('TeamDetail', {
                    teamId: item.id,
                    teamName: item.name,
                  })
                }
              >
                <View style={styles.cardHeader}>
                  <View style={styles.teamIconBox}>
                    <Ionicons name="people" size={22} color="#2563eb" />
                  </View>
                  <View style={styles.teamTitleBox}>
                    <Text style={styles.teamCardName}>{item.name}</Text>
                    <Text style={styles.ownerText}>
                      By {item.ownerId === user?.uid ? 'You (Owner)' : item.ownerName || 'Owner'}
                    </Text>
                  </View>
                  <View style={styles.codeBadge}>
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
                    <Text style={styles.footerLinkText}>View Members & Tasks</Text>
                    <Ionicons name="chevron-forward" size={15} color="#2563eb" />
                  </View>
                </View>
              </TouchableOpacity>
            )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    fontSize: 13,
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
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  teamTitleBox: {
    flex: 1,
  },
  teamCardName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  ownerText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  codeBadge: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 1,
  },
  teamCardDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginTop: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
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
    padding: 22,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
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
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 14,
  },
  modalTextArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  codeInput: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
