package com.rishikesh.chat.dto;

import com.rishikesh.chat.enums.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SendMessageRequest {
    @NotBlank(message = "Message content cannot be empty")
    private String content;

    @NotNull(message = "Message type is required")

    private MessageType type;

    public String getContent() {
        return content;
    }

    public MessageType getType() {
        return type;
    }

    // setters-------------->

    public void setContent(String content) {
        this.content = content;
    }

    public void setType(MessageType type) {
        this.type = type;
    }
    
}
