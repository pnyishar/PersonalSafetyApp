import { Audio } from 'expo-audio';
import { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import { MediaFile, RecordingConfig } from '../types';
import { RECORDING_CONFIG } from '../constants';
import { generateId, getCurrentTimestamp, logError } from '../utils';

export class RecordingService {
  private static instance: RecordingService;
  private audioRecording: Audio.Recording | null = null;
  private videoRecording: any = null;
  private isRecording = false;
  private recordingType: 'audio' | 'video' | null = null;
  private recordingCallbacks: ((file: MediaFile | null) => void)[] = [];

  private constructor() {}

  public static getInstance(): RecordingService {
    if (!RecordingService.instance) {
      RecordingService.instance = new RecordingService();
    }
    return RecordingService.instance;
  }

  /**
   * Initialize audio recording
   */
  public async initializeAudio(): Promise<boolean> {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      return true;
    } catch (error) {
      logError(error, 'Failed to initialize audio');
      return false;
    }
  }

  /**
   * Start audio recording
   */
  public async startAudioRecording(): Promise<boolean> {
    try {
      if (this.isRecording) {
        logError('Recording already in progress');
        return false;
      }

      const initialized = await this.initializeAudio();
      if (!initialized) {
        return false;
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.mp4',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: RECORDING_CONFIG.AUDIO.sampleRate,
          numberOfChannels: RECORDING_CONFIG.AUDIO.numberOfChannels,
          bitRate: RECORDING_CONFIG.AUDIO.bitRate,
        },
        ios: {
          extension: '.mp4',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: RECORDING_CONFIG.AUDIO.sampleRate,
          numberOfChannels: RECORDING_CONFIG.AUDIO.numberOfChannels,
          bitRate: RECORDING_CONFIG.AUDIO.bitRate,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      await recording.startAsync();

      this.audioRecording = recording;
      this.isRecording = true;
      this.recordingType = 'audio';

      // Auto-stop after max duration
      setTimeout(() => {
        if (this.isRecording && this.recordingType === 'audio') {
          this.stopAudioRecording();
        }
      }, RECORDING_CONFIG.AUDIO.maxDuration * 1000);

      return true;
    } catch (error) {
      logError(error, 'Failed to start audio recording');
      return false;
    }
  }

  /**
   * Stop audio recording
   */
  public async stopAudioRecording(): Promise<MediaFile | null> {
    try {
      if (
        !this.audioRecording ||
        !this.isRecording ||
        this.recordingType !== 'audio'
      ) {
        return null;
      }

      await this.audioRecording.stopAndUnloadAsync();
      const uri = this.audioRecording.getURI();

      if (!uri) {
        logError('No recording URI available');
        return null;
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);

      const mediaFile: MediaFile = {
        uri,
        type: 'audio',
        duration: 0, // Would need to calculate from recording
        size: fileInfo.exists ? fileInfo.size || 0 : 0,
        createdAt: getCurrentTimestamp(),
      };

      this.cleanup();
      this.notifyRecordingCallbacks(mediaFile);

      return mediaFile;
    } catch (error) {
      logError(error, 'Failed to stop audio recording');
      this.cleanup();
      return null;
    }
  }

  /**
   * Start video recording (requires camera component)
   */
  public async startVideoRecording(cameraRef: any): Promise<boolean> {
    try {
      if (this.isRecording) {
        logError('Recording already in progress');
        return false;
      }

      if (!cameraRef) {
        logError('Camera reference not provided');
        return false;
      }

      const recordingOptions = {
        maxDuration: RECORDING_CONFIG.VIDEO.maxDuration,
        mute: false,
      };

      console.log('Starting video recording with options:', recordingOptions);

      this.isRecording = true;
      this.recordingType = 'video';
      this.videoRecording = recordingOptions;

      return true;
    } catch (error) {
      logError(error, 'Failed to start video recording');
      return false;
    }
  }

  /**
   * Stop video recording
   */
  public async stopVideoRecording(cameraRef: any): Promise<MediaFile | null> {
    try {
      if (!this.isRecording || this.recordingType !== 'video') {
        return null;
      }

      if (!cameraRef) {
        logError('Camera reference not provided');
        return null;
      }

      cameraRef.stopRecording();

      this.cleanup();

      return null; // Video file handling would be done in the camera component
    } catch (error) {
      logError(error, 'Failed to stop video recording');
      this.cleanup();
      return null;
    }
  }

  /**
   * Create video media file from camera recording result
   */
  public async createVideoMediaFile(
    videoUri: string
  ): Promise<MediaFile | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoUri);

      const mediaFile: MediaFile = {
        uri: videoUri,
        type: 'video',
        duration: 0, // Would need to calculate from video metadata
        size: fileInfo.exists ? fileInfo.size || 0 : 0,
        createdAt: getCurrentTimestamp(),
      };

      this.notifyRecordingCallbacks(mediaFile);
      return mediaFile;
    } catch (error) {
      logError(error, 'Failed to create video media file');
      return null;
    }
  }

  /**
   * Cancel current recording
   */
  public async cancelRecording(): Promise<boolean> {
    try {
      if (!this.isRecording) {
        return false;
      }

      if (this.recordingType === 'audio' && this.audioRecording) {
        await this.audioRecording.stopAndUnloadAsync();

        // Delete the recording file
        const uri = this.audioRecording.getURI();
        if (uri) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
      }

      this.cleanup();
      this.notifyRecordingCallbacks(null);

      return true;
    } catch (error) {
      logError(error, 'Failed to cancel recording');
      this.cleanup();
      return false;
    }
  }

  /**
   * Get recording status
   */
  public getRecordingStatus(): {
    isRecording: boolean;
    type: 'audio' | 'video' | null;
    duration?: number;
  } {
    return {
      isRecording: this.isRecording,
      type: this.recordingType,
    };
  }

  /**
   * Check if currently recording
   */
  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Get recording type
   */
  public getRecordingType(): 'audio' | 'video' | null {
    return this.recordingType;
  }

  /**
   * Save media file to permanent storage
   */
  public async saveMediaFile(
    mediaFile: MediaFile,
    filename?: string
  ): Promise<string | null> {
    try {
      const documentsDir = FileSystem.documentDirectory;
      if (!documentsDir) {
        logError('Documents directory not available');
        return null;
      }

      const safetyDir = `${documentsDir}PersonalSafety/`;
      const dirInfo = await FileSystem.getInfoAsync(safetyDir);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(safetyDir, { intermediates: true });
      }

      const extension = mediaFile.type === 'audio' ? '.mp4' : '.mp4';
      const finalFilename =
        filename || `${mediaFile.type}_${generateId()}${extension}`;
      const finalPath = `${safetyDir}${finalFilename}`;

      await FileSystem.copyAsync({
        from: mediaFile.uri,
        to: finalPath,
      });

      return finalPath;
    } catch (error) {
      logError(error, 'Failed to save media file');
      return null;
    }
  }

  /**
   * Delete media file
   */
  public async deleteMediaFile(uri: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
      return true;
    } catch (error) {
      logError(error, 'Failed to delete media file');
      return false;
    }
  }

  /**
   * Get media file info
   */
  public async getMediaFileInfo(uri: string): Promise<{
    exists: boolean;
    size: number;
    modificationTime: number;
  } | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      return {
        exists: fileInfo.exists,
        size: fileInfo.exists ? fileInfo.size || 0 : 0,
        modificationTime: fileInfo.exists ? fileInfo.modificationTime || 0 : 0,
      };
    } catch (error) {
      logError(error, 'Failed to get media file info');
      return null;
    }
  }

  /**
   * List saved media files
   */
  public async listSavedMediaFiles(): Promise<string[]> {
    try {
      const documentsDir = FileSystem.documentDirectory;
      if (!documentsDir) {
        return [];
      }

      const safetyDir = `${documentsDir}PersonalSafety/`;
      const dirInfo = await FileSystem.getInfoAsync(safetyDir);

      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(safetyDir);
      return files.map((file) => `${safetyDir}${file}`);
    } catch (error) {
      logError(error, 'Failed to list saved media files');
      return [];
    }
  }

  /**
   * Subscribe to recording updates
   */
  public subscribeToRecordingUpdates(
    callback: (file: MediaFile | null) => void
  ): () => void {
    this.recordingCallbacks.push(callback);

    return () => {
      const index = this.recordingCallbacks.indexOf(callback);
      if (index > -1) {
        this.recordingCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify recording callbacks
   */
  private notifyRecordingCallbacks(file: MediaFile | null): void {
    this.recordingCallbacks.forEach((callback) => {
      try {
        callback(file);
      } catch (error) {
        logError(error, 'Error in recording callback');
      }
    });
  }

  /**
   * Cleanup recording state
   */
  private cleanup(): void {
    this.audioRecording = null;
    this.videoRecording = null;
    this.isRecording = false;
    this.recordingType = null;
  }

  /**
   * Cleanup all resources
   */
  public cleanupAll(): void {
    this.cancelRecording();
    this.recordingCallbacks = [];
  }
}

export default RecordingService.getInstance();
