package com.rishikesh.chat.service;

import org.springframework.stereotype.Service;

import com.rishikesh.chat.entity.Conversation;
import com.rishikesh.chat.entity.ConversationParticipant;
import com.rishikesh.chat.entity.User;
import com.rishikesh.chat.enums.ParticipantRole;
import com.rishikesh.chat.repository.ConversationParticipantRepository;
import com.rishikesh.chat.repository.ConversationRepository;
import com.rishikesh.chat.repository.UserRepository;
import java.util.List;

@Service
public class ConversationParticipantService {
    private final ConversationParticipantRepository participantRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;

    public ConversationParticipantService(
            ConversationParticipantRepository participantRepository,
            ConversationRepository conversationRepository,
            UserRepository userRepository) {
        this.participantRepository = participantRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;

    }

    // first business logic add a participant to a convo

    public ConversationParticipant addParticipant(Long conversationId, Long userId) {
        // check if conversation exists or not

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found "));

        // find user in Database
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found "));

        // check user is already a participant or not
        if (participantRepository.existsByConversation_IdAndUser_Id(conversationId, userId)) {
            throw new RuntimeException("User is already a participant");
        }

        // create participant object
        ConversationParticipant participant = new ConversationParticipant();

        // set conversation and user
        participant.setConversation(conversation);
        participant.setUser(user);

        // set role or assign role to user
        participant.setRole(ParticipantRole.MEMBER);

        // save participant to db
        return participantRepository.save(participant);

    }

    public List<ConversationParticipant> getParticipants(Long conversationId) {
        // check if conversation exists or not
        conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found "));

        return participantRepository.findByConversation_Id(conversationId);
    }

    public boolean isParticipant(Long conversationId, Long userId) {

        // check if a user is particularly a particpant of a convo or not
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found "));

        return participantRepository.existsByConversation_IdAndUser_Id(conversationId, userId);

    }

    // remove a participant from a conversation

    public void removeParticipant(Long conversationId, Long userId) {

        // check conversation exists or not

        conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found "));

        // find participant in the conversation
        ConversationParticipant participant = participantRepository
                .findByConversation_IdAndUser_Id(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Participant not found "));

        // remove participant from convo
        particpantRepository.delete(participant);

    }
}
