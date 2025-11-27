import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { RecurringBill } from '../types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }
    
    console.log('Local notifications enabled successfully');
    return true;
  } catch (error) {
    console.log('Error setting up notifications (this is OK in Expo Go - local notifications still work):', error);
    // Return true anyway because local notifications work even if remote setup fails
    return true;
  }
}

export async function scheduleBillNotification(bill: RecurringBill) {
  try {
    // Cancel existing notification for this bill
    await cancelBillNotification(bill.id);

    // Calculate next trigger date
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let triggerDate = new Date(currentYear, currentMonth, bill.dueDay, 9, 0, 0); // 9 AM notification
    
    // If the due day has passed this month, schedule for next month
    if (currentDay >= bill.dueDay) {
      triggerDate = new Date(currentYear, currentMonth + 1, bill.dueDay, 9, 0, 0);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Lembrete de Conta',
        body: `Sua conta "${bill.name}" de R$ ${bill.amount.toFixed(2)} vence hoje!`,
        data: { billId: bill.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    console.log(`Notification scheduled for bill ${bill.name} on day ${bill.dueDay}, ID: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function cancelBillNotification(billId: string) {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.billId === billId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log(`Cancelled notification for bill ${billId}`);
      }
    }
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
}

export async function scheduleAllBillNotifications(bills: RecurringBill[]) {
  for (const bill of bills) {
    if (!bill.isPaid) {
      await scheduleBillNotification(bill);
    }
  }
}
