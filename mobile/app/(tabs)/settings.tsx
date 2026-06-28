import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import { router } from "expo-router";

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnexion", style: "destructive", onPress: async () => {
        await logout();
        router.replace("/login");
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>Paramètres</Text>
      {user && (
        <View style={styles.card}>
          <View style={[styles.avatar, { backgroundColor: user.avatarColor }]}>
            <Text style={styles.avatarText}>{user.displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user.displayName}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪  Se déconnecter</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb", padding: 20 },
  title: { fontSize: 28, fontWeight: "700", color: "#111", marginBottom: 24 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 28, alignItems: "center", gap: 8, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", color: "#111" },
  username: { fontSize: 14, color: "#6b7280" },
  email: { fontSize: 13, color: "#9ca3af" },
  logoutBtn: { marginTop: 24, backgroundColor: "#fff", borderRadius: 16, padding: 18, alignItems: "center", borderWidth: 1.5, borderColor: "#fee2e2" },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#ef4444" },
});
