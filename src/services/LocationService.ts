import * as ExpoLocation from 'expo-location';
import { Location, LocationServiceConfig } from '../types';
import { LOCATION_CONFIG, DISTANCES } from '../constants';
import { isValidLocation, logError, getCurrentTimestamp } from '../utils';

export class LocationService {
  private static instance: LocationService;
  private watchSubscription: ExpoLocation.LocationSubscription | null = null;
  private lastKnownLocation: Location | null = null;
  private locationCallbacks: ((location: Location) => void)[] = [];
  private isTracking = false;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        logError('Location permission denied');
        return false;
      }

      const backgroundStatus =
        await ExpoLocation.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        logError('Background location permission denied');
      }

      return true;
    } catch (error) {
      logError(error, 'Failed to request location permissions');
      return false;
    }
  }

  public async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      logError(error, 'Failed to check location permissions');
      return false;
    }
  }

  public async getCurrentLocation(): Promise<Location | null> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return null;
        }
      }

      const locationData = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
        maximumAge: LOCATION_CONFIG.maximumAge,
        timeout: LOCATION_CONFIG.timeout,
      });

      const location: Location = {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
        timestamp: getCurrentTimestamp(),
        accuracy: locationData.coords.accuracy || undefined,
        altitude: locationData.coords.altitude || undefined,
        speed: locationData.coords.speed || undefined,
      };

      if (isValidLocation(location)) {
        this.lastKnownLocation = location;
        return location;
      }

      return null;
    } catch (error) {
      logError(error, 'Failed to get current location');
      return null;
    }
  }

  public async startLocationTracking(): Promise<boolean> {
    try {
      if (this.isTracking) {
        return true;
      }

      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return false;
        }
      }

      this.watchSubscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.High,
          timeInterval: LOCATION_CONFIG.interval,
          distanceInterval: LOCATION_CONFIG.distanceFilter,
        },
        (locationData) => {
          const location: Location = {
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
            timestamp: getCurrentTimestamp(),
            accuracy: locationData.coords.accuracy || undefined,
            altitude: locationData.coords.altitude || undefined,
            speed: locationData.coords.speed || undefined,
          };

          if (isValidLocation(location)) {
            this.lastKnownLocation = location;
            this.notifyLocationCallbacks(location);
          }
        }
      );

      this.isTracking = true;
      return true;
    } catch (error) {
      logError(error, 'Failed to start location tracking');
      return false;
    }
  }

  public stopLocationTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    this.isTracking = false;
  }

  public subscribeToLocationUpdates(
    callback: (location: Location) => void
  ): () => void {
    this.locationCallbacks.push(callback);

    return () => {
      const index = this.locationCallbacks.indexOf(callback);
      if (index > -1) {
        this.locationCallbacks.splice(index, 1);
      }
    };
  }

  public getLastKnownLocation(): Location | null {
    return this.lastKnownLocation;
  }

  public isLocationTracking(): boolean {
    return this.isTracking;
  }

  public async getDistanceToLocation(
    targetLocation: Location
  ): Promise<number | null> {
    const currentLocation = await this.getCurrentLocation();
    if (!currentLocation || !isValidLocation(targetLocation)) {
      return null;
    }

    const distance = this.calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );

    return distance;
  }

  public hasLocationChanged(
    newLocation: Location,
    threshold = DISTANCES.ROUTE_POINT_INTERVAL
  ): boolean {
    if (!this.lastKnownLocation) {
      return true;
    }

    const distance = this.calculateDistance(
      this.lastKnownLocation.latitude,
      this.lastKnownLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    return distance >= threshold;
  }

  public getLocationAccuracy(location: Location): 'high' | 'medium' | 'low' {
    if (!location.accuracy) {
      return 'low';
    }

    if (location.accuracy <= DISTANCES.ACCURACY_THRESHOLD) {
      return 'high';
    }

    if (location.accuracy <= 50) {
      return 'medium';
    }

    return 'low';
  }

  public createLocationShareUrl(location: Location): string {
    return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  }

  private notifyLocationCallbacks(location: Location): void {
    this.locationCallbacks.forEach((callback) => {
      try {
        callback(location);
      } catch (error) {
        logError(error, 'Error in location callback');
      }
    });
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  public cleanup(): void {
    this.stopLocationTracking();
    this.locationCallbacks = [];
    this.lastKnownLocation = null;
  }
}

export default LocationService.getInstance();
