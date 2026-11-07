//conversation mein participants ke liye repository , 
//check user is memebr of any convo 
//database operations provide karna participants ko add/remove karne k liye

package com.rishikesh.chat.repository;
import  com.rishikesh.chat.entity.ConversationParticipant;
impor org.springframework.data.jpa.repository.JpaRepository;


public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, Long> {
    
}
