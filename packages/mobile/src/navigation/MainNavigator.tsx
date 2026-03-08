import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { HomeScreen } from '../screens/home/HomeScreen';
import { UploadScreen } from '../screens/receipt/UploadScreen';
import { ReceiptConfirmScreen } from '../screens/receipt/ReceiptConfirmScreen';
import { ProcessingScreen } from '../screens/receipt/ProcessingScreen';
import { ResultScreen } from '../screens/receipt/ResultScreen';
import { TransactionListScreen } from '../screens/transactions/TransactionListScreen';
import { TransactionDetailScreen } from '../screens/transactions/TransactionDetailScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { colors } from '../constants/colors';
import type {
  MainTabParamList,
  ReceiptStackParamList,
  TransactionStackParamList,
} from '../types/navigation.types';

// Receipt Stack
const ReceiptStack = createNativeStackNavigator<ReceiptStackParamList>();
const ReceiptNavigator: React.FC = () => (
  <ReceiptStack.Navigator>
    <ReceiptStack.Screen
      name="Upload"
      component={UploadScreen}
      options={{ title: '영수증 업로드' }}
    />
    <ReceiptStack.Screen
      name="Confirm"
      component={ReceiptConfirmScreen}
      options={{ title: '영수증 확인', headerBackVisible: false }}
    />
    <ReceiptStack.Screen
      name="Processing"
      component={ProcessingScreen}
      options={{ title: '처리 중', headerBackVisible: false }}
    />
    <ReceiptStack.Screen
      name="Result"
      component={ResultScreen}
      options={{ title: '검증 결과', headerBackVisible: false }}
    />
  </ReceiptStack.Navigator>
);

// Transaction Stack
const TransactionStack =
  createNativeStackNavigator<TransactionStackParamList>();
const TransactionNavigator: React.FC = () => (
  <TransactionStack.Navigator>
    <TransactionStack.Screen
      name="TransactionList"
      component={TransactionListScreen}
      options={{ title: '사용 내역' }}
    />
    <TransactionStack.Screen
      name="TransactionDetail"
      component={TransactionDetailScreen}
      options={{ title: '거래 상세' }}
    />
  </TransactionStack.Navigator>
);

// Bottom Tab
const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.disabled,
        tabBarStyle: {
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: '홈',
          tabBarIcon: ({ color, size }) => (
            <Icon source="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ReceiptTab"
        component={ReceiptNavigator}
        options={{
          tabBarLabel: '영수증',
          tabBarIcon: ({ color, size }) => (
            <Icon source="camera" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TransactionTab"
        component={TransactionNavigator}
        options={{
          tabBarLabel: '내역',
          tabBarIcon: ({ color, size }) => (
            <Icon source="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: '설정',
          tabBarLabel: '설정',
          tabBarIcon: ({ color, size }) => (
            <Icon source="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
