import { Location } from '../types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Format distance for display
 * @param distance Distance in meters
 * @returns Formatted distance string
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
};

/**
 * Format timestamp to readable date/time
 * @param timestamp Unix timestamp
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString();
};

/**
 * Format phone number for display
 * @param phoneNumber Raw phone number
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phoneNumber;
};

/**
 * Validate phone number format
 * @param phoneNumber Phone number to validate
 * @returns True if valid
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
};

/**
 * Validate email format
 * @param email Email to validate
 * @returns True if valid
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate unique ID
 * @returns Unique string ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function calls
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Get current timestamp
 * @returns Current Unix timestamp
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};

/**
 * Check if location is valid
 * @param location Location object to validate
 * @returns True if valid
 */
export const isValidLocation = (location: Location): boolean => {
  return (
    location &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180
  );
};

/**
 * Create Google Maps URL for location
 * @param location Location object
 * @returns Google Maps URL
 */
export const createMapsUrl = (location: Location): string => {
  return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
};

/**
 * Format duration in seconds to readable string
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  return `${remainingSeconds}s`;
};

/**
 * Sanitize string for safe display
 * @param str String to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').trim();
};

/**
 * Check if app is in development mode
 * @returns True if in development
 */
export const isDevelopment = (): boolean => {
  return __DEV__;
};

/**
 * Log error with context
 * @param error Error object or message
 * @param context Additional context
 */
export const logError = (error: any, context?: string): void => {
  if (isDevelopment()) {
    console.error(`[PersonalSafety] ${context || 'Error'}:`, error);
  }
  // In production, you might want to send to crash reporting service
};

/**
 * Create emergency message with location
 * @param message Base message
 * @param location Current location
 * @returns Formatted emergency message
 */
export const createEmergencyMessage = (message: string, location: Location): string => {
  const mapsUrl = createMapsUrl(location);
  return `${message}\n\nLocation: ${mapsUrl}\nCoordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\nTime: ${formatTimestamp(location.timestamp)}`;
};
