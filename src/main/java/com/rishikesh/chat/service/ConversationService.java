package com.rishikesh.chat.service;

//Importing the user entity
import com.rishikesh.chat.entity.Conversation;

//import Userepository
import com.rishikesh.chat.repository.ConversationRepository;

//marks this class as a service 
import org.springframework.stereotype.Service;

@Service // class ko service component ke roop mein manage karna hai
public class ConversationService {
    private final ConversationRepository conversationRepository;

    public ConversationService(ConversationRepository conversationRepository) {
        this.conversationRepository = conversationRepository;

    } // repository database se bat kregi and service uss repo ko use karke db
      // oeparations karwayegi

    public Conversation createConversation(Conversation conversation) {
        return conversationRepository.save(conversation);
    }

    public Conversation getConversation(Long conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found with ID:" + conversationId));
    }

    public Conversation updateConversation(Long conversationId, Conversation updatedConversation) {

        Conversation existingConversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found "));
        // existing conversation ki fields update karni hain
        existingConversation.setName(updatedConversation.getName());

        return conversationRepository.save(existingConversation);
    }

    public void deleteConversation(Long conversationId) {

        Conversation existingConversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found " + conversationId));

        // existing conversation ki fields update karni hain
        conversationRepository.delete(existingConversation);

    }

}
