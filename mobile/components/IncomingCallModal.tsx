import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useCall } from "@/lib/call-context";

export function IncomingCallModal() {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useCall();
  if (!incomingCall) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={rejectIncomingCall}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.avatar, { backgroundColor: "#10b981" }]}>
            <Text style={styles.avatarText}>
              {incomingCall.fromName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{incomingCall.fromName}</Text>
          <Text style={styles.subtitle}>
            Appel {incomingCall.kind === "video" ? "vidéo 📹" : "audio 📞"} entrant…
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={rejectIncomingCall}>
              <Text style={styles.btnText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={acceptIncomingCall}>
              <Text style={styles.btnText}>{incomingCall.kind === "video" ? "📹" : "📞"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 28, alignItems: "center", gap: 10, width: "100%", maxWidth: 360 },
  avatar: { width: 88, height: 88, borderRadius: 44, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700", color: "#111", marginTop: 6 },
  subtitle: { fontSize: 14, color: "#555" },
  actions: { flexDirection: "row", gap: 32, marginTop: 18 },
  btn: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  btnReject: { backgroundColor: "#ef4444" },
  btnAccept: { backgroundColor: "#10b981" },
  btnText: { fontSize: 26 },
});
