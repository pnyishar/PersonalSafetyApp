import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { EmergencyContact } from '../../types';
import { COLORS } from '../../constants';
import { formatPhoneNumber } from '../../utils';

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  onPress?: () => void;
  onCall?: () => void;
  onToggleActive?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

const EmergencyContactCard: React.FC<EmergencyContactCardProps> = ({
  contact,
  onPress,
  onCall,
  onToggleActive,
  onDelete,
  showActions = true,
  compact = false,
}) => {
  const handleCall = async () => {
    if (onCall) {
      onCall();
      return;
    }

    try {
      const phoneUrl = `tel:${contact.phoneNumber}`;
      const canMakeCall = await Linking.canOpenURL(phoneUrl);
      
      if (canMakeCall) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Unable to make phone calls on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to make phone call');
    }
  };

  const handleSMS = async () => {
    try {
      const smsUrl = `sms:${contact.phoneNumber}`;
      const canSendSMS = await Linking.canOpenURL(smsUrl);
      
      if (canSendSMS) {
        await Linking.openURL(smsUrl);
      } else {
        Alert.alert('Error', 'Unable to send SMS on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send SMS');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !contact.isActive && styles.inactiveContainer,
        compact && styles.compactContainer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <Text style={[styles.name, !contact.isActive && styles.inactiveText]}>
              {contact.name}
            </Text>
            {contact.isPrimary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>PRIMARY</Text>
              </View>
            )}
          </View>
          
          {!contact.isActive && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveLabel}>INACTIVE</Text>
            </View>
          )}
        </View>

        <Text style={[styles.phone, !contact.isActive && styles.inactiveText]}>
          {formatPhoneNumber(contact.phoneNumber)}
        </Text>

        <Text style={[styles.relationship, !contact.isActive && styles.inactiveText]}>
          {contact.relationship}
        </Text>

        {contact.email && !compact && (
          <Text style={[styles.email, !contact.isActive && styles.inactiveText]}>
            {contact.email}
          </Text>
        )}
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCall}
          >
            <Ionicons name="call" size={18} color={COLORS.SURFACE} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.smsButton]}
            onPress={handleSMS}
          >
            <Ionicons name="chatbubble" size={18} color={COLORS.SURFACE} />
          </TouchableOpacity>

          {onToggleActive && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                contact.isActive ? styles.activeButton : styles.inactiveButton,
              ]}
              onPress={onToggleActive}
            >
              <Ionicons
                name={contact.isActive ? 'checkmark-circle' : 'close-circle'}
                size={18}
                color={COLORS.SURFACE}
              />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
            >
              <Ionicons name="trash" size={18} color={COLORS.SURFACE} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    padding: 12,
    marginBottom: 8,
  },
  inactiveContainer: {
    opacity: 0.6,
    borderColor: COLORS.TEXT_SECONDARY + '40',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginRight: 8,
  },
  primaryBadge: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    color: COLORS.SURFACE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  inactiveBadge: {
    backgroundColor: COLORS.TEXT_SECONDARY,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveLabel: {
    color: COLORS.SURFACE,
    fontSize: 10,
    fontWeight: 'bold',
  },
  phone: {
    fontSize: 16,
    color: COLORS.PRIMARY,
    marginBottom: 2,
    fontWeight: '500',
  },
  relationship: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
  },
  inactiveText: {
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  callButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  smsButton: {
    backgroundColor: COLORS.PRIMARY,
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
});

export default EmergencyContactCard;
