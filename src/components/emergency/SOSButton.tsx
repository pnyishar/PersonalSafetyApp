import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  Alert,
} from 'react-native';
import { EmergencyType, EmergencyAlert } from '../../types';
import { COLORS, EMERGENCY_TYPES, TIMEOUTS } from '../../constants';
import EmergencyService from '../../services/EmergencyService';

interface SOSButtonProps {
  type?: EmergencyType;
  size?: 'small' | 'medium' | 'large';
  onEmergencyTriggered?: (alert: EmergencyAlert) => void;
  onEmergencyCancelled?: () => void;
  disabled?: boolean;
}

const SOSButton: React.FC<SOSButtonProps> = ({
  type = 'SOS',
  size = 'large',
  onEmergencyTriggered,
  onEmergencyCancelled,
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [pulseAnim] = useState(new Animated.Value(1));

  const emergencyAction = EMERGENCY_TYPES[type];

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;

    if (isCountingDown && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleEmergencyConfirmed();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [isCountingDown, countdown]);

  useEffect(() => {
    if (isCountingDown) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isCountingDown]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressIn = () => {
    if (disabled) return;

    setIsPressed(true);
    Vibration.vibrate(50);

    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;

    if (isCountingDown) {
      handleCancelEmergency();
    } else {
      handleStartEmergency();
    }
  };

  const handleStartEmergency = () => {
    Alert.alert(
      'Emergency Alert',
      `Are you sure you want to trigger a ${emergencyAction.description}? This will notify your emergency contacts.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            setIsCountingDown(true);
            setCountdown(TIMEOUTS.EMERGENCY_COUNTDOWN);
            Vibration.vibrate([0, 200, 100, 200]);
          },
        },
      ]
    );
  };

  const handleCancelEmergency = () => {
    setIsCountingDown(false);
    setCountdown(0);
    EmergencyService.cancelEmergencyCountdown();
    onEmergencyCancelled?.();
    Vibration.vibrate(100);
  };

  const handleEmergencyConfirmed = async () => {
    setIsCountingDown(false);
    setCountdown(0);

    try {
      const alert = await EmergencyService.triggerEmergency(
        type,
        undefined,
        true
      );
      if (alert) {
        onEmergencyTriggered?.(alert);
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to trigger emergency alert. Please try again.'
      );
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return 80;
      case 'medium':
        return 120;
      case 'large':
      default:
        return 160;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'medium':
        return 16;
      case 'large':
      default:
        return 20;
    }
  };

  const buttonSize = getButtonSize();
  const fontSize = getFontSize();

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: isCountingDown
                ? COLORS.WARNING
                : emergencyAction.color,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Text style={[styles.icon, { fontSize: fontSize * 2 }]}>
            {emergencyAction.icon}
          </Text>
          <Text style={[styles.buttonText, { fontSize }]}>
            {isCountingDown ? 'CANCEL' : type}
          </Text>
          {isCountingDown && (
            <Text style={[styles.countdownText, { fontSize: fontSize * 0.8 }]}>
              {countdown}s
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.description, { fontSize: fontSize * 0.7 }]}>
        {isCountingDown
          ? `Tap to cancel emergency alert`
          : `Tap to trigger ${emergencyAction.description}`}
      </Text>

      {isCountingDown && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Emergency alert will be sent in {countdown} seconds
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  buttonContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.SURFACE,
  },
  icon: {
    marginBottom: 4,
  },
  buttonText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  countdownText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    marginTop: 2,
  },
  description: {
    marginTop: 16,
    textAlign: 'center',
    color: COLORS.TEXT_SECONDARY,
    maxWidth: 200,
  },
  warningContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.WARNING,
    borderRadius: 8,
    maxWidth: 250,
  },
  warningText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default SOSButton;
