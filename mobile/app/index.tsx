import { useEffect } from "react";
import { router } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function Index() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace("/(tabs)/conversations");
      } else {
        router.replace("/login");
      }
    }
  }, [user, isLoading]);

  return (
    <View style={{ flex: 1, backgroundColor: "#10b981", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}
