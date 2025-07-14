// Core types for Personal Safety App

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EmergencyAlert {
  id: string;
  userId: string;
  type: 'SOS' | 'PANIC' | 'MEDICAL' | 'FIRE' | 'POLICE';
  location: Location;
  message?: string;
  timestamp: number;
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  contactsNotified: string[];
  audioRecordingUrl?: string;
  videoRecordingUrl?: string;
  routeData?: RoutePoint[];
}

export interface RoutePoint {
  location: Location;
  timestamp: number;
  isWaypoint?: boolean;
}

export interface RouteTracking {
  id: string;
  userId: string;
  startTime: number;
  endTime?: number;
  isActive: boolean;
  points: RoutePoint[];
  totalDistance: number;
  estimatedArrival?: number;
  destination?: Location;
  sharedWith: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  emergencyContacts: EmergencyContact[];
  preferences: UserPreferences;
  createdAt: number;
  updatedAt: number;
}

export interface UserPreferences {
  autoLocationSharing: boolean;
  emergencyTimeout: number; // seconds
  recordAudioOnSOS: boolean;
  recordVideoOnSOS: boolean;
  shareLocationWithContacts: boolean;
  notificationSound: boolean;
  vibrationEnabled: boolean;
  quickDialEnabled: boolean;
  routeTrackingInterval: number; // seconds
}

export interface Permission {
  type: 'LOCATION' | 'CAMERA' | 'MICROPHONE' | 'CONTACTS' | 'PHONE';
  status: 'GRANTED' | 'DENIED' | 'RESTRICTED' | 'UNDETERMINED';
  canAskAgain: boolean;
}

export interface AppState {
  user: User | null;
  currentLocation: Location | null;
  activeAlert: EmergencyAlert | null;
  activeRoute: RouteTracking | null;
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
}

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  ContactDetail: { contactId: string };
  AddContact: undefined;
  RouteTracking: undefined;
  Recording: { type: 'audio' | 'video' };
};

export type TabParamList = {
  Home: undefined;
  Emergency: undefined;
  Contacts: undefined;
  Settings: undefined;
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LocationServiceConfig {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  distanceFilter: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  vibrate?: boolean;
}

// Emergency types
export type EmergencyType = 'SOS' | 'PANIC' | 'MEDICAL' | 'FIRE' | 'POLICE';

export interface EmergencyAction {
  type: EmergencyType;
  icon: string;
  color: string;
  description: string;
  quickDial?: string;
}

// Recording types
export interface RecordingConfig {
  quality: 'low' | 'medium' | 'high';
  maxDuration: number; // seconds
  format: string;
}

export interface MediaFile {
  uri: string;
  type: 'audio' | 'video';
  duration: number;
  size: number;
  createdAt: number;
}
