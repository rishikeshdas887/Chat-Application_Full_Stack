//checks whetether backend is runningn successfully or not 

package com.rishikesh.chat.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController // tells spring that this class handles HTTP request and return responses

public class HealthController {

    @GetMapping("/api/health") // this annotaton is the definition that GET request on URL executes the below
                               // method

    public String checkHealth() {
        return "Backend is running  successfully";
    }

}
