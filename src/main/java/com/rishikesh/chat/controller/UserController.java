//Hanle user-related APIs

package com.rishikesh.chat.controller;

import com.rishikesh.chat.entity.User;
import com.rishikesh.chat.service.UserService;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.rishikesh.chat.dto.UserResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PutMapping;
import com.rishikesh.chat.dto.UpdateUserRequest;
import com.rishikesh.chat.dto.RegisterUserRequest;
import jakarta.validation.Valid;

@RestController // tells spring that this class handles HTTP request and return responses

public class UserController {
    private final UserService userService;

    public UserController(UserService userService) { // constructor dependency injection
        this.userService = userService;

    }

    @PostMapping("/api/users") // HTTP POST request receive karega
    public UserResponse registerUser(@RequestBody @Valid RegisterUserRequest request) { // Frontend se anne wale JSON Ko
                                                                                        // java object mein convert
        // karega

        User savedUser = userService.registerUser(request);// Service ko user ssave krne k liye call kiya
        return new UserResponse(savedUser);
    }

    @GetMapping("/api/users/{userId}") // HTTP GET request receive karega
    public UserResponse getUserById(@PathVariable("userId") Long userId) {
        User user = userService.getUserById(userId);
        return new UserResponse(user);
    }

    @GetMapping("/api/users/phone")
    public UserResponse getUserByPhoneNumber(@RequestParam("phoneNumber") String phoneNumber) {
        User user = userService.getUserByPhoneNumber(phoneNumber);
        return new UserResponse(user);

    }

    @PutMapping("/api/users/{userId}")
    public UserResponse updateUserProfile(@PathVariable("userId") Long userId,
            @RequestBody UpdateUserRequest request) {

        User updateUser = userService.updateUserProfile(userId, request.getUsername());

        return new UserResponse(updateUser);
    }

}

// FRONTEND JSON --> User Controller --> User Service --> User Repository -->
// PostgreSQL