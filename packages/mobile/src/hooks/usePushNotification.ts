import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../services/NotificationService';
import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export function usePushNotification() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const requestPermission = useCallback(async () => {
    const granted = await NotificationService.requestPermission();
    setHasPermission(granted);
    if (granted) {
      const token = await NotificationService.getToken();
      setFcmToken(token);
    }
    return granted;
  }, []);

  useEffect(() => {
    requestPermission();

    const unsubscribeRefresh = NotificationService.onTokenRefresh(
      (token) => setFcmToken(token),
    );

    return () => {
      unsubscribeRefresh();
    };
  }, [requestPermission]);

  const onNotificationReceived = useCallback(
    (
      callback: (
        message: FirebaseMessagingTypes.RemoteMessage,
      ) => void,
    ) => {
      return NotificationService.onForegroundMessage(callback);
    },
    [],
  );

  return { fcmToken, hasPermission, requestPermission, onNotificationReceived };
}
