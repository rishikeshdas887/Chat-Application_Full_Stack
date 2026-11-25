//Handles message-related REST APIs
package com.rishikesh.chat.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping; //http recieves request and gives responses
import org.springframework.web.bind.annotation.RequestParam; //conversation ke messages ka common URL
import org.springframework.web.bind.annotation.RestController;

import com.rishikesh.chat.entity.Message;
import com.rishikesh.chat.dto.SendMessageRequest;
import jakarta.validation.Valid;
import com.rishikesh.chat.service.MessageService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import com.rishikesh.chat.dto.MessageResponse;

@RequestMapping("/api/conversations/{conversationId}/messages")
@RestController
public class MessageController {
    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    
    @PostMapping
    public MessageResponse sendMessage(
        @PathVariable("conversationId")Long conversationId,
        @RequestParam("userId")Long userId,
        @Valid @RequestBody SendMessageRequest request) {
            Message message =new Message();
            message.setContent(request.getContent());
            message.setType(request.getType());
        Message savedMessage =
            messageService.sendMessage(conversationId, message, userId);

    return new MessageResponse(savedMessage);
    }
    @GetMapping
public List<MessageResponse> getMessages(
        @PathVariable("conversationId") Long conversationId) {

    return messageService.getMessages(conversationId)
            .stream()
            .map(MessageResponse::new)
            .toList();
}

}
