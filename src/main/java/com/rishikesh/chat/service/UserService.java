package com.rishikesh.chat.service;

//Importing the user entity
import com.rishikesh.chat.entity.User;

//import Userepository
import com.rishikesh.chat.repository.UserRepository;

//marks this class as a service 
import org.springframework.stereotype.Service;
import com.rishikesh.chat.dto.RegisterUserRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service // telling spring that this class is containing a business logic

public class UserService {

    private final UserRepository userRepository; // connecting service-> DB
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // takes a user ->sends to repo->repo sends to DB
    public User saveUser(User user) {
        return userRepository.save(user);
    }
    // Overall Logic--> UserService -> UserRepository, PostgreSQL

    // get user by id
    public User getUserById(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new RuntimeException("Can't find the user"));
    }

    // get user by phone number
    public User getUserByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber).orElseThrow(() -> new RuntimeException("User not found "));

    }

    public User updateUserProfile(Long userId, String updatedUsername) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setUsername(updatedUsername);
        return userRepository.save(user);

    }

    // abb register user method implement karna hai
    public User registerUser(RegisterUserRequest request) {

        // 1.check duplicate phone number
        if (userRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()) {
            throw new RuntimeException("Phone number already registered");
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
