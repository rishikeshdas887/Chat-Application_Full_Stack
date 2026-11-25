package com.rishikesh.chat.repository;

import com.rishikesh.chat.entity.OtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, Long> {

    Optional<OtpChallenge> findByChallengeId(String challengeId);

    List<OtpChallenge> findByPhoneNumberAndUsedFalse(String phoneNumber);

    long countByPhoneNumberAndCreatedAtAfter(String phoneNumber, LocalDateTime after);
}
