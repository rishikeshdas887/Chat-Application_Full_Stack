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

    public UserController(UserService userService) {  //constructor dependency injection 
        this.userService = userService;

    }

    @PostMapping("/api/users") //HTTP POST request receive karega
    public String registerUser(@RequestBody User user) { //Frontend se anne wale JSON Ko java object mein convert karega

        User savedUser = userService.saveUser(user);//Service ko user ssave krne k liye call kiya 
        return "User registered successfully. ID:" + savedUser.getId();
    }

}

// FRONTEND JSON --> User Controller --> User Service --> User Repository --> PostgreSQL