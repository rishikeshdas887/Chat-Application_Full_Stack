package com.rishikesh.chat.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.rishikesh.chat.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

}
