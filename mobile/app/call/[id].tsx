import React, { useCallback, useEffect, useRef } from "react";
import { View, ActivityIndicator, Text, StyleSheet, Platform } from "react-native";
import { router } from "expo-router";
import { useCall } from "@/lib/call-context";
import { buildCallHtml } from "@/lib/call-html";

let WebView: React.ComponentType<any> | null = null;

if (Platform.OS !== "web") {
  try {
    WebView = require("react-native-webview").WebView;
  } catch { WebView = null; }
}

export default function CallScreen() {
  const { activeCall, endCall } = useCall();
  const endCallRef = useRef(endCall);
  useEffect(() => { endCallRef.current = endCall; }, [endCall]);

  useEffect(() => {
    if (!activeCall) router.back();
  }, [activeCall]);

  const handleMessage = useCallback((e: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type: string; url?: string; msg?: string; domain?: string; peerId?: string };
      if (msg.type === "debug") {
        console.log("[CALL DEBUG]", JSON.stringify(msg));
        return;
      }
      if (msg.type === "call-ended") endCallRef.current();
    } catch {}
  }, []);

  if (!activeCall) return <View style={styles.root} />;

  if (!WebView) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center", padding: 32 }]}>
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
          Appel vidéo non disponible dans cet environnement.{"\n"}
          Veuillez utiliser Expo Go sur votre téléphone.
        </Text>
      </View>
    );
  }

  const url = activeCall.webViewUrl;

  if (!url) {
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center", gap: 16 }]}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 15 }}>Connexion à l'appel…</Text>
      </View>
    );
  }

  const urlObj = new URL(url);
  const token = urlObj.searchParams.get("token") || "";
  const callId = urlObj.searchParams.get("callId") || "";
  const peerId = urlObj.searchParams.get("peerId") || "";
  const peerName = decodeURIComponent(urlObj.searchParams.get("peerName") || "");
  const direction = urlObj.searchParams.get("direction") || "outgoing";
  const kind = urlObj.searchParams.get("kind") || "video";
  const domain = urlObj.searchParams.get("domain") || "";

  console.log("[CALL] url=", url);
  console.log("[CALL] token=", token ? token.substring(0, 20) + "..." : "VIDE");
  console.log("[CALL] peerId=", peerId);
  console.log("[CALL] domain=", domain);

  const html = buildCallHtml({ token, callId, peerId, peerName, direction, kind, domain });

  return (
    <View style={styles.root}>
      <WebView
        source={{ html, baseUrl: "https://localhost" }}
        style={{ flex: 1 }}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        onMessage={handleMessage}
        allowFileAccess={true}
        domStorageEnabled={true}
        allowsProtectedMedia={true}
        mixedContentMode="always"
        originWhitelist={["*"]}
        geolocationEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0a0a" },
});