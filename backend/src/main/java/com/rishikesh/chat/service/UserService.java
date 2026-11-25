package com.rishikesh.chat.service;

//Importing the user entity
import com.rishikesh.chat.entity.User;

//import Userepository
import com.rishikesh.chat.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
//marks this class as a service 
import org.springframework.stereotype.Service;
import com.rishikesh.chat.dto.RegisterUserRequest;
import com.rishikesh.chat.exception.DuplicateResourceException;
import com.rishikesh.chat.exception.ResourceNotFoundException;

@Service // telling spring that this class is containing a business logic

public class UserService {

    private final UserRepository userRepository; // connecting service-> DB
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // takes a user ->sends to repo->repo sends to DB

    // Overall Logic--> UserService -> UserRepository, PostgreSQL

    // get user by id
    public User getUserById(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    // get user by phone number
    public User getUserByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new ResourceNotFoundException("User not found "));

    }

    // get user by username
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
    }

    public User updateUserProfile(Long userId, String updatedUsername) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setUsername(updatedUsername);
        return userRepository.save(user);

    }

    // abb register user method implement karna hai
    public User registerUser(RegisterUserRequest request) {

        // 1.check duplicate phone number
        if (userRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()) {
            throw new DuplicateResourceException("Phone number already registered");
        }

        // 2.create user object
        User user = new User();

        // set user details

        user.setUsername(request.getUsername());
        user.setPhoneNumber(request.getPhoneNumber());

        // Hash Password
        user.setHashedPassword(passwordEncoder.encode(request.getPassword()));

        // Save user in database
        return userRepository.save(user);

    }

}
