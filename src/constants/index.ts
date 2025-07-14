// Constants for Personal Safety App

export const COLORS = {
  // Emergency colors
  EMERGENCY_RED: '#FF3B30',
  EMERGENCY_ORANGE: '#FF9500',
  EMERGENCY_YELLOW: '#FFCC00',
  
  // Status colors
  SUCCESS: '#34C759',
  WARNING: '#FF9500',
  ERROR: '#FF3B30',
  INFO: '#007AFF',
  
  // UI colors
  PRIMARY: '#007AFF',
  SECONDARY: '#5856D6',
  BACKGROUND: '#F2F2F7',
  SURFACE: '#FFFFFF',
  TEXT_PRIMARY: '#000000',
  TEXT_SECONDARY: '#8E8E93',
  BORDER: '#C6C6C8',
  
  // Emergency action colors
  SOS: '#FF3B30',
  MEDICAL: '#FF9500',
  FIRE: '#FF3B30',
  POLICE: '#007AFF',
  PANIC: '#5856D6',
} as const;

export const EMERGENCY_TYPES = {
  SOS: {
    type: 'SOS' as const,
    icon: '🆘',
    color: COLORS.SOS,
    description: 'General Emergency',
    quickDial: '911',
  },
  MEDICAL: {
    type: 'MEDICAL' as const,
    icon: '🏥',
    color: COLORS.MEDICAL,
    description: 'Medical Emergency',
    quickDial: '911',
  },
  FIRE: {
    type: 'FIRE' as const,
    icon: '🔥',
    color: COLORS.FIRE,
    description: 'Fire Emergency',
    quickDial: '911',
  },
  POLICE: {
    type: 'POLICE' as const,
    icon: '👮',
    color: COLORS.POLICE,
    description: 'Police Emergency',
    quickDial: '911',
  },
  PANIC: {
    type: 'PANIC' as const,
    icon: '⚠️',
    color: COLORS.PANIC,
    description: 'Panic Button',
  },
} as const;

export const LOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  distanceFilter: 10, // meters
  interval: 5000, // milliseconds
  fastestInterval: 2000, // milliseconds
} as const;

export const RECORDING_CONFIG = {
  AUDIO: {
    quality: 'medium' as const,
    maxDuration: 300, // 5 minutes
    format: 'mp4',
    bitRate: 128000,
    sampleRate: 44100,
    numberOfChannels: 2,
  },
  VIDEO: {
    quality: 'medium' as const,
    maxDuration: 180, // 3 minutes
    format: 'mp4',
    videoBitRate: 2000000,
    audioBitRate: 128000,
    fps: 30,
  },
} as const;

export const PERMISSIONS = {
  LOCATION: 'LOCATION',
  CAMERA: 'CAMERA',
  MICROPHONE: 'MICROPHONE',
  CONTACTS: 'CONTACTS',
  PHONE: 'PHONE',
} as const;

export const PERMISSION_MESSAGES = {
  LOCATION: {
    title: 'Location Permission Required',
    message: 'This app needs location access to send your location during emergencies and track your route.',
  },
  CAMERA: {
    title: 'Camera Permission Required',
    message: 'This app needs camera access to record video evidence during emergencies.',
  },
  MICROPHONE: {
    title: 'Microphone Permission Required',
    message: 'This app needs microphone access to record audio evidence during emergencies.',
  },
  CONTACTS: {
    title: 'Contacts Permission Required',
    message: 'This app needs contacts access to help you select emergency contacts.',
  },
  PHONE: {
    title: 'Phone Permission Required',
    message: 'This app needs phone access to make emergency calls.',
  },
} as const;

export const NOTIFICATION_TYPES = {
  EMERGENCY_ALERT: 'EMERGENCY_ALERT',
  ROUTE_SHARING: 'ROUTE_SHARING',
  CONTACT_REQUEST: 'CONTACT_REQUEST',
  LOCATION_UPDATE: 'LOCATION_UPDATE',
} as const;

export const STORAGE_KEYS = {
  USER_DATA: '@PersonalSafety:userData',
  EMERGENCY_CONTACTS: '@PersonalSafety:emergencyContacts',
  USER_PREFERENCES: '@PersonalSafety:userPreferences',
  LOCATION_HISTORY: '@PersonalSafety:locationHistory',
  EMERGENCY_HISTORY: '@PersonalSafety:emergencyHistory',
} as const;

export const API_ENDPOINTS = {
  BASE_URL: 'https://api.personalsafety.app',
  AUTH: '/auth',
  USERS: '/users',
  EMERGENCY: '/emergency',
  CONTACTS: '/contacts',
  LOCATION: '/location',
  NOTIFICATIONS: '/notifications',
} as const;

export const TIMEOUTS = {
  EMERGENCY_COUNTDOWN: 10, // seconds
  LOCATION_TIMEOUT: 15, // seconds
  API_TIMEOUT: 30, // seconds
  RECORDING_MAX: 300, // seconds
} as const;

export const DISTANCES = {
  GEOFENCE_RADIUS: 100, // meters
  ROUTE_POINT_INTERVAL: 50, // meters
  ACCURACY_THRESHOLD: 20, // meters
} as const;

export const CONTACT_RELATIONSHIPS = [
  'Family',
  'Friend',
  'Colleague',
  'Neighbor',
  'Partner',
  'Emergency Service',
  'Other',
] as const;

export const EMERGENCY_MESSAGES = {
  DEFAULT_SOS: 'Emergency! I need help. My current location is attached.',
  DEFAULT_MEDICAL: 'Medical emergency! Please send help to my location.',
  DEFAULT_FIRE: 'Fire emergency! Please send fire department to my location.',
  DEFAULT_POLICE: 'Police emergency! Please send police to my location.',
  DEFAULT_PANIC: 'I am in danger and need immediate help!',
} as const;

export const ROUTE_TRACKING = {
  MIN_DISTANCE_BETWEEN_POINTS: 10, // meters
  MAX_POINTS_STORED: 1000,
  SHARING_INTERVAL: 30, // seconds
  AUTO_STOP_TIMEOUT: 3600, // 1 hour in seconds
} as const;
