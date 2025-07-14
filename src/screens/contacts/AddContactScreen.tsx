import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { EmergencyContact } from '../../types';
import { COLORS, CONTACT_RELATIONSHIPS } from '../../constants';
import { generateId, getCurrentTimestamp, isValidPhoneNumber, isValidEmail } from '../../utils';
import StorageService from '../../services/StorageService';

const AddContactScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    relationship: CONTACT_RELATIONSHIPS[0],
    isPrimary: false,
  });
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Name is required';
    }

    if (!formData.phoneNumber.trim()) {
      return 'Phone number is required';
    }

    if (!isValidPhoneNumber(formData.phoneNumber)) {
      return 'Please enter a valid phone number';
    }

    if (formData.email && !isValidEmail(formData.email)) {
      return 'Please enter a valid email address';
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    try {
      setSaving(true);

      // Check if this will be the first contact (auto-primary)
      const existingContacts = await StorageService.getEmergencyContacts();
      const isPrimary = formData.isPrimary || existingContacts.length === 0;

      // If setting as primary, update existing primary contact
      if (isPrimary && existingContacts.length > 0) {
        const currentPrimary = existingContacts.find(c => c.isPrimary);
        if (currentPrimary) {
          await StorageService.updateEmergencyContact(currentPrimary.id, {
            isPrimary: false,
          });
        }
      }

      const newContact: EmergencyContact = {
        id: generateId(),
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim() || undefined,
        relationship: formData.relationship,
        isPrimary,
        isActive: true,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      };

      const success = await StorageService.addEmergencyContact(newContact);

      if (success) {
        Alert.alert(
          'Contact Added',
          `${newContact.name} has been added to your emergency contacts.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to add emergency contact. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add contact:', error);
      Alert.alert('Error', 'Failed to add emergency contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderRelationshipPicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Relationship</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.relationshipScroll}
      >
        {CONTACT_RELATIONSHIPS.map((relationship) => (
          <TouchableOpacity
            key={relationship}
            style={[
              styles.relationshipChip,
              formData.relationship === relationship && styles.relationshipChipSelected,
            ]}
            onPress={() => handleInputChange('relationship', relationship)}
          >
            <Text
              style={[
                styles.relationshipChipText,
                formData.relationship === relationship && styles.relationshipChipTextSelected,
              ]}
            >
              {relationship}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Emergency Contact</Text>
            <Text style={styles.subtitle}>
              Add someone who should be notified during emergencies
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Enter contact's full name"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                placeholder="(555) 123-4567"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email (Optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="contact@example.com"
                placeholderTextColor={COLORS.TEXT_SECONDARY}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {renderRelationshipPicker()}

            <TouchableOpacity
              style={styles.primaryToggle}
              onPress={() => handleInputChange('isPrimary', !formData.isPrimary)}
            >
              <View style={styles.primaryToggleContent}>
                <View>
                  <Text style={styles.primaryToggleTitle}>Primary Contact</Text>
                  <Text style={styles.primaryToggleSubtitle}>
                    This contact will be notified first during emergencies
                  </Text>
                </View>
                <View style={[
                  styles.checkbox,
                  formData.isPrimary && styles.checkboxSelected,
                ]}>
                  {formData.isPrimary && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>ℹ️ Important:</Text>
            <Text style={styles.infoText}>
              • Emergency contacts will receive your location and emergency alerts{'\n'}
              • Make sure to inform them about being added as an emergency contact{'\n'}
              • Test the emergency features with trusted contacts{'\n'}
              • Keep contact information up to date
            </Text>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Adding...' : 'Add Contact'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
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
  form: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.SURFACE,
  },
  relationshipScroll: {
    flexDirection: 'row',
  },
  relationshipChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    marginRight: 8,
  },
  relationshipChipSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  relationshipChipText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },
  relationshipChipTextSelected: {
    color: COLORS.SURFACE,
  },
  primaryToggle: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    padding: 16,
  },
  primaryToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryToggleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  primaryToggleSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
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
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  checkmark: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoContainer: {
    margin: 20,
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
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: COLORS.SURFACE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddContactScreen;
