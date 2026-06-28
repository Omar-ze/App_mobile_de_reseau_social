package com.chatapp.controller;

import com.chatapp.dto.*;
import com.chatapp.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> listUsers(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(chatService.listUsers(ud.getUsername()));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDto>> listConversations(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(chatService.listConversations(ud.getUsername()));
    }

    @PostMapping("/conversations")
    public ResponseEntity<ConversationDto> createConversation(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody CreateConversationRequest req) {
        return ResponseEntity.ok(chatService.findOrCreateConversation(ud.getUsername(), req.getTargetUserId()));
    }

    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<MessageDto>> listMessages(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        return ResponseEntity.ok(chatService.listMessages(ud.getUsername(), id));
    }

    @PostMapping("/conversations/{id}/messages")
    public ResponseEntity<MessageDto> sendMessage(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestBody SendMessageRequest req) {
        return ResponseEntity.ok(chatService.sendMessage(ud.getUsername(), id, req.getText()));
    }
}
