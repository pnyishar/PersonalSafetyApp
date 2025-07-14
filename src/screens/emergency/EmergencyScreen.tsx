import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import SOSButton from '../../components/emergency/SOSButton';
import { EmergencyAlert, EmergencyType } from '../../types';
import { COLORS, EMERGENCY_TYPES } from '../../constants';
import EmergencyService from '../../services/EmergencyService';
import StorageService from '../../services/StorageService';

const EmergencyScreen: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<EmergencyAlert | null>(null);
  const [hasEmergencyContacts, setHasEmergencyContacts] = useState(false);

  useEffect(() => {
    checkEmergencyContacts();
    checkActiveAlert();

    // Subscribe to emergency updates
    const unsubscribe = EmergencyService.subscribeToEmergencyUpdates(
      (alert) => {
        setActiveAlert(alert);
      }
    );

    return unsubscribe;
  }, []);

  const checkEmergencyContacts = async () => {
    try {
      const contacts = await StorageService.getEmergencyContacts();
      const activeContacts = contacts.filter((contact) => contact.isActive);
      setHasEmergencyContacts(activeContacts.length > 0);
    } catch (error) {
      console.error('Failed to check emergency contacts:', error);
    }
  };

  const checkActiveAlert = () => {
    const alert = EmergencyService.getActiveAlert();
    setActiveAlert(alert);
  };

  const handleEmergencyTriggered = (alert: EmergencyAlert) => {
    setActiveAlert(alert);
    Alert.alert(
      'Emergency Alert Sent',
      `Your ${
        EMERGENCY_TYPES[alert.type].description
      } alert has been sent to your emergency contacts.`,
      [
        {
          text: 'OK',
          onPress: () => {},
        },
        {
          text: 'Resolve Emergency',
          style: 'default',
          onPress: () => handleResolveEmergency(alert.id),
        },
      ]
    );
  };

  const handleEmergencyCancelled = () => {
    setActiveAlert(null);
  };

  const handleResolveEmergency = async (alertId: string) => {
    try {
      const success = await EmergencyService.resolveEmergency(alertId);
      if (success) {
        setActiveAlert(null);
        Alert.alert(
          'Emergency Resolved',
          'Your emergency contacts have been notified that you are safe.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resolve emergency. Please try again.');
    }
  };

  const renderEmergencyButton = (type: EmergencyType) => {
    const emergencyAction = EMERGENCY_TYPES[type];

    return (
      <View key={type} style={styles.buttonContainer}>
        <SOSButton
          type={type}
          size="medium"
          onEmergencyTriggered={handleEmergencyTriggered}
          onEmergencyCancelled={handleEmergencyCancelled}
          disabled={
            !hasEmergencyContacts ||
            (activeAlert !== null && activeAlert.type !== type)
          }
        />
      </View>
    );
  };

  const renderActiveAlert = () => {
    if (!activeAlert) return null;

    const emergencyAction = EMERGENCY_TYPES[activeAlert.type];

    return (
      <View style={styles.activeAlertContainer}>
        <Text style={styles.activeAlertTitle}>
          {emergencyAction.icon} Active Emergency
        </Text>
        <Text style={styles.activeAlertText}>
          {emergencyAction.description} alert is active
        </Text>
        <Text style={styles.activeAlertTime}>
          Started: {new Date(activeAlert.timestamp).toLocaleTimeString()}
        </Text>
        <Text style={styles.activeAlertContacts}>
          Notified: {activeAlert.contactsNotified.length} contacts
        </Text>
      </View>
    );
  };

  const renderNoContactsWarning = () => {
    if (hasEmergencyContacts) return null;

    return (
      <View style={styles.warningContainer}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningTitle}>No Emergency Contacts</Text>
        <Text style={styles.warningText}>
          You need to add emergency contacts before you can use the emergency
          features. Go to the Contacts tab to add your emergency contacts.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.EMERGENCY_RED}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Emergency</Text>
          <Text style={styles.subtitle}>
            Tap and hold any button to trigger an emergency alert
          </Text>
        </View>

        {renderActiveAlert()}
        {renderNoContactsWarning()}

        <View style={styles.mainButtonContainer}>
          <SOSButton
            type="SOS"
            size="large"
            onEmergencyTriggered={handleEmergencyTriggered}
            onEmergencyCancelled={handleEmergencyCancelled}
            disabled={
              !hasEmergencyContacts ||
              (activeAlert !== null && activeAlert.type !== 'SOS')
            }
          />
        </View>

        <View style={styles.secondaryButtonsContainer}>
          <Text style={styles.sectionTitle}>Specific Emergency Types</Text>

          <View style={styles.buttonGrid}>
            {renderEmergencyButton('MEDICAL')}
            {renderEmergencyButton('FIRE')}
            {renderEmergencyButton('POLICE')}
            {renderEmergencyButton('PANIC')}
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            • Tap any emergency button to start a 10-second countdown{'\n'}•
            Your location and emergency message will be sent to all active
            emergency contacts{'\n'}• Emergency services will be called
            automatically for some alert types{'\n'}• You can cancel the alert
            during the countdown period
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
    backgroundColor: COLORS.EMERGENCY_RED,
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
    textAlign: 'center',
    opacity: 0.9,
  },
  activeAlertContainer: {
    backgroundColor: COLORS.WARNING,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeAlertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.SURFACE,
    marginBottom: 8,
  },
  activeAlertText: {
    fontSize: 16,
    color: COLORS.SURFACE,
    marginBottom: 4,
  },
  activeAlertTime: {
    fontSize: 14,
    color: COLORS.SURFACE,
    opacity: 0.9,
    marginBottom: 4,
  },
  activeAlertContacts: {
    fontSize: 14,
    color: COLORS.SURFACE,
    opacity: 0.9,
  },
  warningContainer: {
    backgroundColor: COLORS.WARNING,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.SURFACE,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.SURFACE,
    textAlign: 'center',
    lineHeight: 20,
  },
  mainButtonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  secondaryButtonsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  buttonContainer: {
    margin: 8,
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

export default EmergencyScreen;
