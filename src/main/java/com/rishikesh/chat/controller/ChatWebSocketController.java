//receiwve and broadcast messages 
package com.rishikesh.chat.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.rishikesh.chat.entity.Message;
import com.rishikesh.chat.service.MessageService;

@Controller
public class ChatWebSocketController {
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatWebSocketController(
            MessageService messageService,
            SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/conversations/{conversationId}/send")
    public void sendMessage(
            @DestinationVariable Long conversationId,
            Message message,
            Principal principal) {

        Long userId = Long.valueOf(principal.getName());

        Message savedMessage = messageService.sendMessage(
                conversationId, message, userId);

        messagingTemplate.convertAndSend(
                "/topic/conversations/" + conversationId,
                savedMessage);
    }
}
