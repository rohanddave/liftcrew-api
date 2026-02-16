package com.liftcrew.api.features.auth.controller;

import com.liftcrew.api.features.auth.dto.response.LoginResponseDto;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

  @PostMapping("/login")
  public ResponseEntity<LoginResponseDto> login() {
    boolean userExists = false;
    return ResponseEntity.ok(new LoginResponseDto(userExists));
  }
}
