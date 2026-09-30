import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const ProfileScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="person-circle" size={56} color="#475569" />
      </View>
      <Text style={styles.title}>User Profile</Text>
      <Text style={styles.subtitle}>
        Authentication, personal preferences, and activity history will be integrated in Practical Exam 2.
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>🔒 Coming Soon</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    maxWidth: 320,
  },
  badge: {
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
});
