import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useCall } from "@/lib/call-context";

interface Message {
  id: number;
  sender: { id: number; username: string; displayName: string; avatarColor: string };
  text: string;
  createdAt: string;
}

export default function ChatScreen() {
  const { id, otherUserId, otherName } = useLocalSearchParams<{ id: string; otherUserId: string; otherName: string }>();
  const { user } = useAuth();
  const { startCall } = useCall();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  const { data, isLoading } = useQuery<Message[]>({
    queryKey: ["messages", id],
    queryFn: () => api.get(`/api/chat/conversations/${id}/messages`).then(r => r.data),
    refetchInterval: 2500,
    enabled: !!id,
  });

  const messages = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (txt: string) =>
      api.post(`/api/chat/conversations/${id}/messages`, { text: txt }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = () => {
    const t = text.trim();
    if (!t || sendMutation.isPending) return;
    setText("");
    sendMutation.mutate(t);
  };

  const handleCall = (kind: "audio" | "video") => {
    if (!otherUserId) return;
    startCall(otherUserId, otherName ?? "Correspondant", kind);
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerName} numberOfLines={1}>{otherName ?? "Conversation"}</Text>
        <View style={styles.callBtns}>
          <TouchableOpacity style={styles.callBtn} onPress={() => handleCall("audio")}>
            <Ionicons name="call-outline" size={22} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.callBtn} onPress={() => handleCall("video")}>
            <Ionicons name="videocam-outline" size={24} color="#10b981" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color="#10b981" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => String(m.id)}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={{ fontSize: 40 }}>👋</Text>
              <Text style={{ color: "#6b7280", marginTop: 8 }}>Commencez la conversation !</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.sender.id === user?.id;
            return (
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                {!isMe && <Text style={styles.bubbleSender}>{item.sender.displayName}</Text>}
                <Text style={[styles.bubbleText, isMe && { color: "#fff" }]}>{item.text}</Text>
                <Text style={[styles.bubbleTime, isMe && { color: "rgba(255,255,255,0.75)" }]}>
                  {new Date(item.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          }}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", gap: 10 },
  backBtn: { padding: 4 },
  headerName: { flex: 1, fontSize: 17, fontWeight: "700", color: "#111" },
  callBtns: { flexDirection: "row", gap: 4 },
  callBtn: { padding: 8 },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 18 },
  bubbleMe: { alignSelf: "flex-end", backgroundColor: "#10b981", borderBottomRightRadius: 4 },
  bubbleOther: { alignSelf: "flex-start", backgroundColor: "#f3f4f6", borderBottomLeftRadius: 4 },
  bubbleSender: { fontSize: 11, fontWeight: "600", color: "#6b7280", marginBottom: 2 },
  bubbleText: { fontSize: 15, color: "#111" },
  bubbleTime: { fontSize: 10, color: "#9ca3af", marginTop: 4, alignSelf: "flex-end" },
  emptyChat: { alignItems: "center", justifyContent: "center", padding: 60 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 10, paddingBottom: Platform.OS === "ios" ? 28 : 10, borderTopWidth: 1, borderTopColor: "#f3f4f6", gap: 8 },
  input: { flex: 1, borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: "#111", maxHeight: 120 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#10b981", justifyContent: "center", alignItems: "center" },
});
