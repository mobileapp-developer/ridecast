import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#06ae44ff",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: { fontSize: 12 },
        animation: 'shift',
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sunny-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: "7-Day",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: "My Rides",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bicycle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}


