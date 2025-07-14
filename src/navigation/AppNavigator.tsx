import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import screens
import HomeScreen from '../screens/home/HomeScreen';
import EmergencyScreen from '../screens/emergency/EmergencyScreen';
import ContactsScreen from '../screens/contacts/ContactsScreen';
import ContactDetailScreen from '../screens/contacts/ContactDetailScreen';
import AddContactScreen from '../screens/contacts/AddContactScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import RouteTrackingScreen from '../screens/tracking/RouteTrackingScreen';
import RecordingScreen from '../screens/recording/RecordingScreen';

import { RootStackParamList, TabParamList } from '../types';
import { COLORS } from '../constants';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Tab Navigator for main screens
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: COLORS.SURFACE,
          borderTopColor: COLORS.BORDER,
        },
        headerStyle: {
          backgroundColor: COLORS.SURFACE,
        },
        headerTintColor: COLORS.TEXT_PRIMARY,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Safety',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{
          title: 'Emergency',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="warning" color={color} size={size} />
          ),
          tabBarActiveTintColor: COLORS.EMERGENCY_RED,
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.SURFACE,
          },
          headerTintColor: COLORS.TEXT_PRIMARY,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ContactDetail"
          component={ContactDetailScreen}
          options={{ title: 'Contact Details' }}
        />
        <Stack.Screen
          name="AddContact"
          component={AddContactScreen}
          options={{ title: 'Add Emergency Contact' }}
        />
        <Stack.Screen
          name="RouteTracking"
          component={RouteTrackingScreen}
          options={{ title: 'Route Tracking' }}
        />
        <Stack.Screen
          name="Recording"
          component={RecordingScreen}
          options={({ route }) => ({
            title:
              route.params?.type === 'video'
                ? 'Video Recording'
                : 'Audio Recording',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
