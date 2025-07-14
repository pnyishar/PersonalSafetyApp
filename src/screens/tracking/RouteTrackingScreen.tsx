import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { RouteTracking, EmergencyContact } from '../../types';
import { COLORS } from '../../constants';
import { formatDistance, formatDuration } from '../../utils';
import RouteTrackingService from '../../services/RouteTrackingService';
import StorageService from '../../services/StorageService';

const RouteTrackingScreen: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState<RouteTracking | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [routeStats, setRouteStats] = useState<any>(null);

  useEffect(() => {
    loadEmergencyContacts();
    checkActiveRoute();

    // Subscribe to route updates
    const unsubscribe = RouteTrackingService.subscribeToRouteUpdates((route) => {
      setActiveRoute(route);
      setIsTracking(route.isActive);
      updateRouteStats();
    });

    return unsubscribe;
  }, []);

  const loadEmergencyContacts = async () => {
    try {
      const contacts = await StorageService.getEmergencyContacts();
      const activeContacts = contacts.filter(contact => contact.isActive);
      setEmergencyContacts(activeContacts);
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
    }
  };

  const checkActiveRoute = () => {
    const route = RouteTrackingService.getActiveRoute();
    setActiveRoute(route);
    setIsTracking(RouteTrackingService.isRouteTrackingActive());
    if (route) {
      setSelectedContacts(route.sharedWith);
      updateRouteStats();
    }
  };

  const updateRouteStats = () => {
    const stats = RouteTrackingService.getRouteStatistics();
    setRouteStats(stats);
  };

  const handleStartTracking = async () => {
    try {
      const route = await RouteTrackingService.startRouteTracking(
        undefined,
        selectedContacts
      );
      
      if (route) {
        setActiveRoute(route);
        setIsTracking(true);
        Alert.alert(
          'Route Tracking Started',
          'Your location is now being tracked and shared with selected contacts.'
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to start route tracking. Please check your location permissions.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start route tracking.');
    }
  };

  const handleStopTracking = async () => {
    Alert.alert(
      'Stop Route Tracking',
      'Are you sure you want to stop tracking your route?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Stop',
          style: 'destructive',
          onPress: async () => {
            const success = await RouteTrackingService.stopRouteTracking();
            if (success) {
              setActiveRoute(null);
              setIsTracking(false);
              setSelectedContacts([]);
              Alert.alert('Route Tracking Stopped', 'Your contacts have been notified.');
            }
          },
        },
      ]
    );
  };

  const handleContactToggle = (contactId: string) => {
    if (isTracking) return; // Can't change contacts while tracking

    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const renderContactSelector = () => {
    if (emergencyContacts.length === 0) {
      return (
        <View style={styles.noContactsContainer}>
          <Text style={styles.noContactsText}>
            No emergency contacts available. Add contacts in the Contacts tab to share your route.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contactsContainer}>
        <Text style={styles.sectionTitle}>Share with Emergency Contacts</Text>
        {emergencyContacts.map(contact => (
          <TouchableOpacity
            key={contact.id}
            style={[
              styles.contactItem,
              selectedContacts.includes(contact.id) && styles.contactItemSelected,
              isTracking && styles.contactItemDisabled,
            ]}
            onPress={() => handleContactToggle(contact.id)}
            disabled={isTracking}
          >
            <View style={styles.contactInfo}>
              <Text style={[
                styles.contactName,
                selectedContacts.includes(contact.id) && styles.contactNameSelected,
              ]}>
                {contact.name}
              </Text>
              <Text style={[
                styles.contactPhone,
                selectedContacts.includes(contact.id) && styles.contactPhoneSelected,
              ]}>
                {contact.phoneNumber}
              </Text>
            </View>
            <View style={[
              styles.checkbox,
              selectedContacts.includes(contact.id) && styles.checkboxSelected,
            ]}>
              {selectedContacts.includes(contact.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderRouteStats = () => {
    if (!routeStats || !activeRoute) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Route Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDuration(routeStats.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDistance(routeStats.distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{routeStats.pointsCount}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeRoute.sharedWith.length}</Text>
            <Text style={styles.statLabel}>Shared With</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Route Tracking</Text>
          <Text style={styles.subtitle}>
            Share your live location with emergency contacts
          </Text>
        </View>

        {isTracking && (
          <View style={styles.activeTrackingContainer}>
            <Text style={styles.activeTrackingTitle}>🔴 Live Tracking Active</Text>
            <Text style={styles.activeTrackingText}>
              Your location is being shared with {selectedContacts.length} contacts
            </Text>
          </View>
        )}

        {renderRouteStats()}
        {renderContactSelector()}

        <View style={styles.buttonContainer}>
          {!isTracking ? (
            <TouchableOpacity
              style={[
                styles.button,
                styles.startButton,
                selectedContacts.length === 0 && styles.buttonDisabled,
              ]}
              onPress={handleStartTracking}
              disabled={selectedContacts.length === 0}
            >
              <Text style={styles.buttonText}>Start Route Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={handleStopTracking}
            >
              <Text style={styles.buttonText}>Stop Tracking</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How Route Tracking Works:</Text>
          <Text style={styles.infoText}>
            • Select emergency contacts to share your location with{'\n'}
            • Your live location will be sent to them via SMS{'\n'}
            • Updates are sent every 30 seconds while tracking is active{'\n'}
            • Contacts will be notified when you stop tracking{'\n'}
            • Tracking automatically stops after 1 hour for battery conservation
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
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.SURFACE,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.SURFACE,
    textAlign: 'center',
    opacity: 0.9,
  },
  activeTrackingContainer: {
    backgroundColor: COLORS.SUCCESS,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTrackingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.SURFACE,
    marginBottom: 8,
  },
  activeTrackingText: {
    fontSize: 14,
    color: COLORS.SURFACE,
    textAlign: 'center',
  },
  statsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },
  contactsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  contactItemSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  contactItemDisabled: {
    opacity: 0.6,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  contactNameSelected: {
    color: COLORS.SURFACE,
  },
  contactPhone: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  contactPhoneSelected: {
    color: COLORS.SURFACE,
    opacity: 0.9,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.SURFACE,
    borderColor: COLORS.SURFACE,
  },
  checkmark: {
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
    fontSize: 16,
  },
  noContactsContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.WARNING,
    borderRadius: 12,
    alignItems: 'center',
  },
  noContactsText: {
    color: COLORS.SURFACE,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    margin: 16,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  stopButton: {
    backgroundColor: COLORS.ERROR,
  },
  buttonDisabled: {
    backgroundColor: COLORS.TEXT_SECONDARY,
    opacity: 0.6,
  },
  buttonText: {
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

export default RouteTrackingScreen;
