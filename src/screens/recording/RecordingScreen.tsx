import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { MediaFile } from '../../types';
import { COLORS, RECORDING_CONFIG } from '../../constants';
import { formatDuration } from '../../utils';
import RecordingService from '../../services/RecordingService';

const { width, height } = Dimensions.get('window');

const RecordingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { type } = route.params as { type: 'audio' | 'video' };

  const cameraRef = useRef<CameraView>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [recordedFile, setRecordedFile] = useState<MediaFile | null>(null);

  useEffect(() => {
    requestPermissions();

    // Subscribe to recording updates
    const unsubscribe = RecordingService.subscribeToRecordingUpdates((file) => {
      setRecordedFile(file);
      if (file) {
        setIsRecording(false);
      }
    });

    return () => {
      unsubscribe();
      RecordingService.cancelRecording();
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  const requestPermissions = async () => {
    try {
      if (type === 'video') {
        if (!permission?.granted) {
          await requestPermission();
        }
      }
      // Audio permissions are handled by RecordingService
    } catch (error) {
      console.error('Failed to request permissions:', error);
    }
  };

  const handleStartRecording = async () => {
    try {
      let success = false;

      if (type === 'audio') {
        success = await RecordingService.startAudioRecording();
      } else {
        success = await RecordingService.startVideoRecording(cameraRef.current);
      }

      if (success) {
        setIsRecording(true);
        setRecordingDuration(0);
      } else {
        Alert.alert('Error', `Failed to start ${type} recording.`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to start ${type} recording.`);
    }
  };

  const handleStopRecording = async () => {
    try {
      let mediaFile: MediaFile | null = null;

      if (type === 'audio') {
        mediaFile = await RecordingService.stopAudioRecording();
      } else {
        mediaFile = await RecordingService.stopVideoRecording(
          cameraRef.current
        );
      }

      setIsRecording(false);

      if (mediaFile) {
        setRecordedFile(mediaFile);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to stop ${type} recording.`);
      setIsRecording(false);
    }
  };

  const handleCancelRecording = async () => {
    Alert.alert(
      'Cancel Recording',
      'Are you sure you want to cancel the recording?',
      [
        { text: 'Continue Recording', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            await RecordingService.cancelRecording();
            setIsRecording(false);
            setRecordedFile(null);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleSaveRecording = async () => {
    if (!recordedFile) return;

    try {
      const savedPath = await RecordingService.saveMediaFile(recordedFile);

      if (savedPath) {
        Alert.alert(
          'Recording Saved',
          `Your ${type} recording has been saved successfully.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save recording.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save recording.');
    }
  };

  const handleDiscardRecording = () => {
    Alert.alert(
      'Discard Recording',
      'Are you sure you want to discard this recording?',
      [
        { text: 'Keep Recording', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setRecordedFile(null);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const toggleCameraType = () => {
    setCameraType((current: CameraType) =>
      current === 'back' ? 'front' : 'back'
    );
  };

  const getMaxDuration = () => {
    return type === 'audio'
      ? RECORDING_CONFIG.AUDIO.maxDuration
      : RECORDING_CONFIG.VIDEO.maxDuration;
  };

  const renderRecordingProgress = () => {
    const maxDuration = getMaxDuration();
    const progress = recordingDuration / maxDuration;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
        <Text style={styles.durationText}>
          {formatDuration(recordingDuration)} / {formatDuration(maxDuration)}
        </Text>
      </View>
    );
  };

  const renderAudioRecording = () => (
    <View style={styles.audioContainer}>
      <View style={styles.audioVisualization}>
        <Text style={styles.audioIcon}>🎤</Text>
        <Text style={styles.audioTitle}>
          {isRecording ? 'Recording Audio...' : 'Audio Recording'}
        </Text>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>REC</Text>
          </View>
        )}
      </View>

      {isRecording && renderRecordingProgress()}
    </View>
  );

  const renderVideoRecording = () => {
    if (!permission) {
      return (
        <Text style={styles.permissionText}>
          Requesting camera permission...
        </Text>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission denied</Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={cameraType} />

        {type === 'video' && (
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraType}
            disabled={isRecording}
          >
            <Text style={styles.flipButtonText}>🔄</Text>
          </TouchableOpacity>
        )}

        {isRecording && (
          <View style={styles.videoRecordingOverlay}>
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>REC</Text>
            </View>
            {renderRecordingProgress()}
          </View>
        )}
      </View>
    );
  };

  const renderControls = () => {
    if (recordedFile) {
      return (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={styles.discardButton}
            onPress={handleDiscardRecording}
          >
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveRecording}
          >
            <Text style={styles.saveButtonText}>Save Recording</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.controlsContainer}>
        {isRecording ? (
          <>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRecording}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stopButton}
              onPress={handleStopRecording}
            >
              <View style={styles.stopButtonInner} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={handleStartRecording}
          >
            <View style={styles.recordButtonInner} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {type === 'audio' ? 'Audio Recording' : 'Video Recording'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {type === 'audio' ? renderAudioRecording() : renderVideoRecording()}
      </View>

      {renderControls()}

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {type === 'audio'
            ? 'Record audio evidence for emergency situations'
            : 'Record video evidence for emergency situations'}
        </Text>
        <Text style={styles.infoText}>
          Maximum duration: {formatDuration(getMaxDuration())}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  audioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  audioVisualization: {
    alignItems: 'center',
    marginBottom: 40,
  },
  audioIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  audioTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  flipButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    fontSize: 24,
  },
  videoRecordingOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.SURFACE,
    marginRight: 6,
  },
  recordingText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    fontSize: 12,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: COLORS.BORDER,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.ERROR,
    borderRadius: 2,
  },
  durationText: {
    color: COLORS.SURFACE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.ERROR,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.SURFACE,
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.SURFACE,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.ERROR,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.SURFACE,
  },
  stopButtonInner: {
    width: 30,
    height: 30,
    backgroundColor: COLORS.SURFACE,
  },
  cancelButton: {
    backgroundColor: COLORS.TEXT_SECONDARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
    fontSize: 16,
  },
  discardButton: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  discardButtonText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 18,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: COLORS.SURFACE,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default RecordingScreen;
