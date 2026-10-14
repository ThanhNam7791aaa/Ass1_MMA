import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { changeUserPassword } from '../services/authService';

export const ProfileScreen: React.FC = () => {
  const { user, userProfile, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  // Password change states
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const handleClosePasswordModal = () => {
    if (changingPass) return;
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Required', 'Please enter your current password.');
      return;
    }
    if (!newPassword) {
      Alert.alert('Required', 'Please enter your new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Validation', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      Alert.alert('Notice', 'New password cannot be the same as your current password.');
      return;
    }

    try {
      setChangingPass(true);
      await changeUserPassword(currentPassword, newPassword);
      handleClosePasswordModal();
      Alert.alert('Success', 'Your password has been changed successfully!');
    } catch (error: any) {
      let message = error?.message || 'Failed to change password.';
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password') {
        message = 'Current password is incorrect. Please try again.';
      } else if (error?.code === 'auth/weak-password') {
        message = 'New password is too weak. Please use at least 6 characters.';
      } else if (error?.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      }
      Alert.alert('Password Change Failed', message);
    } finally {
      setChangingPass(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your TaskPulse account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoggingOut(true);
              await logout();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Failed to sign out.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const displayName = userProfile?.name || user?.displayName || 'User';
  const displayEmail = userProfile?.email || user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>

          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#15803d" />
            <Text style={styles.verifiedText}>Firebase Auth Verified</Text>
          </View>
        </View>

        {/* Account Details Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Account Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="finger-print-outline" size={20} color="#2563eb" />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>User UID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {user?.uid || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="mail-outline" size={20} color="#2563eb" />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{displayEmail}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrapper}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#2563eb" />
            </View>
            <View style={styles.infoTextWrapper}>
              <Text style={styles.infoLabel}>Authentication Mode</Text>
              <Text style={styles.infoValue}>Firebase Email/Password</Text>
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Security & Credentials</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setPasswordModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconWrapper}>
              <Ionicons name="key-outline" size={20} color="#4f46e5" />
            </View>
            <View style={styles.actionTextWrapper}>
              <Text style={styles.actionTitle}>Change Password</Text>
              <Text style={styles.actionSubtitle}>
                Update your account password securely
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          {loggingOut ? (
            <ActivityIndicator color="#e11d48" size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={19} color="#e11d48" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Footer info */}
        <View style={styles.appFooter}>
          <Text style={styles.appFooterText}>TaskPulse • Practical Exam 2</Text>
          <Text style={styles.appFooterSub}>Firebase Auth & Cloud Firestore Real-time</Text>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClosePasswordModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <Ionicons name="key-outline" size={20} color="#4f46e5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <Text style={styles.modalSubtitle}>
                  Update your account password
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClosePasswordModal}
                style={styles.modalCloseBtn}
                disabled={changingPass}
              >
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Current Password */}
            <Text style={styles.inputLabel}>Current Password *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Enter current password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showCurrentPass}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPass(!showCurrentPass)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showCurrentPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <Text style={styles.inputLabel}>New Password *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="At least 6 characters"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showNewPass}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPass(!showNewPass)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showNewPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm New Password */}
            <Text style={styles.inputLabel}>Confirm New Password *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="checkmark-done-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.modalInput}
                placeholder="Re-enter new password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showConfirmPass}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPass(!showConfirmPass)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={handleClosePasswordModal}
                disabled={changingPass}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, changingPass && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={changingPass}
              >
                {changingPass ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 4,
    borderColor: '#e0e7ff',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 14,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  sectionCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f8fafc',
    marginVertical: 4,
  },
  logoutButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e11d48',
  },
  appFooter: {
    alignItems: 'center',
    marginTop: 24,
  },
  appFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  appFooterSub: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextWrapper: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
    borderRadius: 22,
    padding: 24,
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
    marginBottom: 20,
  },
  modalIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
  },
  eyeBtn: {
    padding: 6,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
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
    paddingVertical: 13,
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
