import axios from "axios";
import * as SecureStore from "expo-secure-store";

// ⚠️  IMPORTANT: Remplacez par l'adresse IP locale de votre PC
// Exemple Windows: http://192.168.1.10:8080
// Exemple Mac/Linux: http://192.168.1.10:8080
// NE PAS utiliser localhost (le téléphone ne peut pas atteindre localhost du PC)
export const API_BASE_URL = "http://192.168.100.14:8080";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getToken() {
  return SecureStore.getItemAsync("auth_token");
}
export async function saveToken(token: string) {
  return SecureStore.setItemAsync("auth_token", token);
}
export async function clearToken() {
  return SecureStore.deleteItemAsync("auth_token");
}
