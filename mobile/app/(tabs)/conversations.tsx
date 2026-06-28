import React, { useEffect } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Conversation {
  id: number;
  otherUser: { id: number; username: string; displayName: string; avatarColor: string };
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
}

export default function ConversationsScreen() {
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading]);

  const { data, isLoading, refetch, isRefetching } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => api.get("/api/chat/conversations").then(r => r.data),
    refetchInterval: 3000,
    enabled: !!user,
  });

  if (authLoading || isLoading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={i => String(i.id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#10b981" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>Aucune conversation</Text>
            <Text style={styles.emptyHint}>Allez dans Contacts pour démarrer une discussion</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: String(item.id), otherUserId: item.otherUser.username, otherName: item.otherUser.displayName } })}
          >
            <View style={[styles.avatar, { backgroundColor: item.otherUser.avatarColor }]}>
              <Text style={styles.avatarText}>{item.otherUser.displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.otherUser.displayName}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {item.lastMessagePreview ?? "Pas encore de messages"}
              </Text>
            </View>
            {item.lastMessageAt && (
              <Text style={styles.time}>
                {new Date(item.lastMessageAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  title: { fontSize: 28, fontWeight: "700", color: "#111" },
  item: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f9fafb", gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  name: { fontSize: 16, fontWeight: "600", color: "#111" },
  preview: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  time: { fontSize: 11, color: "#9ca3af" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, marginTop: 80, gap: 10 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#374151" },
  emptyHint: { fontSize: 14, color: "#6b7280", textAlign: "center" },
});
