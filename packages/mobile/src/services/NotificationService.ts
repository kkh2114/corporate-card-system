import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

export const NotificationService = {
  requestPermission: async (): Promise<boolean> => {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await messaging().getToken();
    } catch {
      return null;
    }
  },

  onTokenRefresh: (callback: (token: string) => void) => {
    return messaging().onTokenRefresh(callback);
  },

  onForegroundMessage: (
    callback: (
      message: FirebaseMessagingTypes.RemoteMessage,
    ) => void,
  ) => {
    return messaging().onMessage(callback);
  },

  onBackgroundMessage: (
    handler: (
      message: FirebaseMessagingTypes.RemoteMessage,
    ) => Promise<void>,
  ) => {
    messaging().setBackgroundMessageHandler(handler);
  },

  onNotificationOpenedApp: (
    callback: (
      message: FirebaseMessagingTypes.RemoteMessage,
    ) => void,
  ) => {
    return messaging().onNotificationOpenedApp(callback);
  },

  getInitialNotification:
    async (): Promise<FirebaseMessagingTypes.RemoteMessage | null> => {
      return messaging().getInitialNotification();
    },
};
