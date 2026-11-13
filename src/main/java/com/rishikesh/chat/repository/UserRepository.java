package com.rishikesh.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rishikesh.chat.entity.User;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhoneNumber(String phoneNumber); // find user by phone number
}
