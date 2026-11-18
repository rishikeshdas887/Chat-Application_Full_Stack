package com.rishikesh.chat.dto;

import com.rishikesh.chat.enums.ConversationType;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateConversationRequest {
    @NotNull(message = "Conversation type is required")
    private ConversationType type;

    @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;

    // Getters
    public ConversationType getType() {
        return type;
    }

    public String getName() {
        return name;
    }

    // Setters
    public void setType(ConversationType type) {
        this.type = type;
    }

    public void setName(String name) {
        this.name = name;
    }
}
