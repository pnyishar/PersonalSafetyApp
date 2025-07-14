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
import { Location } from '../../types';
import { COLORS } from '../../constants';
import { createMapsUrl, formatTimestamp } from '../../utils';
import LocationService from '../../services/LocationService';

interface LocationDisplayProps {
  location: Location | null;
  showAccuracy?: boolean;
  showTimestamp?: boolean;
  showMapButton?: boolean;
  onRefresh?: () => void;
  style?: any;
}

const LocationDisplay: React.FC<LocationDisplayProps> = ({
  location,
  showAccuracy = true,
  showTimestamp = true,
  showMapButton = true,
  onRefresh,
  style,
}) => {
  const handleOpenMaps = async () => {
    if (!location) return;

    try {
      const mapsUrl = createMapsUrl(location);
      const canOpen = await Linking.canOpenURL(mapsUrl);

      if (canOpen) {
        await Linking.openURL(mapsUrl);
      } else {
        Alert.alert('Error', 'Unable to open maps application');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open maps');
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    } else {
      try {
        await LocationService.getCurrentLocation();
      } catch (error) {
        Alert.alert('Error', 'Failed to get current location');
      }
    }
  };

  const getAccuracyColor = () => {
    if (!location?.accuracy) return COLORS.TEXT_SECONDARY;

    const accuracy = LocationService.getLocationAccuracy(location);
    switch (accuracy) {
      case 'high':
        return COLORS.SUCCESS;
      case 'medium':
        return COLORS.WARNING;
      case 'low':
        return COLORS.ERROR;
      default:
        return COLORS.TEXT_SECONDARY;
    }
  };

  const getAccuracyText = () => {
    if (!location?.accuracy) return 'Unknown';

    const accuracy = LocationService.getLocationAccuracy(location);
    return `${accuracy.toUpperCase()} (±${Math.round(location.accuracy)}m)`;
  };

  if (!location) {
    return (
      <View style={[styles.container, styles.noLocationContainer, style]}>
        <Ionicons
          name="location-outline"
          size={24}
          color={COLORS.TEXT_SECONDARY}
        />
        <Text style={styles.noLocationText}>Location not available</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.refreshButtonText}>Get Location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Ionicons name="location" size={20} color={COLORS.PRIMARY} />
        <Text style={styles.title}>Current Location</Text>
        <TouchableOpacity style={styles.refreshIcon} onPress={handleRefresh}>
          <Ionicons name="refresh" size={16} color={COLORS.TEXT_SECONDARY} />
        </TouchableOpacity>
      </View>

      <View style={styles.coordinates}>
        <Text style={styles.coordinateText}>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
      </View>

      {showAccuracy && (
        <View style={styles.accuracy}>
          <Ionicons
            name="radio-button-on"
            size={12}
            color={getAccuracyColor()}
          />
          <Text style={[styles.accuracyText, { color: getAccuracyColor() }]}>
            {getAccuracyText()}
          </Text>
        </View>
      )}

      {showTimestamp && (
        <Text style={styles.timestamp}>
          Updated: {formatTimestamp(location.timestamp)}
        </Text>
      )}

      {showMapButton && (
        <TouchableOpacity style={styles.mapButton} onPress={handleOpenMaps}>
          <Ionicons name="map" size={16} color={COLORS.PRIMARY} />
          <Text style={styles.mapButtonText}>Open in Maps</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: 8,
    flex: 1,
  },
  refreshIcon: {
    padding: 4,
  },
  coordinates: {
    marginBottom: 8,
  },
  coordinateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    fontFamily: 'monospace',
  },
  accuracy: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accuracyText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 12,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY + '20',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  mapButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: 4,
  },
  noLocationText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    marginVertical: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.SURFACE,
    marginLeft: 4,
  },
});

export default LocationDisplay;
