import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';
import { colors } from '../../constants/colors';

interface EmptyStateProps {
  icon: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Icon source={icon} size={64} color={colors.disabled} />
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button mode="outlined" onPress={onAction} style={styles.button}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
  },
});
