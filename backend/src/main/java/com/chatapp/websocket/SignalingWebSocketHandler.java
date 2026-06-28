package com.chatapp.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class SignalingWebSocketHandler extends TextWebSocketHandler {
    private final Map<String, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    private final ObjectMapper mapper = new ObjectMapper();

    private static final Set<String> RELAY_TYPES = Set.of(
        "call-invite","call-accept","call-reject","call-end","call-ready",
        "webrtc-offer","webrtc-answer","ice-candidate"
    );

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String username = getUsername(session);
        userSessions.computeIfAbsent(username, k -> ConcurrentHashMap.newKeySet()).add(session);
        log.info("WS connected: {}", username);
        safeSend(session, Map.of("type","ready","userId",username));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Map<String,Object> msg;
        try {
            msg = mapper.readValue(message.getPayload(), Map.class);
        } catch (Exception e) { return; }

        String type = (String) msg.get("type");
        if (type == null) return;

        if ("ping".equals(type)) {
            safeSend(session, Map.of("type","pong"));
            return;
        }

        if (!RELAY_TYPES.contains(type)) return;

        String to = (String) msg.get("to");
        if (to == null || to.isEmpty()) return;

        String from = getUsername(session);
        Map<String,Object> forward = new HashMap<>(msg);
        forward.put("from", from);
        forward.remove("to");

        boolean sent = sendTo(to, forward);
        if (!sent) {
            safeSend(session, Map.of("type","peer-offline","to",to,
                "callId", msg.getOrDefault("callId","")));
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String username = getUsername(session);
        Set<WebSocketSession> set = userSessions.get(username);
        if (set != null) {
            set.remove(session);
            if (set.isEmpty()) userSessions.remove(username);
        }
        log.info("WS disconnected: {}", username);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.warn("WS error for {}: {}", getUsername(session), exception.getMessage());
    }

    private String getUsername(WebSocketSession session) {
        Object val = session.getAttributes().get("username");
        return val != null ? val.toString() : "unknown";
    }

    private boolean sendTo(String username, Map<String,Object> payload) {
        Set<WebSocketSession> set = userSessions.get(username);
        if (set == null || set.isEmpty()) return false;
        boolean sent = false;
        for (WebSocketSession s : set) {
            if (s.isOpen()) {
                safeSend(s, payload);
                sent = true;
            }
        }
        return sent;
    }

    private void safeSend(WebSocketSession session, Object payload) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(mapper.writeValueAsString(payload)));
            }
        } catch (IOException e) {
            log.warn("Send failed: {}", e.getMessage());
        }
    }
}
