import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen: React.FC = () => {
  const { user, userProfile, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

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

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#dc2626" size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
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
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 14,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },
  sectionCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  logoutButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc2626',
  },
});
