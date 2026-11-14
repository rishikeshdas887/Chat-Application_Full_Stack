
//registration mein input validation and unique phone number db constraint add karenge 

package com.rishikesh.chat.config;

import org.springframework.context.annotation.Bean; //passwrd encoder ka object sring containe rmein register krega 
import org.springframework.context.annotation.Configuration; //tells sring this is a configuration class 
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; //password is secujredly hashed 
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
