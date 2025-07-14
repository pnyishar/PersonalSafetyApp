import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  EmergencyContact,
  UserPreferences,
  Location,
  EmergencyAlert,
} from '../types';
import { STORAGE_KEYS } from '../constants';
import { logError } from '../utils';

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  public async storeUserData(user: User): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      return true;
    } catch (error) {
      logError(error, 'Failed to store user data');
      return false;
    }
  }

  public async getUserData(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      logError(error, 'Failed to get user data');
      return null;
    }
  }

  public async storeEmergencyContacts(
    contacts: EmergencyContact[]
  ): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.EMERGENCY_CONTACTS,
        JSON.stringify(contacts)
      );
      return true;
    } catch (error) {
      logError(error, 'Failed to store emergency contacts');
      return false;
    }
  }

  /**
   * Get emergency contacts
   */
  public async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const contactsData = await AsyncStorage.getItem(
        STORAGE_KEYS.EMERGENCY_CONTACTS
      );
      return contactsData ? JSON.parse(contactsData) : [];
    } catch (error) {
      logError(error, 'Failed to get emergency contacts');
      return [];
    }
  }

  /**
   * Add emergency contact
   */
  public async addEmergencyContact(
    contact: EmergencyContact
  ): Promise<boolean> {
    try {
      const existingContacts = await this.getEmergencyContacts();
      const updatedContacts = [...existingContacts, contact];
      return await this.storeEmergencyContacts(updatedContacts);
    } catch (error) {
      logError(error, 'Failed to add emergency contact');
      return false;
    }
  }

  /**
   * Update emergency contact
   */
  public async updateEmergencyContact(
    contactOrId: EmergencyContact | string,
    updates?: Partial<EmergencyContact>
  ): Promise<boolean> {
    try {
      const existingContacts = await this.getEmergencyContacts();

      if (typeof contactOrId === 'string') {
        // Legacy method: update by ID
        const updatedContacts = existingContacts.map((contact) =>
          contact.id === contactOrId
            ? { ...contact, ...updates, updatedAt: Date.now() }
            : contact
        );
        return await this.storeEmergencyContacts(updatedContacts);
      } else {
        // New method: update with full contact object
        const updatedContact = { ...contactOrId, updatedAt: Date.now() };
        const updatedContacts = existingContacts.map((contact) =>
          contact.id === updatedContact.id ? updatedContact : contact
        );
        return await this.storeEmergencyContacts(updatedContacts);
      }
    } catch (error) {
      logError(error, 'Failed to update emergency contact');
      return false;
    }
  }

  /**
   * Remove emergency contact
   */
  public async removeEmergencyContact(contactId: string): Promise<boolean> {
    try {
      const existingContacts = await this.getEmergencyContacts();
      const updatedContacts = existingContacts.filter(
        (contact) => contact.id !== contactId
      );
      return await this.storeEmergencyContacts(updatedContacts);
    } catch (error) {
      logError(error, 'Failed to remove emergency contact');
      return false;
    }
  }

  /**
   * Store user preferences
   */
  public async storeUserPreferences(
    preferences: UserPreferences
  ): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify(preferences)
      );
      return true;
    } catch (error) {
      logError(error, 'Failed to store user preferences');
      return false;
    }
  }

  /**
   * Get user preferences
   */
  public async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const preferencesData = await AsyncStorage.getItem(
        STORAGE_KEYS.USER_PREFERENCES
      );
      return preferencesData ? JSON.parse(preferencesData) : null;
    } catch (error) {
      logError(error, 'Failed to get user preferences');
      return null;
    }
  }

  /**
   * Get default user preferences
   */
  public getDefaultUserPreferences(): UserPreferences {
    return {
      autoLocationSharing: true,
      emergencyTimeout: 10,
      recordAudioOnSOS: true,
      recordVideoOnSOS: false,
      shareLocationWithContacts: true,
      notificationSound: true,
      vibrationEnabled: true,
      quickDialEnabled: true,
      routeTrackingInterval: 30,
    };
  }

  /**
   * Store location history
   */
  public async storeLocationHistory(locations: Location[]): Promise<boolean> {
    try {
      const limitedLocations = locations.slice(-1000);
      await AsyncStorage.setItem(
        STORAGE_KEYS.LOCATION_HISTORY,
        JSON.stringify(limitedLocations)
      );
      return true;
    } catch (error) {
      logError(error, 'Failed to store location history');
      return false;
    }
  }

  /**
   * Get location history
   */
  public async getLocationHistory(): Promise<Location[]> {
    try {
      const historyData = await AsyncStorage.getItem(
        STORAGE_KEYS.LOCATION_HISTORY
      );
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      logError(error, 'Failed to get location history');
      return [];
    }
  }

  /**
   * Add location to history
   */
  public async addLocationToHistory(location: Location): Promise<boolean> {
    try {
      const existingHistory = await this.getLocationHistory();
      const updatedHistory = [...existingHistory, location];
      return await this.storeLocationHistory(updatedHistory);
    } catch (error) {
      logError(error, 'Failed to add location to history');
      return false;
    }
  }

  /**
   * Store emergency history
   */
  public async storeEmergencyHistory(
    emergencies: EmergencyAlert[]
  ): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.EMERGENCY_HISTORY,
        JSON.stringify(emergencies)
      );
      return true;
    } catch (error) {
      logError(error, 'Failed to store emergency history');
      return false;
    }
  }

  /**
   * Get emergency history
   */
  public async getEmergencyHistory(): Promise<EmergencyAlert[]> {
    try {
      const historyData = await AsyncStorage.getItem(
        STORAGE_KEYS.EMERGENCY_HISTORY
      );
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      logError(error, 'Failed to get emergency history');
      return [];
    }
  }

  /**
   * Add emergency to history
   */
  public async addEmergencyToHistory(
    emergency: EmergencyAlert
  ): Promise<boolean> {
    try {
      const existingHistory = await this.getEmergencyHistory();
      const updatedHistory = [...existingHistory, emergency];
      return await this.storeEmergencyHistory(updatedHistory);
    } catch (error) {
      logError(error, 'Failed to add emergency to history');
      return false;
    }
  }

  /**
   * Clear all stored data
   */
  public async clearAllData(): Promise<boolean> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.EMERGENCY_CONTACTS,
        STORAGE_KEYS.USER_PREFERENCES,
        STORAGE_KEYS.LOCATION_HISTORY,
        STORAGE_KEYS.EMERGENCY_HISTORY,
      ]);
      return true;
    } catch (error) {
      logError(error, 'Failed to clear all data');
      return false;
    }
  }

  /**
   * Get storage usage info
   */
  public async getStorageInfo(): Promise<{ keys: string[]; size: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter((key) => key.startsWith('@PersonalSafety:'));

      // Estimate size (rough calculation)
      let totalSize = 0;
      for (const key of appKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return {
        keys: appKeys,
        size: totalSize,
      };
    } catch (error) {
      logError(error, 'Failed to get storage info');
      return { keys: [], size: 0 };
    }
  }
}

export default StorageService.getInstance();
