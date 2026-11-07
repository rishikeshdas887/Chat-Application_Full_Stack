package com.rishikesh.chat.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rishikesh.chat.entity.ConversationParticipant;
import com.rishikesh.chat.service.ConversationParticipantService;

@RestController
@RequestMapping("/api/conversations/{conversationId}/participants")

public class ConversationParticipantController {
    private final ConversationParticipantService participantService;

    public ConversationParticipantController(ConversationParticipantService particpantService) {
        this.participantService = particpantService;
    }

    // add participant
    @PostMapping
    public ConversationParticipant addParticipant(
            @PathVariable Long conversationId,
            @RequestParam Long userId) {
        return participantService.addParticipant(conversationId, userId);
    }

    // get all participants of a convo

    @GetMapping
    public List<ConversationParticipant> getParticipants(
            @PathVariable // extract convo id and user id from url
            Long conversationId) {
        return participantService.getParticipants(conversationId);
    }

    // check membership of a user in convo
    @GetMapping("/{userId}/check")
    public boolean isParticipant(
            @PathVariable Long conversationId,
            @PathVariable Long userId) {
        return participantService.isParticipant(conversationId, userId);
    }

    // remove participant from a convo
    @DeleteMapping("/{userId}")

    public void deleteParticipant(
            @PathVariable Long conversationId,
            @PathVariable Long userId) {
        participantService.removeParticipant(conversationId, userId);
    }

}
