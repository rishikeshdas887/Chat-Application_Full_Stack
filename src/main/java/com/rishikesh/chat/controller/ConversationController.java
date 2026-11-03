//Creates and retrieves conversations 

// Logic : Chat between two that is private  it receives request and COnversationService ko forward krega 

//controller is business  logic ko isi naam ka service ko forward krega

package com.rishikesh.chat.controller;

import com.rishikesh.chat.entity.Conversation;
import com.rishikesh.chat.service.ConversationService;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;

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

  @GetMapping("{conversationId}")
  public Conversation getConversation(@PathVariable Long conversationId) {
    return conversationService.getConversation(conversationId);
  }

  @PutMapping("{conversationId}") // conversation update krne ka method
  public Conversation putConversation(@PathVariable Long conversationId,
      @RequestBody Conversation conversation) {
    return conversationService.updateConversation(conversationId, conversation);

    // @PathVariable kaunsi conversation update krni h
    // @RequestBody updated details kya hain

  }

  @DeleteMapping("{conversationId}") // conversation delete krne ka method
  public void deleteConversation(@PathVariable Long conversationId) { // long assuming entity id is long
    conversationService.deleteConversation(conversationId);

  }

}
