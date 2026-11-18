package com.rishikesh.chat.dto;

import java.time.LocalDateTime;
import com.rishikesh.chat.enums.ConversationType;
import com.rishikesh.chat.entity.Conversation;

public class ConversationResponse {

    private Long id;
    private ConversationType type;
    private String name;
    private LocalDateTime createdAt;

    public ConversationResponse(Conversation conversation) {

        this.id = conversation.getId();
        this.type = conversation.getType();
        this.name = conversation.getName();
        this.createdAt = conversation.getCreatedAt();

    }

    public Long getId() {
        return id;
    }

    public ConversationType getType() {
        return type;
    }

    public String getName() {
        return name;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

}
