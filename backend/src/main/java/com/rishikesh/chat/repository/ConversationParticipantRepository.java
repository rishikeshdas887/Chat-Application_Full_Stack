//conversation mein participants ke liye repository , 
//check user is memebr of any convo 
//database operations provide karna participants ko add/remove karne k liye

package com.rishikesh.chat.repository;

import com.rishikesh.chat.entity.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, Long> {
    List<ConversationParticipant> findByConversation_Id(Long conversationId); // get all members

    Optional<ConversationParticipant> findByConversation_IdAndUser_Id(Long conversationId, Long userId); // find a
                                                                                                         // particular
                                                                                                         // member of a
                                                                                                         // convo

    boolean existsByConversation_IdAndUser_Id(Long conversationId, Long userId); // check membership of user
}
