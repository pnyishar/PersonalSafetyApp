import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { UserPreferences, Permission } from '../../types';
import { COLORS, TIMEOUTS } from '../../constants';
import StorageService from '../../services/StorageService';
import PermissionsService from '../../services/PermissionsService';

const SettingsScreen: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load user preferences
      let userPrefs = await StorageService.getUserPreferences();
      if (!userPrefs) {
        userPrefs = StorageService.getDefaultUserPreferences();
        await StorageService.storeUserPreferences(userPrefs);
      }
      setPreferences(userPrefs);

      // Check permissions
      const perms = await PermissionsService.checkAllPermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;

    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);
    
    const success = await StorageService.storeUserPreferences(updatedPreferences);
    if (!success) {
      Alert.alert('Error', 'Failed to save preferences.');
      // Revert the change
      setPreferences(preferences);
    }
  };

  const handleRequestPermission = async (permissionType: string) => {
    try {
      let permission: Permission;
      
      switch (permissionType) {
        case 'LOCATION':
          permission = await PermissionsService.requestLocationPermission();
          break;
        case 'CAMERA':
          permission = await PermissionsService.requestCameraPermission();
          break;
        case 'MICROPHONE':
          permission = await PermissionsService.requestMicrophonePermission();
          break;
        case 'CONTACTS':
          permission = await PermissionsService.requestContactsPermission();
          break;
        default:
          return;
      }

      // Update permissions state
      setPermissions(prev => 
        prev.map(p => p.type === permissionType ? permission : p)
      );

      if (permission.status === 'GRANTED') {
        Alert.alert('Permission Granted', 'Permission has been granted successfully.');
      } else {
        Alert.alert('Permission Denied', 'Permission was not granted.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request permission.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your emergency contacts, preferences, and stored data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            const success = await StorageService.clearAllData();
            if (success) {
              Alert.alert('Data Cleared', 'All data has been cleared successfully.');
              loadSettings(); // Reload with defaults
            } else {
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  const renderPermissionItem = (permission: Permission) => {
    const permissionInfo = PermissionsService.getPermissionMessage(permission.type);
    const isGranted = permission.status === 'GRANTED';
    
    return (
      <View key={permission.type} style={styles.settingItem}>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{permissionInfo.title}</Text>
          <Text style={styles.settingSubtitle}>{permissionInfo.message}</Text>
          <Text style={[
            styles.permissionStatus,
            isGranted ? styles.permissionGranted : styles.permissionDenied,
          ]}>
            {permission.status}
          </Text>
        </View>
        {!isGranted && permission.canAskAgain && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => handleRequestPermission(permission.type)}
          >
            <Text style={styles.permissionButtonText}>Grant</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderToggleSetting = (
    key: keyof UserPreferences,
    title: string,
    subtitle: string,
    value: boolean
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => updatePreference(key, newValue)}
        trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY }}
        thumbColor={value ? COLORS.SURFACE : COLORS.TEXT_SECONDARY}
      />
    </View>
  );

  const renderNumberSetting = (
    key: keyof UserPreferences,
    title: string,
    subtitle: string,
    value: number,
    options: number[]
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.numberOptions}>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.numberOption,
              value === option && styles.numberOptionSelected,
            ]}
            onPress={() => updatePreference(key, option)}
          >
            <Text style={[
              styles.numberOptionText,
              value === option && styles.numberOptionTextSelected,
            ]}>
              {option}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading || !preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Configure your safety preferences</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permissions</Text>
          {permissions.map(renderPermissionItem)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Settings</Text>
          
          {renderToggleSetting(
            'autoLocationSharing',
            'Auto Location Sharing',
            'Automatically share location during emergencies',
            preferences.autoLocationSharing
          )}

          {renderNumberSetting(
            'emergencyTimeout',
            'Emergency Countdown',
            'Seconds before emergency alert is sent',
            preferences.emergencyTimeout,
            [5, 10, 15, 30]
          )}

          {renderToggleSetting(
            'recordAudioOnSOS',
            'Auto Audio Recording',
            'Automatically record audio during SOS alerts',
            preferences.recordAudioOnSOS
          )}

          {renderToggleSetting(
            'recordVideoOnSOS',
            'Auto Video Recording',
            'Automatically record video during SOS alerts',
            preferences.recordVideoOnSOS
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Tracking</Text>
          
          {renderToggleSetting(
            'shareLocationWithContacts',
            'Share Location with Contacts',
            'Allow emergency contacts to see your location',
            preferences.shareLocationWithContacts
          )}

          {renderNumberSetting(
            'routeTrackingInterval',
            'Route Update Interval',
            'How often to send location updates during tracking',
            preferences.routeTrackingInterval,
            [15, 30, 60, 120]
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {renderToggleSetting(
            'notificationSound',
            'Notification Sound',
            'Play sound for emergency notifications',
            preferences.notificationSound
          )}

          {renderToggleSetting(
            'vibrationEnabled',
            'Vibration',
            'Vibrate for emergency alerts and notifications',
            preferences.vibrationEnabled
          )}

          {renderToggleSetting(
            'quickDialEnabled',
            'Quick Dial',
            'Enable quick dial for emergency services',
            preferences.quickDialEnabled
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
            <Text style={styles.dangerButtonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>ℹ️ About</Text>
          <Text style={styles.infoText}>
            Personal Safety App v1.0.0{'\n'}
            Designed to keep you safe and connected with your emergency contacts.{'\n\n'}
            For support or feedback, please contact us through the app store.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.SURFACE,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.SURFACE,
    opacity: 0.9,
  },
  section: {
    margin: 16,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    padding: 16,
    backgroundColor: COLORS.BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  permissionStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  permissionGranted: {
    color: COLORS.SUCCESS,
  },
  permissionDenied: {
    color: COLORS.ERROR,
  },
  permissionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  numberOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  numberOption: {
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  numberOptionSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  numberOptionText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: 'bold',
  },
  numberOptionTextSelected: {
    color: COLORS.SURFACE,
  },
  dangerButton: {
    backgroundColor: COLORS.ERROR,
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: COLORS.SURFACE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
  },
});

export default SettingsScreen;
