import * as ExpoLinking from 'expo-linking';
import {
  EmergencyAlert,
  EmergencyContact,
  Location,
  EmergencyType,
} from '../types';
import { EMERGENCY_TYPES, EMERGENCY_MESSAGES, TIMEOUTS } from '../constants';
import {
  generateId,
  getCurrentTimestamp,
  createEmergencyMessage,
  logError,
} from '../utils';
import LocationService from './LocationService';
import StorageService from './StorageService';

export class EmergencyService {
  private static instance: EmergencyService;
  private activeAlert: EmergencyAlert | null = null;
  private countdownTimer: NodeJS.Timeout | null = null;
  private emergencyCallbacks: ((alert: EmergencyAlert) => void)[] = [];

  private constructor() {}

  public static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService();
    }
    return EmergencyService.instance;
  }

  public async triggerEmergency(
    type: EmergencyType,
    message?: string,
    skipCountdown = false
  ): Promise<EmergencyAlert | null> {
    try {
      const location = await LocationService.getCurrentLocation();
      if (!location) {
        logError('Cannot trigger emergency: Location not available');
        return null;
      }

      const contacts = await StorageService.getEmergencyContacts();
      const activeContacts = contacts.filter((contact) => contact.isActive);

      if (activeContacts.length === 0) {
        logError('Cannot trigger emergency: No active emergency contacts');
        return null;
      }
      const alert: EmergencyAlert = {
        id: generateId(),
        userId: 'current-user',
        type,
        location,
        message:
          message ||
          EMERGENCY_MESSAGES[
            `DEFAULT_${type}` as keyof typeof EMERGENCY_MESSAGES
          ],
        timestamp: getCurrentTimestamp(),
        status: 'ACTIVE',
        contactsNotified: [],
      };

      this.activeAlert = alert;

      if (skipCountdown) {
        await this.executeEmergencyAlert(alert, activeContacts);
      } else {
        await this.startEmergencyCountdown(alert, activeContacts);
      }

      await StorageService.addEmergencyToHistory(alert);
      this.notifyEmergencyCallbacks(alert);

      return alert;
    } catch (error) {
      logError(error, 'Failed to trigger emergency');
      return null;
    }
  }

  private async startEmergencyCountdown(
    alert: EmergencyAlert,
    contacts: EmergencyContact[]
  ): Promise<void> {
    let countdown = TIMEOUTS.EMERGENCY_COUNTDOWN;
    await this.showCountdownNotification(countdown);

    this.countdownTimer = setInterval(async () => {
      countdown--;

      if (countdown <= 0) {
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
        await this.executeEmergencyAlert(alert, contacts);
      } else {
        await this.showCountdownNotification(countdown);
      }
    }, 1000);
  }

  public cancelEmergencyCountdown(): boolean {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;

      if (this.activeAlert) {
        this.activeAlert.status = 'CANCELLED';
        this.notifyEmergencyCallbacks(this.activeAlert);
      }

      console.log('Emergency countdown cancelled');

      return true;
    }
    return false;
  }

  private async executeEmergencyAlert(
    alert: EmergencyAlert,
    contacts: EmergencyContact[]
  ): Promise<void> {
    try {
      const notificationPromises = contacts.map((contact) =>
        this.notifyEmergencyContact(alert, contact)
      );

      const results = await Promise.allSettled(notificationPromises);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          alert.contactsNotified.push(contacts[index].id);
        }
      });

      const emergencyAction = EMERGENCY_TYPES[alert.type];
      if (emergencyAction.quickDial) {
        await this.makeEmergencyCall(emergencyAction.quickDial);
      }

      await this.showEmergencyNotification(alert);
      alert.status = 'ACTIVE';
      this.notifyEmergencyCallbacks(alert);
    } catch (error) {
      logError(error, 'Failed to execute emergency alert');
    }
  }

  private async notifyEmergencyContact(
    alert: EmergencyAlert,
    contact: EmergencyContact
  ): Promise<boolean> {
    try {
      const emergencyMessage = createEmergencyMessage(
        alert.message || '',
        alert.location
      );

      const smsUrl = `sms:${contact.phoneNumber}?body=${encodeURIComponent(
        emergencyMessage
      )}`;
      const canOpenSMS = await ExpoLinking.canOpenURL(smsUrl);

      if (canOpenSMS) {
        await ExpoLinking.openURL(smsUrl);
      }
      if (contact.email) {
        const emailUrl = `mailto:${contact.email}?subject=${encodeURIComponent(
          'EMERGENCY ALERT'
        )}&body=${encodeURIComponent(emergencyMessage)}`;
        const canOpenEmail = await ExpoLinking.canOpenURL(emailUrl);

        if (canOpenEmail) {
          await ExpoLinking.openURL(emailUrl);
        }
      }

      return true;
    } catch (error) {
      logError(error, `Failed to notify contact: ${contact.name}`);
      return false;
    }
  }

  private async makeEmergencyCall(phoneNumber: string): Promise<boolean> {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      const canMakeCall = await ExpoLinking.canOpenURL(phoneUrl);

      if (canMakeCall) {
        await ExpoLinking.openURL(phoneUrl);
        return true;
      }

      return false;
    } catch (error) {
      logError(error, `Failed to make emergency call to: ${phoneNumber}`);
      return false;
    }
  }

  private async showCountdownNotification(countdown: number): Promise<void> {
    try {
      console.log(
        `Emergency Alert: Emergency will be triggered in ${countdown} seconds. Tap to cancel.`
      );
    } catch (error) {
      logError(error, 'Failed to show countdown notification');
    }
  }

  private async showEmergencyNotification(
    alert: EmergencyAlert
  ): Promise<void> {
    try {
      const emergencyAction = EMERGENCY_TYPES[alert.type];
      console.log(
        `${emergencyAction.icon} Emergency Alert Sent: ${emergencyAction.description} alert sent to ${alert.contactsNotified.length} contacts`
      );
    } catch (error) {
      logError(error, 'Failed to show emergency notification');
    }
  }

  public async resolveEmergency(alertId: string): Promise<boolean> {
    try {
      if (this.activeAlert && this.activeAlert.id === alertId) {
        this.activeAlert.status = 'RESOLVED';
        this.notifyEmergencyCallbacks(this.activeAlert);
        const contacts = await StorageService.getEmergencyContacts();
        const notifiedContacts = contacts.filter((contact) =>
          this.activeAlert?.contactsNotified.includes(contact.id)
        );

        const resolutionMessage = 'Emergency resolved. I am safe now.';

        for (const contact of notifiedContacts) {
          await this.sendResolutionMessage(contact, resolutionMessage);
        }

        this.activeAlert = null;
        return true;
      }

      return false;
    } catch (error) {
      logError(error, 'Failed to resolve emergency');
      return false;
    }
  }

  private async sendResolutionMessage(
    contact: EmergencyContact,
    message: string
  ): Promise<void> {
    try {
      const smsUrl = `sms:${contact.phoneNumber}?body=${encodeURIComponent(
        message
      )}`;
      const canOpenSMS = await ExpoLinking.canOpenURL(smsUrl);

      if (canOpenSMS) {
        await ExpoLinking.openURL(smsUrl);
      }
    } catch (error) {
      logError(error, `Failed to send resolution message to: ${contact.name}`);
    }
  }

  public getActiveAlert(): EmergencyAlert | null {
    return this.activeAlert;
  }

  public isEmergencyActive(): boolean {
    return this.activeAlert !== null && this.activeAlert.status === 'ACTIVE';
  }

  public subscribeToEmergencyUpdates(
    callback: (alert: EmergencyAlert) => void
  ): () => void {
    this.emergencyCallbacks.push(callback);

    return () => {
      const index = this.emergencyCallbacks.indexOf(callback);
      if (index > -1) {
        this.emergencyCallbacks.splice(index, 1);
      }
    };
  }

  private notifyEmergencyCallbacks(alert: EmergencyAlert): void {
    this.emergencyCallbacks.forEach((callback) => {
      try {
        callback(alert);
      } catch (error) {
        logError(error, 'Error in emergency callback');
      }
    });
  }

  public cleanup(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.emergencyCallbacks = [];
    this.activeAlert = null;
  }
}

export default EmergencyService.getInstance();
