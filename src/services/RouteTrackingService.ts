import {
  RouteTracking,
  RoutePoint,
  Location,
  EmergencyContact,
} from '../types';
import { ROUTE_TRACKING, DISTANCES } from '../constants';
import {
  generateId,
  getCurrentTimestamp,
  calculateDistance,
  logError,
} from '../utils';
import LocationService from './LocationService';
import StorageService from './StorageService';

export class RouteTrackingService {
  private static instance: RouteTrackingService;
  private activeRoute: RouteTracking | null = null;
  private trackingInterval: NodeJS.Timeout | null = null;
  private routeCallbacks: ((route: RouteTracking) => void)[] = [];
  private sharingInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): RouteTrackingService {
    if (!RouteTrackingService.instance) {
      RouteTrackingService.instance = new RouteTrackingService();
    }
    return RouteTrackingService.instance;
  }

  /**
   * Start route tracking
   */
  public async startRouteTracking(
    destination?: Location,
    sharedWith: string[] = []
  ): Promise<RouteTracking | null> {
    try {
      // Get current location
      const currentLocation = await LocationService.getCurrentLocation();
      if (!currentLocation) {
        logError('Cannot start route tracking: Location not available');
        return null;
      }

      // Create new route
      const route: RouteTracking = {
        id: generateId(),
        userId: 'current-user',
        startTime: getCurrentTimestamp(),
        isActive: true,
        points: [
          {
            location: currentLocation,
            timestamp: getCurrentTimestamp(),
            isWaypoint: true,
          },
        ],
        totalDistance: 0,
        destination,
        sharedWith,
      };

      this.activeRoute = route;

      // Start location tracking
      await LocationService.startLocationTracking();

      // Subscribe to location updates
      const unsubscribe = LocationService.subscribeToLocationUpdates(
        (location) => {
          this.addLocationToRoute(location);
        }
      );

      // Start sharing updates if contacts are specified
      if (sharedWith.length > 0) {
        this.startSharingUpdates();
      }

      // Auto-stop tracking after timeout
      setTimeout(() => {
        if (this.activeRoute && this.activeRoute.id === route.id) {
          this.stopRouteTracking();
        }
      }, ROUTE_TRACKING.AUTO_STOP_TIMEOUT * 1000);

      this.notifyRouteCallbacks(route);
      return route;
    } catch (error) {
      logError(error, 'Failed to start route tracking');
      return null;
    }
  }

  /**
   * Stop route tracking
   */
  public async stopRouteTracking(): Promise<boolean> {
    try {
      if (!this.activeRoute) {
        return false;
      }

      // Update route end time
      this.activeRoute.endTime = getCurrentTimestamp();
      this.activeRoute.isActive = false;

      // Stop location tracking
      LocationService.stopLocationTracking();

      // Stop sharing updates
      this.stopSharingUpdates();

      // Clear intervals
      if (this.trackingInterval) {
        clearInterval(this.trackingInterval);
        this.trackingInterval = null;
      }

      // Notify contacts that tracking has stopped
      if (this.activeRoute.sharedWith.length > 0) {
        await this.notifyTrackingComplete();
      }

      this.notifyRouteCallbacks(this.activeRoute);
      this.activeRoute = null;

      return true;
    } catch (error) {
      logError(error, 'Failed to stop route tracking');
      return false;
    }
  }

  /**
   * Add location to current route
   */
  private addLocationToRoute(location: Location): void {
    if (!this.activeRoute || !this.activeRoute.isActive) {
      return;
    }

    const lastPoint =
      this.activeRoute.points[this.activeRoute.points.length - 1];

    // Check if location has changed significantly
    const distance = calculateDistance(
      lastPoint.location.latitude,
      lastPoint.location.longitude,
      location.latitude,
      location.longitude
    );

    if (distance >= ROUTE_TRACKING.MIN_DISTANCE_BETWEEN_POINTS) {
      const newPoint: RoutePoint = {
        location,
        timestamp: getCurrentTimestamp(),
      };

      this.activeRoute.points.push(newPoint);
      this.activeRoute.totalDistance += distance;

      // Limit number of points to prevent memory issues
      if (this.activeRoute.points.length > ROUTE_TRACKING.MAX_POINTS_STORED) {
        this.activeRoute.points = this.activeRoute.points.slice(
          -ROUTE_TRACKING.MAX_POINTS_STORED
        );
      }

      this.notifyRouteCallbacks(this.activeRoute);
    }
  }

  /**
   * Add waypoint to route
   */
  public addWaypoint(location?: Location): boolean {
    if (!this.activeRoute || !this.activeRoute.isActive) {
      return false;
    }

    const waypointLocation = location || LocationService.getLastKnownLocation();
    if (!waypointLocation) {
      return false;
    }

    const waypoint: RoutePoint = {
      location: waypointLocation,
      timestamp: getCurrentTimestamp(),
      isWaypoint: true,
    };

    this.activeRoute.points.push(waypoint);
    this.notifyRouteCallbacks(this.activeRoute);

    return true;
  }

  /**
   * Share route with emergency contacts
   */
  public async shareRouteWithContacts(contactIds: string[]): Promise<boolean> {
    try {
      if (!this.activeRoute) {
        return false;
      }

      const contacts = await StorageService.getEmergencyContacts();
      const selectedContacts = contacts.filter(
        (contact) => contactIds.includes(contact.id) && contact.isActive
      );

      if (selectedContacts.length === 0) {
        return false;
      }

      this.activeRoute.sharedWith = contactIds;

      // Send initial route sharing message
      await this.sendRouteShareMessage(selectedContacts, 'started');

      // Start sharing updates
      this.startSharingUpdates();

      this.notifyRouteCallbacks(this.activeRoute);
      return true;
    } catch (error) {
      logError(error, 'Failed to share route with contacts');
      return false;
    }
  }

  /**
   * Stop sharing route
   */
  public async stopSharingRoute(): Promise<boolean> {
    try {
      if (!this.activeRoute || this.activeRoute.sharedWith.length === 0) {
        return false;
      }

      const contacts = await StorageService.getEmergencyContacts();
      const sharedContacts = contacts.filter((contact) =>
        this.activeRoute!.sharedWith.includes(contact.id)
      );

      // Notify contacts that sharing has stopped
      await this.sendRouteShareMessage(sharedContacts, 'stopped');

      this.activeRoute.sharedWith = [];
      this.stopSharingUpdates();

      this.notifyRouteCallbacks(this.activeRoute);
      return true;
    } catch (error) {
      logError(error, 'Failed to stop sharing route');
      return false;
    }
  }

  /**
   * Start sharing updates
   */
  private startSharingUpdates(): void {
    if (this.sharingInterval) {
      clearInterval(this.sharingInterval);
    }

    this.sharingInterval = setInterval(async () => {
      if (this.activeRoute && this.activeRoute.sharedWith.length > 0) {
        await this.sendLocationUpdate();
      }
    }, ROUTE_TRACKING.SHARING_INTERVAL * 1000);
  }

  /**
   * Stop sharing updates
   */
  private stopSharingUpdates(): void {
    if (this.sharingInterval) {
      clearInterval(this.sharingInterval);
      this.sharingInterval = null;
    }
  }

  /**
   * Send location update to shared contacts
   */
  private async sendLocationUpdate(): Promise<void> {
    try {
      if (!this.activeRoute || this.activeRoute.sharedWith.length === 0) {
        return;
      }

      const currentLocation = LocationService.getLastKnownLocation();
      if (!currentLocation) {
        return;
      }

      const contacts = await StorageService.getEmergencyContacts();
      const sharedContacts = contacts.filter((contact) =>
        this.activeRoute!.sharedWith.includes(contact.id)
      );

      const message = this.createLocationUpdateMessage(currentLocation);

      for (const contact of sharedContacts) {
        console.log(`Sending location update to ${contact.name}: ${message}`);
      }
    } catch (error) {
      logError(error, 'Failed to send location update');
    }
  }

  /**
   * Send route share message
   */
  private async sendRouteShareMessage(
    contacts: EmergencyContact[],
    action: 'started' | 'stopped'
  ): Promise<void> {
    try {
      const currentLocation = LocationService.getLastKnownLocation();
      if (!currentLocation) {
        return;
      }

      const message =
        action === 'started'
          ? this.createRouteStartMessage(currentLocation)
          : this.createRouteStopMessage(currentLocation);

      for (const contact of contacts) {
        console.log(
          `Sending route ${action} message to ${contact.name}: ${message}`
        );
      }
    } catch (error) {
      logError(error, `Failed to send route ${action} message`);
    }
  }

  /**
   * Notify tracking complete
   */
  private async notifyTrackingComplete(): Promise<void> {
    try {
      if (!this.activeRoute || this.activeRoute.sharedWith.length === 0) {
        return;
      }

      const contacts = await StorageService.getEmergencyContacts();
      const sharedContacts = contacts.filter((contact) =>
        this.activeRoute!.sharedWith.includes(contact.id)
      );

      await this.sendRouteShareMessage(sharedContacts, 'stopped');
    } catch (error) {
      logError(error, 'Failed to notify tracking complete');
    }
  }

  /**
   * Create route start message
   */
  private createRouteStartMessage(location: Location): string {
    const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    return `I'm sharing my live location with you for safety. Track my route here: ${mapsUrl}`;
  }

  /**
   * Create route stop message
   */
  private createRouteStopMessage(location: Location): string {
    const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    return `I've stopped sharing my location. My final location was: ${mapsUrl}`;
  }

  /**
   * Create location update message
   */
  private createLocationUpdateMessage(location: Location): string {
    const mapsUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const timestamp = new Date(location.timestamp).toLocaleTimeString();
    return `Location update (${timestamp}): ${mapsUrl}`;
  }

  /**
   * Get active route
   */
  public getActiveRoute(): RouteTracking | null {
    return this.activeRoute;
  }

  /**
   * Check if route tracking is active
   */
  public isRouteTrackingActive(): boolean {
    return this.activeRoute !== null && this.activeRoute.isActive;
  }

  /**
   * Get route statistics
   */
  public getRouteStatistics(): {
    duration: number;
    distance: number;
    averageSpeed: number;
    pointsCount: number;
  } | null {
    if (!this.activeRoute) {
      return null;
    }

    const duration = this.activeRoute.endTime
      ? this.activeRoute.endTime - this.activeRoute.startTime
      : getCurrentTimestamp() - this.activeRoute.startTime;

    const durationInHours = duration / (1000 * 60 * 60);
    const averageSpeed =
      durationInHours > 0
        ? this.activeRoute.totalDistance / durationInHours
        : 0;

    return {
      duration: duration / 1000, // in seconds
      distance: this.activeRoute.totalDistance,
      averageSpeed,
      pointsCount: this.activeRoute.points.length,
    };
  }

  /**
   * Subscribe to route updates
   */
  public subscribeToRouteUpdates(
    callback: (route: RouteTracking) => void
  ): () => void {
    this.routeCallbacks.push(callback);

    return () => {
      const index = this.routeCallbacks.indexOf(callback);
      if (index > -1) {
        this.routeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify route callbacks
   */
  private notifyRouteCallbacks(route: RouteTracking): void {
    this.routeCallbacks.forEach((callback) => {
      try {
        callback(route);
      } catch (error) {
        logError(error, 'Error in route callback');
      }
    });
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopRouteTracking();
    this.routeCallbacks = [];
  }
}

export default RouteTrackingService.getInstance();
