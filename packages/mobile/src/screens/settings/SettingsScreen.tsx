import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Alert } from 'react-native';
import { Text, Card, Switch, Divider, Button, List } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { formatCurrency, maskCardNumber } from '../../utils/format';

export const SettingsScreen: React.FC = () => {
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [approvalAlert, setApprovalAlert] = useState(true);
  const [rejectionAlert, setRejectionAlert] = useState(true);
  const [limitWarning, setLimitWarning] = useState(true);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>프로필</Text>
          <InfoItem label="이름" value={user?.name ?? '-'} />
          <InfoItem label="사번" value={user?.employeeId ?? '-'} />
          <InfoItem label="부서" value={user?.department ?? '-'} />
          <InfoItem label="이메일" value={user?.email ?? '-'} />
        </Card.Content>
      </Card>

      {/* Notification Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>알림 설정</Text>
          <SwitchItem
            label="푸시 알림"
            value={pushEnabled}
            onToggle={setPushEnabled}
          />
          <SwitchItem
            label="승인 알림"
            value={approvalAlert}
            onToggle={setApprovalAlert}
          />
          <SwitchItem
            label="거절 알림"
            value={rejectionAlert}
            onToggle={setRejectionAlert}
          />
          <SwitchItem
            label="한도 경고"
            value={limitWarning}
            onToggle={setLimitWarning}
          />
        </Card.Content>
      </Card>

      {/* Card Info (placeholder) */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>카드 정보</Text>
          <InfoItem label="카드번호" value={maskCardNumber('1234567890121234')} />
          <InfoItem label="월 한도" value={formatCurrency(2000000)} />
          <InfoItem label="일 한도" value={formatCurrency(300000)} />
          <InfoItem label="건별 한도" value={formatCurrency(200000)} />
        </Card.Content>
      </Card>

      {/* App Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <InfoItem label="버전" value="1.0.0" />
          <List.Item
            title="이용약관"
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
            style={styles.listItem}
          />
          <List.Item
            title="개인정보처리방침"
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor={colors.error}
      >
        로그아웃
      </Button>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const InfoItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={itemStyles.row}>
    <Text style={itemStyles.label}>{label}</Text>
    <Text style={itemStyles.value}>{value}</Text>
  </View>
);

const SwitchItem: React.FC<{
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}> = ({ label, value, onToggle }) => (
  <View style={itemStyles.switchRow}>
    <Text style={itemStyles.switchLabel}>{label}</Text>
    <Switch value={value} onValueChange={onToggle} color={colors.primary} />
  </View>
);

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    margin: 16,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  listItem: {
    paddingLeft: 0,
  },
  logoutButton: {
    margin: 16,
    borderColor: colors.error,
    borderRadius: 8,
  },
  bottomSpacer: {
    height: 32,
  },
});
