import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

export const GEOFENCING_TASK = 'BOLSO_DIGITAL_GEOFENCING_TASK';

export type SuggestedGeofence = {
  identifier: string;
  category: string;
  latitude: number;
  longitude: number;
  radius: number;
  transaction_count: number;
  total_amount: number;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask(GEOFENCING_TASK, async ({ data, error }) => {
  if (error) {
    console.log('Erro no geofencing:', error);
    return;
  }

  const { eventType, region } = data as any;

  if (eventType === Location.GeofencingEventType.Enter) {
    const category = region.identifier.split('_')[0];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Despesa futura',
        body: `Você está em uma região onde costuma gastar com ${category}. Deseja registrar uma despesa futura?`,
        data: {
          type: 'future_expense',
          category,
          identifier: region.identifier,
        },
      },
      trigger: null,
    });
  }
});

export class GeofenceService {
  async requestPermissions() {
    const notificationPermission = await Notifications.requestPermissionsAsync();

    if (!notificationPermission.granted) {
      throw new Error('Permissão de notificação negada.');
    }

    const foregroundPermission = await Location.requestForegroundPermissionsAsync();

    if (foregroundPermission.status !== 'granted') {
      throw new Error('Permissão de localização negada.');
    }

    const backgroundPermission = await Location.requestBackgroundPermissionsAsync();

    if (backgroundPermission.status !== 'granted') {
      throw new Error('Permissão de localização em segundo plano negada.');
    }
  }

  async startGeofencing(geofences: SuggestedGeofence[]) {
    await this.requestPermissions();

    if (!geofences.length) {
      return;
    }

    const regions = geofences.slice(0, 20).map((geofence) => ({
      identifier: geofence.identifier,
      latitude: geofence.latitude,
      longitude: geofence.longitude,
      radius: geofence.radius ?? 150,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

    const hasStarted = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);

    if (hasStarted) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
    }

    await Location.startGeofencingAsync(GEOFENCING_TASK, regions);
  }

  async stopGeofencing() {
    const hasStarted = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK);

    if (hasStarted) {
      await Location.stopGeofencingAsync(GEOFENCING_TASK);
    }
  }
}