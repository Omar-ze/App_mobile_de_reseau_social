package com.chatapp.repository;

import com.chatapp.entity.Conversation;
import com.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    @Query("SELECT c FROM Conversation c WHERE (c.userA = :a AND c.userB = :b) OR (c.userA = :b AND c.userB = :a)")
    Optional<Conversation> findByPair(@Param("a") User a, @Param("b") User b);

    @Query("SELECT c FROM Conversation c WHERE c.userA = :user OR c.userB = :user ORDER BY COALESCE(c.lastMessageAt, c.createdAt) DESC")
    List<Conversation> findAllByUser(@Param("user") User user);
}
