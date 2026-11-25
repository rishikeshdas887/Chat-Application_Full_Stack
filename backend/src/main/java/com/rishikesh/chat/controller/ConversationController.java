package com.rishikesh.chat.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rishikesh.chat.dto.ConversationResponse;
import com.rishikesh.chat.dto.CreateConversationRequest;
import com.rishikesh.chat.dto.UpdateConversationRequest;
import com.rishikesh.chat.entity.Conversation;
import com.rishikesh.chat.service.ConversationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

  private final ConversationService conversationService;

  public ConversationController(ConversationService conversationService) {
    this.conversationService = conversationService;
  }

  // Create conversation
  @PostMapping
  public ConversationResponse createConversation(
      @Valid @RequestBody CreateConversationRequest request) {

    Conversation conversation = new Conversation();

    conversation.setName(request.getName());
    conversation.setType(request.getType());

    Conversation savedConversation = conversationService.createConversation(conversation);

    return new ConversationResponse(savedConversation);
  }

  // Get conversation by ID
  @GetMapping("/{conversationId}")
  public ConversationResponse getConversation(
      @PathVariable Long conversationId) {

    Conversation conversation = conversationService.getConversation(conversationId);

    return new ConversationResponse(conversation);
  }

  // Update conversation
  @PutMapping("/{conversationId}")
  public ConversationResponse updateConversation(
      @PathVariable Long conversationId,
      @Valid @RequestBody UpdateConversationRequest request) {
    Conversation conversation = new Conversation();

    conversation.setName(request.getName());
    conversation.setType(request.getType());

    Conversation updatedConversation = conversationService.updateConversation(
        conversationId, conversation);

    return new ConversationResponse(updatedConversation);
  }

  // Delete conversation
  @DeleteMapping("/{conversationId}")
  public void deleteConversation(
      @PathVariable Long conversationId) {

    conversationService.deleteConversation(conversationId);
  }
}