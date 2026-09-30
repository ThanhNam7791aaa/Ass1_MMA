import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const TeamsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="people" size={48} color="#2563eb" />
      </View>
      <Text style={styles.title}>Teams & Collaboration</Text>
      <Text style={styles.subtitle}>
        Team spaces, task delegation, and role-based assignments will be unlocked in Practical Exam 2.
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>🚀 Coming Soon</Text>
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
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dbeafe',
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
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b45309',
  },
});
