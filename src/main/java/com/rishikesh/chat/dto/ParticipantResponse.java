package com.rishikesh.chat.dto;

import java.time.LocalDateTime;
import com.rishikesh.chat.enums.ParticipantRole;

public class ParticipantResponse {

    private Long id;
    private Long userId;
    private String username;
    private Long conversationId;
    private ParticipantRole role;
    private LocalDateTime joinedAt;

}

public ParticipantResponse(ConversationParticipant participant) {
 this.id=participant.getId();
 this.userId=participant.getUser().getId();
 this.username=participant.getUser().getUsername();
 this.conversationId=participant.getConversation().getId();
 this.role=participant.getRole();
 this.joinedAt=participant.getJoinedAt();

}