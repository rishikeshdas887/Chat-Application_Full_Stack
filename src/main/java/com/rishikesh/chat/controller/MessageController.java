//Handles message-related REST APIs
package com.rishikesh.chat.controller;

import com.rishikesh.chat.entity.Conversation;
import com.rishikesh.chat.entity.Message;

import com.rishikesh.chat.service.MessageService;

import org.springframework.web.bind.annotation.RestController; //http recieves request and gives responses
import org.springframework.web.bind.annotation.RequestMapping; //conversation ke messages ka common URL

//send message api 

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;

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
            @RequestBody Message message) {
        return messageService.sendMessage(conversationId, message);
    }
}
