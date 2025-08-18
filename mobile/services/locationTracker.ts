import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { usePersonaStore } from '@/store/slices/personaSlice';

const LOCATION_UPDATE_TASK = 'background-location-task';
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Background task definition
TaskManager.defineTask(LOCATION_UPDATE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Location update error:', error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    const location = locations[0];
    
    if (location) {
      // Update location in store (will also send to server)
      const { updateLocation } = usePersonaStore.getState();
      await updateLocation(location.coords.latitude, location.coords.longitude);
    }
  }
});

export class LocationTracker {
  private static instance: LocationTracker;
  private intervalId: NodeJS.Timeout | null = null;
  
  static getInstance(): LocationTracker {
    if (!LocationTracker.instance) {
      LocationTracker.instance = new LocationTracker();
    }
    return LocationTracker.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission denied');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission denied');
        // Can still work with foreground only
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async startTracking(): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('Location permissions not granted');
      return;
    }

    try {
      // Start background location updates
      const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_UPDATE_TASK);
      
      if (isTaskDefined) {
        await Location.stopLocationUpdatesAsync(LOCATION_UPDATE_TASK);
      }

      await Location.startLocationUpdatesAsync(LOCATION_UPDATE_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: UPDATE_INTERVAL,
        distanceInterval: 100, // Update if moved 100 meters
        foregroundService: {
          notificationTitle: 'Glimpse',
          notificationBody: '위치 기반 서비스 사용 중',
        },
      });

      // Also start foreground updates for when app is active
      this.startForegroundTracking();

      // Update store
      usePersonaStore.getState().setLocationSharing(true);
      
      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }

  private startForegroundTracking(): void {
    // Clear any existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Update immediately
    this.updateCurrentLocation();

    // Set up interval for foreground updates
    this.intervalId = setInterval(() => {
      this.updateCurrentLocation();
    }, UPDATE_INTERVAL);
  }

  private async updateCurrentLocation(): Promise<void> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { updateLocation } = usePersonaStore.getState();
      await updateLocation(location.coords.latitude, location.coords.longitude);
      
      console.log('Location updated:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  async stopTracking(): Promise<void> {
    try {
      // Stop background updates
      const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_UPDATE_TASK);
      if (isTaskDefined) {
        await Location.stopLocationUpdatesAsync(LOCATION_UPDATE_TASK);
      }

      // Stop foreground updates
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }

      // Update store
      usePersonaStore.getState().setLocationSharing(false);
      
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  async isTracking(): Promise<boolean> {
    try {
      const isTaskDefined = await TaskManager.isTaskDefined(LOCATION_UPDATE_TASK);
      if (!isTaskDefined) return false;

      const isRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_UPDATE_TASK);
      return isRunning;
    } catch (error) {
      console.error('Error checking tracking status:', error);
      return false;
    }
  }
}

export const locationTracker = LocationTracker.getInstance();