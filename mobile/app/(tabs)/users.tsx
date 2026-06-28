import React from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { api } from "@/lib/api";

interface User {
  id: number;
  username: string;
  displayName: string;
  avatarColor: string;
}

export default function UsersScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => api.get("/api/chat/users").then(r => r.data),
  });

  const startConversation = useMutation({
    mutationFn: (targetUserId: number) =>
      api.post("/api/chat/conversations", { targetUserId }).then(r => r.data),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      router.push({
        pathname: "/chat/[id]",
        params: { id: String(conv.id), otherUserId: conv.otherUser.username, otherName: conv.otherUser.displayName },
      });
    },
    onError: () => Alert.alert("Erreur", "Impossible de démarrer la conversation."),
  });

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={i => String(i.id)}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyText}>Aucun autre utilisateur pour l'instant</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => startConversation.mutate(item.id)}>
            <View style={[styles.avatar, { backgroundColor: item.avatarColor }]}>
              <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.displayName}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
            <Text style={{ fontSize: 20 }}>💬</Text>
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
  username: { fontSize: 13, color: "#6b7280", marginTop: 1 },
  empty: { alignItems: "center", padding: 40, marginTop: 80, gap: 10 },
  emptyIcon: { fontSize: 56 },
  emptyText: { fontSize: 16, color: "#6b7280", textAlign: "center" },
});
