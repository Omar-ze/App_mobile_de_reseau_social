package com.chatapp.config;

import com.chatapp.websocket.SignalingHandshakeInterceptor;
import com.chatapp.websocket.SignalingWebSocketHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {
    private final SignalingWebSocketHandler signalingHandler;
    private final SignalingHandshakeInterceptor handshakeInterceptor;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(signalingHandler, "/ws/signal")
            .addInterceptors(handshakeInterceptor)
            .setAllowedOriginPatterns("*");
    }
}
