import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EmergencyContact } from '../../types';
import { COLORS } from '../../constants';
import { formatPhoneNumber, formatTimestamp } from '../../utils';
import StorageService from '../../services/StorageService';

const ContactDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { contactId } = route.params as { contactId: string };

  const [contact, setContact] = useState<EmergencyContact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const contacts = await StorageService.getEmergencyContacts();
      const foundContact = contacts.find((c) => c.id === contactId);
      setContact(foundContact || null);
    } catch (error) {
      console.error('Failed to load contact:', error);
      Alert.alert('Error', 'Failed to load contact details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async () => {
    if (!contact) return;

    try {
      const phoneUrl = `tel:${contact.phoneNumber}`;
      const canMakeCall = await Linking.canOpenURL(phoneUrl);

      if (canMakeCall) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Unable to make phone calls on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to make phone call.');
    }
  };

  const handleSendMessage = async () => {
    if (!contact) return;

    try {
      const smsUrl = `sms:${contact.phoneNumber}`;
      const canSendSMS = await Linking.canOpenURL(smsUrl);

      if (canSendSMS) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Error', 'Unable to send messages on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open messaging app.');
    }
  };

  const handleSendEmail = async () => {
    if (!contact || !contact.email) return;

    try {
      const emailUrl = `mailto:${contact.email}`;
      const canSendEmail = await Linking.canOpenURL(emailUrl);

      if (canSendEmail) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'Unable to send emails on this device.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open email app.');
    }
  };

  const handleToggleActive = async () => {
    if (!contact) return;

    try {
      const success = await StorageService.updateEmergencyContact(contact.id, {
        isActive: !contact.isActive,
      });

      if (success) {
        setContact((prev) =>
          prev ? { ...prev, isActive: !prev.isActive } : null
        );
        Alert.alert(
          'Contact Updated',
          `${contact.name} is now ${!contact.isActive ? 'active' : 'inactive'}.`
        );
      } else {
        Alert.alert('Error', 'Failed to update contact status.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update contact status.');
    }
  };

  const handleTogglePrimary = async () => {
    if (!contact) return;

    try {
      // If setting as primary, remove primary from other contacts
      if (!contact.isPrimary) {
        const contacts = await StorageService.getEmergencyContacts();
        const currentPrimary = contacts.find(
          (c) => c.isPrimary && c.id !== contact.id
        );

        if (currentPrimary) {
          await StorageService.updateEmergencyContact(currentPrimary.id, {
            isPrimary: false,
          });
        }
      }

      const success = await StorageService.updateEmergencyContact(contact.id, {
        isPrimary: !contact.isPrimary,
      });

      if (success) {
        setContact((prev) =>
          prev ? { ...prev, isPrimary: !prev.isPrimary } : null
        );
        Alert.alert(
          'Contact Updated',
          `${contact.name} is ${
            !contact.isPrimary ? 'now' : 'no longer'
          } your primary contact.`
        );
      } else {
        Alert.alert('Error', 'Failed to update contact status.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update contact status.');
    }
  };

  const handleDelete = () => {
    if (!contact) return;

    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name} from your emergency contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await StorageService.removeEmergencyContact(
                contact.id
              );
              if (success) {
                Alert.alert(
                  'Contact Deleted',
                  `${contact.name} has been removed from your emergency contacts.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } else {
                Alert.alert('Error', 'Failed to delete contact.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading contact...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!contact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Contact not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <View style={styles.badges}>
              {contact.isPrimary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                </View>
              )}
              <View
                style={[
                  styles.statusBadge,
                  contact.isActive ? styles.activeBadge : styles.inactiveBadge,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {contact.isActive ? 'ACTIVE' : 'INACTIVE'}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.relationship}>{contact.relationship}</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCall}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton]}
            onPress={handleSendMessage}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionText}>Message</Text>
          </TouchableOpacity>

          {contact.email && (
            <TouchableOpacity
              style={[styles.actionButton, styles.emailButton]}
              onPress={handleSendEmail}
            >
              <Text style={styles.actionIcon}>📧</Text>
              <Text style={styles.actionText}>Email</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Phone Number</Text>
            <Text style={styles.detailValue}>
              {formatPhoneNumber(contact.phoneNumber)}
            </Text>
          </View>

          {contact.email && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{contact.email}</Text>
            </View>
          )}

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Relationship</Text>
            <Text style={styles.detailValue}>{contact.relationship}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Added</Text>
            <Text style={styles.detailValue}>
              {formatTimestamp(contact.createdAt)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Last Updated</Text>
            <Text style={styles.detailValue}>
              {formatTimestamp(contact.updatedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleToggleActive}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Active Contact</Text>
              <Text style={styles.settingSubtitle}>
                Receive emergency alerts and location updates
              </Text>
            </View>
            <View
              style={[styles.toggle, contact.isActive && styles.toggleActive]}
            >
              <Text style={styles.toggleText}>
                {contact.isActive ? 'ON' : 'OFF'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleTogglePrimary}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Primary Contact</Text>
              <Text style={styles.settingSubtitle}>
                First contact to be notified during emergencies
              </Text>
            </View>
            <View
              style={[styles.toggle, contact.isPrimary && styles.toggleActive]}
            >
              <Text style={styles.toggleText}>
                {contact.isPrimary ? 'ON' : 'OFF'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Contact</Text>
        </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.ERROR,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
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
  contactHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.SURFACE,
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryBadge: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBadgeText: {
    color: COLORS.SURFACE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: COLORS.SUCCESS,
  },
  inactiveBadge: {
    backgroundColor: COLORS.TEXT_SECONDARY,
  },
  statusBadgeText: {
    color: COLORS.SURFACE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  relationship: {
    fontSize: 18,
    color: COLORS.SURFACE,
    opacity: 0.9,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    minWidth: 80,
  },
  callButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  messageButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  emailButton: {
    backgroundColor: COLORS.SECONDARY,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  settingsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
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
  toggle: {
    backgroundColor: COLORS.TEXT_SECONDARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.SUCCESS,
  },
  toggleText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteButton: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.ERROR,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.SURFACE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ContactDetailScreen;
