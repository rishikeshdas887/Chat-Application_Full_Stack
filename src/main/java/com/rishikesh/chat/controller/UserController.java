//Hanle user-related APIs

package com.rishikesh.chat.controller;

import com.rishikesh.chat.entity.User;
import com.rishikesh.chat.service.UserService;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController // tells spring that this class handles HTTP request and return responses

public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;

    }

    @PostMapping("/api/users")
    public String registerUser(@RequestBody User user) {

        User savedUser = userService.saveUser(user);
        return "User registered successfully. ID:" + savedUser.getId();
    }

}