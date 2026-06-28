import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: "#10b981",
      tabBarInactiveTintColor: "#9ca3af",
      tabBarStyle: { borderTopColor: "#e5e7eb" },
      headerShown: false,
    }}>
      <Tabs.Screen name="conversations" options={{
        title: "Messages",
        tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="users" options={{
        title: "Contacts",
        tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: "Paramètres",
        tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
