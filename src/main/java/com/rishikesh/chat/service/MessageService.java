package com.rishikesh.chat.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.rishikesh.chat.entity.Conversation;
import com.rishikesh.chat.entity.Message;
import com.rishikesh.chat.entity.User;
import com.rishikesh.chat.repository.ConversationRepository;
import com.rishikesh.chat.repository.MessageRepository;
import com.rishikesh.chat.repository.UserRepository;

@Service

public class MessageService {
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageService(ConversationRepository conversationRepository, MessageRepository messageRepository,
            UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    public Message sendMessage(Long conversationId, Message message, Long userId) {

        Conversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation cannot be found now "));

        User user = userRepository.findById(userId) // message kis user id ne bheja database se find krna
                .orElseThrow(() -> new RuntimeException("User not found " + userId));
        message.setConversation(conversation);
        message.setSender(user);

        // message knows of which conversaiton part he is

        return messageRepository.save(message);

        // validation
    }

    public List<Message> getMessages(Long conversationId) {
        conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found with ID:" + conversationId));

        return messageRepository.findByConversation_Id(conversationId);
    }

    public Message editMessage(String newContent, Long messageId, Long userId) {

        // find the message
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message Not Found"));

        // check whether this user owns the message or not

        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("User is not authroized to edit this message");

        }

        // update the message content
        message.setContent(newContent);

        // update the message in the database
        return messageRepository.save(message);

    }

    public void deleteMessage(Long messageId, Long userId) {

        // find the message
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message Not Found"));

        // check message ownership

        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("User is not authroized to delete this message");

        }

        // delete the message content
        messageRepository.delete(message);

    }

}
