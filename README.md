# Personal Safety App

A comprehensive React Native safety application that enables users to send location-based emergency alerts, record evidence, and share live location tracking with emergency contacts.

## Features

### 🚨 Emergency Alerts
- **SOS Button**: One-tap emergency alert with countdown timer
- **Multiple Alert Types**: Medical, Fire, Police, and General emergencies
- **Auto-dialing**: Automatic calls to emergency services
- **SMS Notifications**: Instant alerts sent to emergency contacts

### 📍 Location Services
- **Real-time GPS Tracking**: High-accuracy location monitoring
- **Live Location Sharing**: Share your route with trusted contacts
- **Location History**: Track and store location data
- **Maps Integration**: Open locations in Google Maps

### 👥 Emergency Contacts
- **Contact Management**: Add, edit, and organize emergency contacts
- **Primary Contact**: Designate main emergency contact
- **Active/Inactive Status**: Control which contacts receive alerts
- **Quick Actions**: Call or message contacts directly

### 🎥 Evidence Recording
- **Audio Recording**: Record audio evidence during emergencies
- **Video Recording**: Capture video with front/back camera
- **Secure Storage**: Local storage of recorded media
- **Easy Sharing**: Share recordings with authorities

### ⚙️ Settings & Permissions
- **Permission Management**: Handle location, camera, and microphone permissions
- **User Preferences**: Customize app behavior and notifications
- **Privacy Controls**: Manage data sharing and storage

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Setup
1. Clone the repository:
```bash
git clone <repository-url>
cd PersonalSafetyApp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on device:
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (LocationDisplay, etc.)
│   ├── contacts/       # Contact-related components
│   └── emergency/      # Emergency components (SOSButton)
├── constants/          # App constants and configuration
├── navigation/         # Navigation setup and routing
├── screens/           # Screen components
│   ├── contacts/      # Contact management screens
│   ├── emergency/     # Emergency alert screens
│   ├── home/          # Main dashboard screen
│   ├── recording/     # Audio/video recording screens
│   ├── settings/      # Settings and preferences
│   └── tracking/      # Route tracking screens
├── services/          # Business logic and API services
│   ├── EmergencyService.ts    # Emergency alert handling
│   ├── LocationService.ts     # GPS and location services
│   ├── PermissionsService.ts  # App permissions management
│   ├── RecordingService.ts    # Audio/video recording
│   ├── RouteTrackingService.ts # Live location sharing
│   └── StorageService.ts      # Local data storage
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and helpers
```

## Key Technologies

- **React Native**: Cross-platform mobile development
- **TypeScript**: Type-safe JavaScript
- **Expo**: Development platform and tools
- **React Navigation**: Navigation library
- **AsyncStorage**: Local data persistence
- **Expo Location**: GPS and location services
- **Expo Camera**: Camera and video recording
- **Expo Audio**: Audio recording capabilities

## Permissions Required

The app requires the following permissions to function properly:

- **Location**: For emergency alerts and route tracking
- **Camera**: For video recording evidence
- **Microphone**: For audio recording evidence
- **Contacts**: For emergency contact management (optional)

## Usage

### Setting Up Emergency Contacts
1. Navigate to the Contacts tab
2. Tap the "+" button to add a new contact
3. Enter contact details (name, phone, relationship)
4. Mark as primary contact if needed
5. Ensure contact is set to "Active"

### Triggering Emergency Alert
1. Press and hold the SOS button on the home screen
2. Choose emergency type (Medical, Fire, Police, General)
3. Wait for countdown or tap "Send Now" for immediate alert
4. App will send location and alert message to all active contacts

### Recording Evidence
1. Navigate to the Recording screen
2. Choose audio or video recording
3. Grant camera/microphone permissions if prompted
4. Start recording and capture evidence
5. Stop recording to save the file

### Route Tracking
1. Go to Route Tracking screen
2. Select contacts to share location with
3. Start tracking to begin live location sharing
4. Contacts receive periodic location updates
5. Stop tracking when safe

## Configuration

### Emergency Messages
Customize emergency messages in `src/constants/index.ts`:

```typescript
export const EMERGENCY_MESSAGES = {
  DEFAULT_MEDICAL: "Medical emergency! I need immediate assistance.",
  DEFAULT_FIRE: "Fire emergency! Please send help immediately.",
  DEFAULT_POLICE: "Police emergency! I need help right away.",
  DEFAULT_GENERAL: "Emergency! I need assistance at my current location."
};
```

### Location Settings
Adjust location accuracy and update intervals in `src/constants/index.ts`:

```typescript
export const LOCATION_CONFIG = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  interval: 5000,
  distanceFilter: 10
};
```

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
# iOS
npx expo build:ios

# Android
npx expo build:android
```

### Code Style
The project uses ESLint and Prettier for code formatting. Run:
```bash
npm run lint
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## Security Considerations

- All location data is stored locally on the device
- Emergency contacts are encrypted in local storage
- No personal data is transmitted to external servers without user consent
- Audio/video recordings are stored securely on device

## Troubleshooting

### Common Issues

**Location not working:**
- Ensure location permissions are granted
- Check device location services are enabled
- Try restarting the app

**Camera/Recording issues:**
- Grant camera and microphone permissions
- Ensure device has sufficient storage space
- Check if other apps are using camera

**Emergency alerts not sending:**
- Verify emergency contacts are set to "Active"
- Check device has cellular or internet connection
- Ensure SMS app is available on device

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

## Disclaimer

This app is designed to assist in emergency situations but should not be relied upon as the sole means of emergency communication. Always call local emergency services (911, 112, etc.) directly when possible.
