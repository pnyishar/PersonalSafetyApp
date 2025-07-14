import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Permission } from '../../types';
import { COLORS, PERMISSION_MESSAGES } from '../../constants';
import PermissionsService from '../../services/PermissionsService';

interface PermissionRequestDialogProps {
  visible: boolean;
  permission: Permission | null;
  onClose: () => void;
  onPermissionGranted: (permission: Permission) => void;
}

const PermissionRequestDialog: React.FC<PermissionRequestDialogProps> = ({
  visible,
  permission,
  onClose,
  onPermissionGranted,
}) => {
  if (!permission) return null;

  const permissionInfo = PERMISSION_MESSAGES[permission.type as keyof typeof PERMISSION_MESSAGES];

  const handleRequestPermission = async () => {
    try {
      let updatedPermission: Permission;

      switch (permission.type) {
        case 'LOCATION':
          updatedPermission = await PermissionsService.requestLocationPermission();
          break;
        case 'CAMERA':
          updatedPermission = await PermissionsService.requestCameraPermission();
          break;
        case 'MICROPHONE':
          updatedPermission = await PermissionsService.requestMicrophonePermission();
          break;
        case 'CONTACTS':
          updatedPermission = await PermissionsService.requestContactsPermission();
          break;
        default:
          onClose();
          return;
      }

      if (updatedPermission.status === 'GRANTED') {
        onPermissionGranted(updatedPermission);
        onClose();
      } else {
        Alert.alert(
          'Permission Denied',
          'This permission is required for the app to function properly. You can enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel', onPress: onClose },
            { text: 'Open Settings', onPress: () => {
              // TODO: Open app settings
              onClose();
            }},
          ]
        );
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      Alert.alert('Error', 'Failed to request permission. Please try again.');
      onClose();
    }
  };

  const getPermissionIcon = () => {
    switch (permission.type) {
      case 'LOCATION':
        return 'location';
      case 'CAMERA':
        return 'camera';
      case 'MICROPHONE':
        return 'mic';
      case 'CONTACTS':
        return 'people';
      default:
        return 'shield-checkmark';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getPermissionIcon()}
                size={40}
                color={COLORS.PRIMARY}
              />
            </View>
            <Text style={styles.title}>{permissionInfo.title}</Text>
          </View>

          <Text style={styles.message}>{permissionInfo.message}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.allowButton]}
              onPress={handleRequestPermission}
            >
              <Text style={styles.allowButtonText}>Allow</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.TEXT_SECONDARY + '20',
  },
  allowButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  allowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.SURFACE,
  },
});

export default PermissionRequestDialog;
