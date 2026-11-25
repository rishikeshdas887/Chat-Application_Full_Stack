package com.rishikesh.chat.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rishikesh.chat.entity.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByConversation_Id(Long conversationId);
}
