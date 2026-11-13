package com.rishikesh.chat.exception;

public class DuplicateResourceException extends RuntimeException {

    // constructor takes error message and sper(message) sends it to parent
    // RuntimeEception
    public class DuplicateResourceException(String message){
    super(message);
    }
}
