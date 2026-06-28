import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import { router } from "expo-router";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username.trim(), password);
      } else {
        if (!email.trim()) { Alert.alert("Erreur", "Email requis."); setLoading(false); return; }
        await register(username.trim(), email.trim(), password, displayName.trim() || username.trim());
      }
      router.replace("/(tabs)/conversations");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (e as Error).message || "Erreur de connexion";
      Alert.alert("Erreur", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}>
          <Text style={styles.logoText}>💬</Text>
          <Text style={styles.title}>Chat App</Text>
          <Text style={styles.subtitle}>Discutez et appelez en temps réel</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, mode === "login" && styles.tabActive]} onPress={() => setMode("login")}>
              <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, mode === "register" && styles.tabActive]} onPress={() => setMode("register")}>
              <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>Inscription</Text>
            </TouchableOpacity>
          </View>

          <TextInput style={styles.input} placeholder="Nom d'utilisateur" placeholderTextColor="#999"
            value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
          {mode === "register" && (
            <>
              <TextInput style={styles.input} placeholder="Nom affiché" placeholderTextColor="#999"
                value={displayName} onChangeText={setDisplayName} />
              <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999"
                value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            </>
          )}
          <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#999"
            value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={styles.btnText}>{mode === "login" ? "Se connecter" : "Créer un compte"}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#10b981", justifyContent: "center", padding: 20 },
  logo: { alignItems: "center", marginBottom: 32 },
  logoText: { fontSize: 64 },
  title: { fontSize: 32, fontWeight: "700", color: "#fff", marginTop: 8 },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.85)", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 24, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
  tabs: { flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  tabTextActive: { color: "#10b981", fontWeight: "700" },
  input: { borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, fontSize: 16, color: "#111", marginBottom: 12 },
  btn: { backgroundColor: "#10b981", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
