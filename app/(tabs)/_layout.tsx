import { Tabs } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, GestureResponderEvent, Text, TouchableOpacity, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AnimatedTabButtonProps {
  children: React.ReactNode;
  onPress?: (e: GestureResponderEvent) => void;
  onLongPress?: ((e: GestureResponderEvent) => void) | null;
  accessibilityState?: { selected?: boolean };
  style?: any;
  [key: string]: any;
}

// Custom Animated Tab Button
const AnimatedTabButton = ({
  children,
  onPress,
  onLongPress,
  accessibilityState,
  style,
  ...props
}: AnimatedTabButtonProps) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const isSelected = accessibilityState?.selected || false;

  const animateIn = () => Animated.spring(scaleValue, { toValue: 0.92, useNativeDriver: true, speed: 50 }).start();
  const animateOut = () => Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
  const handleLongPress = (e: GestureResponderEvent) => { if (onLongPress) onLongPress(e); };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={handleLongPress}
      onPressIn={animateIn}
      onPressOut={animateOut}
      activeOpacity={0.8}
      style={[{ flex: 1 }, style]}
      {...props}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleValue }],
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 8,
        }}
      >
        {children}
        {isSelected && (
          <View
            style={{
              position: 'absolute',
              bottom: -4,
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#2E7D32', // Green dot
            }}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme(); // 'light' | 'dark'
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.icon,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: colorScheme === 'dark' ? '#1B5E20' : '#F0FFF4', // Project theme
          borderRadius: 30,
          height: 64,
          paddingBottom: 8,
          paddingHorizontal: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
          borderTopWidth: 0,
        },
        tabBarLabel: ({ focused, color }) => (
          <Text
            style={{
              fontSize: 11,
              fontWeight: focused ? '700' : '500',
              color,
              marginTop: 4,
              opacity: focused ? 1 : 0.8,
            }}
          >
            {route.name === 'dashboard'
              ? 'Home'
              : route.name === 'profile'
              ? 'Farmer'
              : route.name === 'complaint'
              ? 'Report'
              : route.name === 'settings'
              ? 'Settings'
              : route.name}
          </Text>
        ),
      })}
    >
      {/* Dashboard */}
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 28 : 24} name="house.fill" color={color} />
          ),
        }}
      />

      {/* Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 28 : 24} name="person.fill" color={color} />
          ),
        }}
      />

      {/* Complaint (Interactive floating + button) */}
      <Tabs.Screen
        name="complaint"
        options={{
          tabBarIcon: () => {
            const scale = useRef(new Animated.Value(1)).current;

            const animatePressIn = () => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
            const animatePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

            return (
              <TouchableOpacity
                onPressIn={animatePressIn}
                onPressOut={animatePressOut}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={{
                    transform: [{ scale }],
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.tint,
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    marginTop: -20,
                    shadowColor: colors.tint,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                >
                  {/* Interactive + icon */}
                  <IconSymbol size={26} name="plus" color="#FFF" />
                </Animated.View>
              </TouchableOpacity>
            );
          },
        }}
      />

      {/* Settings */}
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={focused ? 28 : 24} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}