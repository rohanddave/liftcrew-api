package com.liftcrew.api.infra.firebase;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

import com.liftcrew.api.common.exception.UnauthorizedException;
import com.liftcrew.api.common.port.SocialTokenData;
import com.liftcrew.api.common.port.SocialTokenVerifier;

import org.springframework.stereotype.Component;

import java.util.Map;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@Component
public class FirebaseTokenVerifier implements SocialTokenVerifier {
  private final FirebaseAuth firebaseAuth;

  public SocialTokenData verifyToken(String firebaseToken) {
    try {
      FirebaseToken token = this.firebaseAuth.verifyIdToken(firebaseToken);
      return SocialTokenData.builder()
              .uid(token.getUid())
              .email(token.getEmail())
              .name(token.getName())
              .picture(token.getPicture())
              .provider(getProvider(token))
              .build();
    } catch(FirebaseAuthException e) {
      log.error("Firebase token verification failed", e);
      throw new UnauthorizedException("Invalid Firebase Token");
    }
  }

  private String getProvider(FirebaseToken token) {
    Map<String, Object> claims = token.getClaims();
    Map<String, Object> firebase = (Map<String, Object>) claims.get("firebase");
    return firebase != null ? (String) firebase.get("sign_in_provider") : "unknown";
  }
}
