package com.rishikesh.chat.dto;

import java.time.LocalDateTime;
import com.rishikesh.chat.enums.MessageType;
import com.rishikesh.chat.entity.Message;

//frontend ko message ki safe details return krna , directly Message database entity exponse nhi karna hai 
public class MessageResponse {

    private Long id;
    private String content;
    private Long senderId;
    private String senderUsername;
    private Long conversationId;
    private LocalDateTime createdAt;
    private MessageType type;

    public MessageResponse(Message message) {

        this.id = message.getId();
        this.content = message.getContent();

        this.senderId = message.getSender().getId();
        this.senderUsername = message.getSender().getUsername();

        this.conversationId = message.getConversation().getId();

        this.createdAt = message.getCreatedAt();
        this.type = message.getType();
    }

    public Long getId() {
        return id;
    }

    public String getContent() {
        return content;
    }

    public Long getSenderId() {
        return senderId;
    }

    public String getSenderUsername() {
        return senderUsername;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public MessageType getType() {
        return type;
    }

}
