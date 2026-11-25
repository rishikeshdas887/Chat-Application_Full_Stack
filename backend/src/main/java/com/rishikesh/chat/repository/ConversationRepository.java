package com.rishikesh.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rishikesh.chat.entity.Conversation;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

}
