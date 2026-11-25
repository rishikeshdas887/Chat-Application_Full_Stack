package com.rishikesh.chat.dto;

import com.rishikesh.chat.enums.ConversationType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

//stop accepting database Conversation entity directly from frontend
public class CreateConversationRequest {
    @NotNull(message = "Conversation type is required")

    private ConversationType type;
    @Size(max = 100, message = "Conversation name cannot exceed 100 characters")
    private String name;

    public String getName() {
        return name;
    }

    public ConversationType getType() {
        return type;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setType(ConversationType type) {
        this.type = type;
    }
}
