package com.rishikesh.chat.exception;

//when user do not have permission do something this error will be thrown
public class ForbiddenActionException extends RuntimeException {

    public ForbiddenActionException(String message) {
        super(message);
    }
}
