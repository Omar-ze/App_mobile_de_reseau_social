import React, {
  createContext, useCallback, useContext, useEffect,
  useMemo, useRef, useState, type ReactNode,
} from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { API_BASE_URL } from "./api";
import { useAuth } from "./auth-context";

const WS_SIGNAL_PATH = "/ws/signal";

type CallKind = "video" | "audio";
type CallDirection = "incoming" | "outgoing";

interface IncomingCall {
  callId: string;
  from: string;
  fromName: string;
  kind: CallKind;
}

interface ActiveCall {
  callId: string;
  peerId: string;
  peerName: string;
  kind: CallKind;
  direction: CallDirection;
  state: "ringing" | "connecting" | "connected" | "ended";
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  errorMessage: string | null;
  webViewUrl: string | null;
}

interface CallContextValue {
  isConnected: boolean;
  incomingCall: IncomingCall | null;
  activeCall: ActiveCall | null;
  startCall: (peerId: string, peerName: string, kind: CallKind) => void;
  acceptIncomingCall: () => void;
  rejectIncomingCall: () => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

function genId() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

function buildWsUrl(token: string) {
  const base = API_BASE_URL.replace(/^http/, "ws");
  return `${base}${WS_SIGNAL_PATH}?token=${encodeURIComponent(token)}`;
}

function buildCallPageUrl(params: {
  token: string; callId: string; peerId: string; peerName: string;
  kind: CallKind; direction: CallDirection;
}) {
  const domain = API_BASE_URL.replace(/^https?:\/\//, "");
  const p = new URLSearchParams({
    token: params.token,
    callId: params.callId,
    peerId: params.peerId,
    peerName: encodeURIComponent(params.peerName),
    kind: params.kind,
    direction: params.direction,
    domain,
  });
  return `${API_BASE_URL}/call-page?${p.toString()}`;
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const activeCallRef = useRef<ActiveCall | null>(null);

  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

  const sendSignal = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try { ws.send(JSON.stringify(payload)); return true; } catch { return false; }
  }, []);

  const fullEnd = useCallback((notifyPeer: boolean) => {
    const cur = activeCallRef.current;
    if (cur && notifyPeer) sendSignal({ type: "call-end", to: cur.peerId, callId: cur.callId });
    setActiveCall(prev => prev ? { ...prev, state: "ended", localStream: null, remoteStream: null } : null);
    setTimeout(() => setActiveCall(null), 1500);
  }, [sendSignal]);

  // WebSocket connection
  useEffect(() => {
    if (!user) {
      wsRef.current?.close();
      wsRef.current = null;
      setIsConnected(false);
      return;
    }
    let cancelled = false;
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        if (cancelled || !token) return;
        ws = new WebSocket(buildWsUrl(token));
        wsRef.current = ws;
        ws.onopen = () => setIsConnected(true);
        ws.onclose = () => {
          setIsConnected(false);
          wsRef.current = null;
          if (!cancelled) retryTimer = setTimeout(connect, 3000);
        };
        ws.onerror = () => {};
        ws.onmessage = (event) => {
          let msg: Record<string, unknown>;
          try { msg = JSON.parse(event.data as string); } catch { return; }
          const type = msg["type"] as string;
          const cur = activeCallRef.current;

          if (type === "call-invite") {
            if (cur) { sendSignal({ type: "call-reject", to: msg["from"], callId: msg["callId"] }); return; }
            setIncomingCall({
              callId: msg["callId"] as string, from: msg["from"] as string,
              fromName: (msg["fromName"] as string) ?? "Inconnu",
              kind: (msg["kind"] as CallKind) ?? "video",
            });
            return;
          }

          const callId = msg["callId"] as string;

          if (type === "call-reject" && cur?.callId === callId) {
            setActiveCall(prev => prev ? { ...prev, state: "ended", errorMessage: "Appel refusé." } : prev);
            setTimeout(() => setActiveCall(null), 1500);
            return;
          }
          if (type === "call-end") {
            if (incomingCall?.callId === callId) setIncomingCall(null);
            if (cur?.callId === callId) {
              setActiveCall(prev => prev ? { ...prev, state: "ended", errorMessage: "Appel terminé." } : prev);
              setTimeout(() => setActiveCall(null), 1500);
            }
            return;
          }
          if (type === "peer-offline" && cur?.callId === callId) {
            setActiveCall(prev => prev ? { ...prev, state: "ended", errorMessage: "Correspondant hors ligne." } : prev);
            setTimeout(() => setActiveCall(null), 2500);
            return;
          }
        };
      } catch {
        if (!cancelled) retryTimer = setTimeout(connect, 3000);
      }
    };

    connect();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      ws?.close();
      wsRef.current = null;
      setIsConnected(false);
    };
  }, [user, incomingCall, sendSignal]);

  const startCall = useCallback((peerId: string, peerName: string, kind: CallKind) => {
    if (!user || activeCallRef.current) return;
    const callId = genId();
    const meName = user.displayName || user.username;
    const initialCall: ActiveCall = {
      callId, peerId, peerName, kind, direction: "outgoing",
      state: "ringing", localStream: null, remoteStream: null,
      errorMessage: null, webViewUrl: null,
    };
    setActiveCall(initialCall);
    activeCallRef.current = initialCall;
    sendSignal({ type: "call-invite", to: peerId, callId, kind, fromName: meName });

    SecureStore.getItemAsync("auth_token").then(token => {
      if (token) {
        const url = buildCallPageUrl({ token, callId, peerId, peerName, kind, direction: "outgoing" });
        setActiveCall(prev => prev ? { ...prev, webViewUrl: url } : prev);
      }
    });

    router.push({ pathname: "/call/[id]", params: { id: callId } });
  }, [sendSignal, user]);

  const acceptIncomingCall = useCallback(() => {
    const inc = incomingCall;
    if (!inc) return;
    setIncomingCall(null);
    const newCall: ActiveCall = {
      callId: inc.callId, peerId: inc.from, peerName: inc.fromName,
      kind: inc.kind, direction: "incoming", state: "connecting",
      localStream: null, remoteStream: null, errorMessage: null, webViewUrl: null,
    };
    setActiveCall(newCall);
    activeCallRef.current = newCall;

    // NE PAS envoyer call-accept ici — le WebView de l'appelé
    // envoie call-ready dès que son WebSocket s'ouvre,
    // ce qui déclenche sendOffer chez l'appelant
    // sendSignal({ type: "call-accept", to: inc.from, callId: inc.callId }); // SUPPRIMÉ

    SecureStore.getItemAsync("auth_token").then(token => {
      if (token) {
        const url = buildCallPageUrl({
          token, callId: inc.callId, peerId: inc.from,
          peerName: inc.fromName, kind: inc.kind, direction: "incoming",
        });
        setActiveCall(prev => prev ? { ...prev, webViewUrl: url } : prev);
      }
    });

    router.push({ pathname: "/call/[id]", params: { id: inc.callId } });
  }, [incomingCall, sendSignal]);

  const rejectIncomingCall = useCallback(() => {
    const inc = incomingCall;
    if (!inc) return;
    sendSignal({ type: "call-reject", to: inc.from, callId: inc.callId });
    setIncomingCall(null);
  }, [incomingCall, sendSignal]);

  const endCall = useCallback(() => fullEnd(true), [fullEnd]);

  const value = useMemo<CallContextValue>(() => ({
    isConnected, incomingCall, activeCall,
    startCall, acceptIncomingCall, rejectIncomingCall, endCall,
  }), [isConnected, incomingCall, activeCall, startCall, acceptIncomingCall, rejectIncomingCall, endCall]);

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}