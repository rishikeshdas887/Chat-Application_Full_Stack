package com.rishikesh.chat.dto;

//DTO IS USED TO SEND DATA TO FRONTEND,IT'S A RESPONSIVE OBJECT 
import java.time.LocalDateTime;
import com.rishikesh.chat.entity.User;

public class UserResponse {
    private Long id;
    private String username;
    private String phoneNumber;
    private LocalDateTime createdAt;

    public UserResponse(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.phoneNumber = user.getPhoneNumber();
        this.createdAt = user.getCreatedAt();

    }

    // getters
    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    } // controller ko username read krne dega

    // setters

    public void setUsername(String username) {
        this.username = username;
        // Incoming JSON se username set krega
    }

}
