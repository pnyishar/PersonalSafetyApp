import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SOSButton from '../../components/emergency/SOSButton';
import { EmergencyAlert, EmergencyContact, Location } from '../../types';
import { COLORS } from '../../constants';
import { formatTimestamp } from '../../utils';
import LocationService from '../../services/LocationService';
import StorageService from '../../services/StorageService';
import EmergencyService from '../../services/EmergencyService';
import RouteTrackingService from '../../services/RouteTrackingService';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContact[]
  >([]);
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [isRouteTracking, setIsRouteTracking] = useState(false);

  useEffect(() => {
    initializeApp();

    const locationUnsubscribe = LocationService.subscribeToLocationUpdates(
      (location) => {
        setCurrentLocation(location);
      }
    );

    const emergencyUnsubscribe = EmergencyService.subscribeToEmergencyUpdates(
      (alert) => {
        setActiveAlert(alert);
      }
    );

    const routeUnsubscribe = RouteTrackingService.subscribeToRouteUpdates(
      (route) => {
        setIsRouteTracking(route.isActive);
      }
    );

    return () => {
      locationUnsubscribe();
      emergencyUnsubscribe();
      routeUnsubscribe();
    };
  }, []);

  const initializeApp = async () => {
    try {
      const contacts = await StorageService.getEmergencyContacts();
      setEmergencyContacts(contacts.filter((c) => c.isActive));

      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);

      const alert = EmergencyService.getActiveAlert();
      setActiveAlert(alert);

      const isTracking = RouteTrackingService.isRouteTrackingActive();
      setIsRouteTracking(isTracking);
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  const handleEmergencyTriggered = (alert: EmergencyAlert) => {
    setActiveAlert(alert);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'contacts':
        navigation.navigate('Contacts' as never);
        break;
      case 'tracking':
        navigation.navigate('RouteTracking' as never);
        break;
      case 'audio':
        navigation.navigate('Recording' as never, { type: 'audio' } as never);
        break;
      case 'video':
        navigation.navigate('Recording' as never, { type: 'video' } as never);
        break;
      case 'settings':
        navigation.navigate('Settings' as never);
        break;
    }
  };

  const renderLocationStatus = () => (
    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>📍 Location Status</Text>
      {currentLocation ? (
        <View>
          <Text style={styles.statusText}>
            Last updated: {formatTimestamp(currentLocation.timestamp)}
          </Text>
          <Text style={styles.statusSubtext}>
            Accuracy:{' '}
            {currentLocation.accuracy
              ? `${Math.round(currentLocation.accuracy)}m`
              : 'Unknown'}
          </Text>
        </View>
      ) : (
        <Text style={styles.statusError}>Location not available</Text>
      )}
    </View>
  );

  const renderEmergencyStatus = () => {
    if (!activeAlert) return null;

    return (
      <View style={[styles.statusCard, styles.emergencyCard]}>
        <Text style={styles.emergencyTitle}>🚨 Active Emergency</Text>
        <Text style={styles.emergencyText}>
          {activeAlert.type} alert is active
        </Text>
        <Text style={styles.emergencyTime}>
          Started: {formatTimestamp(activeAlert.timestamp)}
        </Text>
        <TouchableOpacity
          style={styles.resolveButton}
          onPress={() => EmergencyService.resolveEmergency(activeAlert.id)}
        >
          <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContactsStatus = () => (
    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>👥 Emergency Contacts</Text>
      <Text style={styles.statusText}>
        {emergencyContacts.length} active contact
        {emergencyContacts.length !== 1 ? 's' : ''}
      </Text>
      {emergencyContacts.length === 0 && (
        <TouchableOpacity
          style={styles.addContactButton}
          onPress={() => handleQuickAction('contacts')}
        >
          <Text style={styles.addContactButtonText}>Add Contacts</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRouteTrackingStatus = () => (
    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>🗺️ Route Tracking</Text>
      {isRouteTracking ? (
        <Text style={[styles.statusText, styles.activeText]}>
          Currently tracking your route
        </Text>
      ) : (
        <Text style={styles.statusText}>Not tracking</Text>
      )}
      <TouchableOpacity
        style={styles.trackingButton}
        onPress={() => handleQuickAction('tracking')}
      >
        <Text style={styles.trackingButtonText}>
          {isRouteTracking ? 'Manage Tracking' : 'Start Tracking'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('audio')}
        >
          <Text style={styles.quickActionIcon}>🎤</Text>
          <Text style={styles.quickActionText}>Record Audio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('video')}
        >
          <Text style={styles.quickActionIcon}>📹</Text>
          <Text style={styles.quickActionText}>Record Video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('tracking')}
        >
          <Text style={styles.quickActionIcon}>🗺️</Text>
          <Text style={styles.quickActionText}>Share Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('contacts')}
        >
          <Text style={styles.quickActionIcon}>👥</Text>
          <Text style={styles.quickActionText}>Contacts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Personal Safety</Text>
          <Text style={styles.subtitle}>Stay safe and connected</Text>
        </View>

        {renderEmergencyStatus()}

        <View style={styles.sosContainer}>
          <SOSButton
            type="SOS"
            size="large"
            onEmergencyTriggered={handleEmergencyTriggered}
            disabled={emergencyContacts.length === 0}
          />
          {emergencyContacts.length === 0 && (
            <Text style={styles.sosWarning}>
              Add emergency contacts to use SOS features
            </Text>
          )}
        </View>

        <View style={styles.statusContainer}>
          {renderLocationStatus()}
          {renderContactsStatus()}
          {renderRouteTrackingStatus()}
        </View>

        {renderQuickActions()}

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>💡 Safety Tips</Text>
          <Text style={styles.infoText}>
            • Keep your emergency contacts updated{'\n'}• Test emergency
            features regularly{'\n'}• Share your location when traveling alone
            {'\n'}• Keep your phone charged{'\n'}• Trust your instincts and stay
            alert
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
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.SURFACE,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.SURFACE,
    opacity: 0.9,
  },
  sosContainer: {
    alignItems: 'center',
    padding: 20,
  },
  sosWarning: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.WARNING,
    textAlign: 'center',
    fontWeight: '500',
  },
  statusContainer: {
    padding: 16,
    gap: 12,
  },
  statusCard: {
    backgroundColor: COLORS.SURFACE,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  emergencyCard: {
    backgroundColor: COLORS.ERROR,
    borderColor: COLORS.ERROR,
    margin: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.SURFACE,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 14,
    color: COLORS.SURFACE,
    marginBottom: 4,
  },
  emergencyTime: {
    fontSize: 12,
    color: COLORS.SURFACE,
    opacity: 0.9,
    marginBottom: 12,
  },
  statusSubtext: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  statusError: {
    fontSize: 14,
    color: COLORS.ERROR,
  },
  activeText: {
    color: COLORS.SUCCESS,
    fontWeight: 'bold',
  },
  addContactButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  addContactButtonText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  trackingButton: {
    backgroundColor: COLORS.SECONDARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  trackingButtonText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  resolveButton: {
    backgroundColor: COLORS.SURFACE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  resolveButtonText: {
    color: COLORS.ERROR,
    fontWeight: 'bold',
    fontSize: 14,
  },
  quickActionsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    minHeight: 80,
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
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

export default HomeScreen;
