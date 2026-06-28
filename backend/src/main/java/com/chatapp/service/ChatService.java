package com.chatapp.service;

import com.chatapp.dto.*;
import com.chatapp.entity.*;
import com.chatapp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final UserRepository userRepo;
    private final ConversationRepository convRepo;
    private final MessageRepository msgRepo;

    public List<UserDto> listUsers(String currentUsername) {
        return userRepo.findByUsernameNot(currentUsername)
            .stream().map(AuthService::toDto).toList();
    }

    @Transactional
    public ConversationDto findOrCreateConversation(String currentUsername, Long targetUserId) {
        User me = userRepo.findByUsername(currentUsername).orElseThrow();
        User other = userRepo.findById(targetUserId)
            .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable"));

        // Normalize: userA has smaller id
        User a = me.getId() < other.getId() ? me : other;
        User b = me.getId() < other.getId() ? other : me;

        Conversation conv = convRepo.findByPair(a, b).orElseGet(() -> {
            Conversation c = Conversation.builder().userA(a).userB(b).build();
            return convRepo.save(c);
        });
        return toDto(conv, me);
    }

    public List<ConversationDto> listConversations(String currentUsername) {
        User me = userRepo.findByUsername(currentUsername).orElseThrow();
        return convRepo.findAllByUser(me).stream()
            .map(c -> toDto(c, me)).toList();
    }

    @Transactional
    public MessageDto sendMessage(String currentUsername, Long convId, String text) {
        User me = userRepo.findByUsername(currentUsername).orElseThrow();
        Conversation conv = convRepo.findById(convId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation introuvable"));

        // Verify access
        if (!conv.getUserA().getId().equals(me.getId()) && !conv.getUserB().getId().equals(me.getId()))
            throw new SecurityException("Accès refusé");

        Message msg = Message.builder()
            .conversation(conv)
            .sender(me)
            .text(text)
            .build();
        msg = msgRepo.save(msg);

        conv.setLastMessageAt(LocalDateTime.now());
        conv.setLastMessagePreview(text.length() > 80 ? text.substring(0, 80) + "…" : text);
        convRepo.save(conv);

        return toMsgDto(msg);
    }

    public List<MessageDto> listMessages(String currentUsername, Long convId) {
        User me = userRepo.findByUsername(currentUsername).orElseThrow();
        Conversation conv = convRepo.findById(convId)
            .orElseThrow(() -> new IllegalArgumentException("Conversation introuvable"));

        if (!conv.getUserA().getId().equals(me.getId()) && !conv.getUserB().getId().equals(me.getId()))
            throw new SecurityException("Accès refusé");

        return msgRepo.findByConversationOrderByCreatedAtAsc(conv)
            .stream().map(this::toMsgDto).toList();
    }

    private ConversationDto toDto(Conversation c, User me) {
        User other = c.getUserA().getId().equals(me.getId()) ? c.getUserB() : c.getUserA();
        return ConversationDto.builder()
            .id(c.getId())
            .otherUser(AuthService.toDto(other))
            .lastMessageAt(c.getLastMessageAt())
            .lastMessagePreview(c.getLastMessagePreview())
            .build();
    }

    private MessageDto toMsgDto(Message m) {
        return MessageDto.builder()
            .id(m.getId())
            .conversationId(m.getConversation().getId())
            .sender(AuthService.toDto(m.getSender()))
            .text(m.getText())
            .createdAt(m.getCreatedAt())
            .build();
    }
}
