//Handles message-related REST APIs
package com.rishikesh.chat.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping; //http recieves request and gives responses
import org.springframework.web.bind.annotation.RequestParam; //conversation ke messages ka common URL
import org.springframework.web.bind.annotation.RestController;

import com.rishikesh.chat.entity.Message;
import com.rishikesh.chat.service.MessageService;

@RequestMapping("/api/conversations/{conversationId}/messages")
@RestController
public class MessageController {
    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    public Message sendMessage(
            @PathVariable("conversationId") Long conversationId,
            @RequestParam("userId") Long userId,
            @RequestBody Message message) {
        return messageService.sendMessage(conversationId, message, userId);
    }
}
