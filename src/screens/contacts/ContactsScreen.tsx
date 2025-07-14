import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { EmergencyContact } from '../../types';
import { COLORS } from '../../constants';
import { formatPhoneNumber } from '../../utils';
import StorageService from '../../services/StorageService';

const ContactsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadContacts();
    });

    return unsubscribe;
  }, [navigation]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const emergencyContacts = await StorageService.getEmergencyContacts();
      setContacts(emergencyContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      Alert.alert('Error', 'Failed to load emergency contacts.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = () => {
    navigation.navigate('AddContact' as never);
  };

  const handleContactPress = (contact: EmergencyContact) => {
    navigation.navigate(
      'ContactDetail' as never,
      { contactId: contact.id } as never
    );
  };

  const handleCallContact = async (phoneNumber: string) => {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
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

  const handleToggleContact = async (contactId: string, isActive: boolean) => {
    try {
      const contacts = await StorageService.getEmergencyContacts();
      const contact = contacts.find((c) => c.id === contactId);
      if (!contact) return;

      const updatedContact = { ...contact, isActive: !isActive };
      const success = await StorageService.updateEmergencyContact(
        updatedContact
      );

      if (success) {
        await loadContacts();
      } else {
        Alert.alert('Error', 'Failed to update contact status.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update contact status.');
    }
  };

  const handleDeleteContact = (contact: EmergencyContact) => {
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
                await loadContacts();
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

  const renderContactItem = ({ item: contact }: { item: EmergencyContact }) => (
    <View style={styles.contactItem}>
      <TouchableOpacity
        style={styles.contactInfo}
        onPress={() => handleContactPress(contact)}
      >
        <View style={styles.contactHeader}>
          <Text style={styles.contactName}>{contact.name}</Text>
          {contact.isPrimary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>PRIMARY</Text>
            </View>
          )}
        </View>

        <Text style={styles.contactPhone}>
          {formatPhoneNumber(contact.phoneNumber)}
        </Text>

        <Text style={styles.contactRelationship}>{contact.relationship}</Text>

        {contact.email && (
          <Text style={styles.contactEmail}>{contact.email}</Text>
        )}
      </TouchableOpacity>

      <View style={styles.contactActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => handleCallContact(contact.phoneNumber)}
        >
          <Text style={styles.actionButtonText}>📞</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            contact.isActive ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => handleToggleContact(contact.id, contact.isActive)}
        >
          <Text style={styles.actionButtonText}>
            {contact.isActive ? '✓' : '○'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteContact(contact)}
        >
          <Text style={styles.actionButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
      <Text style={styles.emptyText}>
        Add emergency contacts who will be notified during emergencies. These
        contacts will receive your location and emergency alerts.
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
        <Text style={styles.addButtonText}>Add Your First Contact</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>Emergency Contacts</Text>
        <Text style={styles.subtitle}>
          {contacts.length} contact{contacts.length !== 1 ? 's' : ''} •{' '}
          {contacts.filter((c) => c.isActive).length} active
        </Text>
      </View>
      <TouchableOpacity style={styles.headerButton} onPress={handleAddContact}>
        <Text style={styles.headerButtonText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      {contacts.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>💡 Tips:</Text>
        <Text style={styles.infoText}>
          • Mark your most trusted contact as "Primary"{'\n'}• Keep contact
          information up to date{'\n'}• Test emergency features with trusted
          contacts{'\n'}• Active contacts will receive emergency alerts
        </Text>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  headerButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerButtonText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  contactItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
  },
  contactInfo: {
    flex: 1,
    padding: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: COLORS.SURFACE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  contactPhone: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    marginBottom: 4,
  },
  contactRelationship: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 4,
  },
  contactEmail: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  contactActions: {
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: COLORS.BACKGROUND,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  callButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  activeButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  inactiveButton: {
    backgroundColor: COLORS.TEXT_SECONDARY,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
  },
  actionButtonText: {
    fontSize: 16,
    color: COLORS.SURFACE,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
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

export default ContactsScreen;
