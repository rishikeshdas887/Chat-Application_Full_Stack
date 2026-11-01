//Creates and retrieves conversations 

// Logic : Chat between two that is private  it receives request and COnversationService ko forward krega 

//controller is sbysiness  logic ko isi naam ka service ko forward krega

package com.rishikesh.chat.controller;

import com.rishikesh.chat.entity.User;
import com.rishikesh.chat.service.UserService;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
// tells spring that this class handles HTTP request and return responses

@RequestMapping("/api/conversations")
public class ConversationController {
    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @PostMapping
    public Conversation createConversation(@RequestBody Conversation conversation) {
        return conversationService.createConversation(conversation);
    }

}
