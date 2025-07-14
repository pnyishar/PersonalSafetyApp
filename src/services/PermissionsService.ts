import * as ExpoLocation from 'expo-location';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-audio';
import * as ExpoContacts from 'expo-contacts';
import { Permission } from '../types';
import { PERMISSIONS, PERMISSION_MESSAGES } from '../constants';
import { logError } from '../utils';

export class PermissionsService {
  private static instance: PermissionsService;

  private constructor() {}

  public static getInstance(): PermissionsService {
    if (!PermissionsService.instance) {
      PermissionsService.instance = new PermissionsService();
    }
    return PermissionsService.instance;
  }

  /**
   * Check all required permissions
   */
  public async checkAllPermissions(): Promise<Permission[]> {
    const permissions: Permission[] = [];

    try {
      // Location permission
      const locationPermission = await this.checkLocationPermission();
      permissions.push(locationPermission);

      // Camera permission
      const cameraPermission = await this.checkCameraPermission();
      permissions.push(cameraPermission);

      // Microphone permission
      const microphonePermission = await this.checkMicrophonePermission();
      permissions.push(microphonePermission);

      // Contacts permission
      const contactsPermission = await this.checkContactsPermission();
      permissions.push(contactsPermission);

      return permissions;
    } catch (error) {
      logError(error, 'Failed to check permissions');
      return permissions;
    }
  }

  /**
   * Request all required permissions
   */
  public async requestAllPermissions(): Promise<Permission[]> {
    const permissions: Permission[] = [];

    try {
      // Request location permission
      const locationPermission = await this.requestLocationPermission();
      permissions.push(locationPermission);

      // Request camera permission
      const cameraPermission = await this.requestCameraPermission();
      permissions.push(cameraPermission);

      // Request microphone permission
      const microphonePermission = await this.requestMicrophonePermission();
      permissions.push(microphonePermission);

      // Request contacts permission
      const contactsPermission = await this.requestContactsPermission();
      permissions.push(contactsPermission);

      return permissions;
    } catch (error) {
      logError(error, 'Failed to request permissions');
      return permissions;
    }
  }

  /**
   * Check location permission
   */
  public async checkLocationPermission(): Promise<Permission> {
    try {
      const { status, canAskAgain } =
        await ExpoLocation.getForegroundPermissionsAsync();

      return {
        type: PERMISSIONS.LOCATION,
        status: this.mapPermissionStatus(status),
        canAskAgain: canAskAgain ?? true,
      };
    } catch (error) {
      logError(error, 'Failed to check location permission');
      return {
        type: PERMISSIONS.LOCATION,
        status: 'UNDETERMINED',
        canAskAgain: true,
      };
    }
  }

  /**
   * Request location permission
   */
  public async requestLocationPermission(): Promise<Permission> {
    try {
      const { status, canAskAgain } =
        await ExpoLocation.requestForegroundPermissionsAsync();

      return {
        type: PERMISSIONS.LOCATION,
        status: this.mapPermissionStatus(status),
        canAskAgain: canAskAgain ?? true,
      };
    } catch (error) {
      logError(error, 'Failed to request location permission');
      return {
        type: PERMISSIONS.LOCATION,
        status: 'DENIED',
        canAskAgain: false,
      };
    }
  }

  /**
   * Check camera permission
   */
  public async checkCameraPermission(): Promise<Permission> {
    try {
      const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();

      return {
        type: PERMISSIONS.CAMERA,
        status: this.mapPermissionStatus(status),
        canAskAgain: canAskAgain ?? true,
      };
    } catch (error) {
      logError(error, 'Failed to check camera permission');
      return {
        type: PERMISSIONS.CAMERA,
        status: 'UNDETERMINED',
        canAskAgain: true,
      };
    }
  }

  /**
   * Request camera permission
   */
  public async requestCameraPermission(): Promise<Permission> {
    try {
      const { status, canAskAgain } =
        await Camera.requestCameraPermissionsAsync();

      return {
        type: PERMISSIONS.CAMERA,
        status: this.mapPermissionStatus(status),
        canAskAgain: canAskAgain ?? true,
      };
    } catch (error) {
      logError(error, 'Failed to request camera permission');
      return {
        type: PERMISSIONS.CAMERA,
        status: 'DENIED',
        canAskAgain: false,
      };
    }
  }

  /**
   * Check microphone permission
   */
  public async checkMicrophonePermission(): Promise<Permission> {
    try {
      const { status, canAskAgain } = await Audio.getPermissionsAsync();

      return {
        type: PERMISSIONS.MICROPHONE,
        status: this.mapPermissionStatus(status),
        canAskAgain: canAskAgain ?? true,
      };
    } catch (error) {
      logError(error, 'Failed to check microphone permission');
      return {
        type: PERMISSIONS.MICROPHONE,
        status: 'UNDETERMINED',
        canAskAgain: true,
      };
    }
  }

  /**
   * Request microphone permission
   */
  public async requestMicrophonePermission(): Promise<Permission> {
    try {
      const { status, canAskAgain } = await Audio.requestPermissionsAsync();

      return {
        type: PERMISSIONS.MICROPHONE,
        status: this.mapPermissionStatus(status),
        canAskAgain: canAskAgain ?? true,
      };
    } catch (error) {
      logError(error, 'Failed to request microphone permission');
      return {
        type: PERMISSIONS.MICROPHONE,
        status: 'DENIED',
        canAskAgain: false,
      };
    }
  }

  /**
   * Check contacts permission
   */
  public async checkContactsPermission(): Promise<Permission> {
    try {
      const { status, canAskAgain } = await ExpoContacts.getPermissionsAsync();

      return {
        type: PERMISSIONS.CONTACTS,
        status: this.mapPermissionStatus(status),
        canAskAgain: canAskAgain ?? true,
      };
    } catch (error) {
      logError(error, 'Failed to check contacts permission');
      return {
        type: PERMISSIONS.CONTACTS,
        status: 'UNDETERMINED',
        canAskAgain: true,
      };
    }
  }

  /**
   * Request contacts permission
   */
  public async requestContactsPermission(): Promise<Permission> {
    try {
      const { status, canAskAgain } =
        await ExpoContacts.requestPermissionsAsync();

      return {
        type: PERMISSIONS.CONTACTS,
        status: this.mapPermissionStatus(status),
        canAskAgain: canAskAgain ?? true,
      };
    } catch (error) {
      logError(error, 'Failed to request contacts permission');
      return {
        type: PERMISSIONS.CONTACTS,
        status: 'DENIED',
        canAskAgain: false,
      };
    }
  }

  /**
   * Check if specific permission is granted
   */
  public async isPermissionGranted(permissionType: string): Promise<boolean> {
    try {
      switch (permissionType) {
        case PERMISSIONS.LOCATION:
          const locationPerm = await this.checkLocationPermission();
          return locationPerm.status === 'GRANTED';

        case PERMISSIONS.CAMERA:
          const cameraPerm = await this.checkCameraPermission();
          return cameraPerm.status === 'GRANTED';

        case PERMISSIONS.MICROPHONE:
          const micPerm = await this.checkMicrophonePermission();
          return micPerm.status === 'GRANTED';

        case PERMISSIONS.CONTACTS:
          const contactsPerm = await this.checkContactsPermission();
          return contactsPerm.status === 'GRANTED';

        default:
          return false;
      }
    } catch (error) {
      logError(error, `Failed to check permission: ${permissionType}`);
      return false;
    }
  }

  /**
   * Get permission message for user
   */
  public getPermissionMessage(permissionType: string): {
    title: string;
    message: string;
  } {
    return (
      PERMISSION_MESSAGES[
        permissionType as keyof typeof PERMISSION_MESSAGES
      ] || {
        title: 'Permission Required',
        message: 'This app requires permission to function properly.',
      }
    );
  }

  /**
   * Check if all critical permissions are granted
   */
  public async hasCriticalPermissions(): Promise<boolean> {
    const locationGranted = await this.isPermissionGranted(
      PERMISSIONS.LOCATION
    );
    return locationGranted; // Location is the most critical for safety app
  }

  /**
   * Map Expo permission status to our Permission type
   */
  private mapPermissionStatus(status: string): Permission['status'] {
    switch (status) {
      case 'granted':
        return 'GRANTED';
      case 'denied':
        return 'DENIED';
      case 'restricted':
        return 'RESTRICTED';
      default:
        return 'UNDETERMINED';
    }
  }
}

export default PermissionsService.getInstance();
