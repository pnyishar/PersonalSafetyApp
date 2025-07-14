import { Alert } from 'react-native';
import StorageService from '../services/StorageService';
import PermissionsService from '../services/PermissionsService';
import LocationService from '../services/LocationService';
import { UserPreferences, EmergencyContact } from '../types';
import { generateId, getCurrentTimestamp } from './index';

/**
 * Initialize the app with default settings and permissions
 */
export const initializeApp = async (): Promise<boolean> => {
  try {
    console.log('Initializing Personal Safety App...');

    // Check and request essential permissions
    await checkPermissions();

    // Initialize user preferences if not exists
    await initializeUserPreferences();

    // Initialize location services
    await initializeLocationServices();

    console.log('App initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize app:', error);
    return false;
  }
};

/**
 * Check and request essential permissions
 */
const checkPermissions = async (): Promise<void> => {
  try {
    const permissions = await PermissionsService.checkAllPermissions();
    
    // Check if location permission is granted
    const locationPermission = permissions.find(p => p.type === 'LOCATION');
    if (locationPermission?.status !== 'GRANTED') {
      console.log('Location permission not granted, will request when needed');
    }

    // Check camera permission for video recording
    const cameraPermission = permissions.find(p => p.type === 'CAMERA');
    if (cameraPermission?.status !== 'GRANTED') {
      console.log('Camera permission not granted, will request when needed');
    }

    // Check microphone permission for audio recording
    const micPermission = permissions.find(p => p.type === 'MICROPHONE');
    if (micPermission?.status !== 'GRANTED') {
      console.log('Microphone permission not granted, will request when needed');
    }
  } catch (error) {
    console.error('Failed to check permissions:', error);
  }
};

/**
 * Initialize user preferences with defaults
 */
const initializeUserPreferences = async (): Promise<void> => {
  try {
    const existingPreferences = await StorageService.getUserPreferences();
    
    if (!existingPreferences) {
      const defaultPreferences = StorageService.getDefaultUserPreferences();
      await StorageService.storeUserPreferences(defaultPreferences);
      console.log('Default user preferences initialized');
    }
  } catch (error) {
    console.error('Failed to initialize user preferences:', error);
  }
};

/**
 * Initialize location services
 */
const initializeLocationServices = async (): Promise<void> => {
  try {
    const hasPermission = await LocationService.hasPermissions();
    if (hasPermission) {
      // Get initial location
      const location = await LocationService.getCurrentLocation();
      if (location) {
        console.log('Initial location obtained:', location);
      }
    }
  } catch (error) {
    console.error('Failed to initialize location services:', error);
  }
};

/**
 * Create sample emergency contacts for testing
 */
export const createSampleContacts = async (): Promise<void> => {
  try {
    const existingContacts = await StorageService.getEmergencyContacts();
    
    if (existingContacts.length === 0) {
      const sampleContacts: EmergencyContact[] = [
        {
          id: generateId(),
          name: 'Emergency Services',
          phoneNumber: '911',
          relationship: 'Emergency Service',
          isPrimary: true,
          isActive: true,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        },
        {
          id: generateId(),
          name: 'Family Contact',
          phoneNumber: '+1234567890',
          email: 'family@example.com',
          relationship: 'Family',
          isPrimary: false,
          isActive: true,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        },
      ];

      for (const contact of sampleContacts) {
        await StorageService.addEmergencyContact(contact);
      }

      console.log('Sample emergency contacts created');
    }
  } catch (error) {
    console.error('Failed to create sample contacts:', error);
  }
};

/**
 * Request essential permissions with user-friendly prompts
 */
export const requestEssentialPermissions = async (): Promise<void> => {
  try {
    // Request location permission
    const locationPermission = await PermissionsService.requestLocationPermission();
    if (locationPermission.status !== 'GRANTED') {
      Alert.alert(
        'Location Permission Required',
        'Location access is essential for emergency features. Please enable it in Settings.',
        [{ text: 'OK' }]
      );
    }

    // Request microphone permission for audio recording
    const micPermission = await PermissionsService.requestMicrophonePermission();
    if (micPermission.status !== 'GRANTED') {
      console.log('Microphone permission denied - audio recording will not be available');
    }

    // Request camera permission for video recording
    const cameraPermission = await PermissionsService.requestCameraPermission();
    if (cameraPermission.status !== 'GRANTED') {
      console.log('Camera permission denied - video recording will not be available');
    }
  } catch (error) {
    console.error('Failed to request permissions:', error);
  }
};

/**
 * Check if the app is properly configured
 */
export const checkAppConfiguration = async (): Promise<{
  hasContacts: boolean;
  hasLocationPermission: boolean;
  hasPreferences: boolean;
}> => {
  try {
    const contacts = await StorageService.getEmergencyContacts();
    const preferences = await StorageService.getUserPreferences();
    const locationPermission = await PermissionsService.isPermissionGranted('LOCATION');

    return {
      hasContacts: contacts.length > 0,
      hasLocationPermission: locationPermission,
      hasPreferences: preferences !== null,
    };
  } catch (error) {
    console.error('Failed to check app configuration:', error);
    return {
      hasContacts: false,
      hasLocationPermission: false,
      hasPreferences: false,
    };
  }
};

/**
 * Reset app data (for testing purposes)
 */
export const resetAppData = async (): Promise<boolean> => {
  try {
    const success = await StorageService.clearAllData();
    if (success) {
      console.log('App data reset successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to reset app data:', error);
    return false;
  }
};
