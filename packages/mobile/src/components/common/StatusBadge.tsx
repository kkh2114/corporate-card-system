import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../../constants/colors';

interface StatusBadgeProps {
  status: 'approved' | 'rejected' | 'flagged' | 'pending';
}

const statusConfig = {
  approved: { label: '승인', color: colors.success },
  rejected: { label: '거절', color: colors.error },
  flagged: { label: '주의', color: colors.warning },
  pending: { label: '대기', color: colors.disabled },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <Text style={styles.text}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
