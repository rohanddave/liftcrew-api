package com.liftcrew.api.features.auth.service;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.liftcrew.api.common.exception.UnauthorizedException;
import com.liftcrew.api.common.port.SocialTokenData;
import com.liftcrew.api.common.port.SocialTokenVerifier;
import com.liftcrew.api.features.auth.dto.JwtUser;
import com.liftcrew.api.features.auth.dto.response.ExchangeTokenResponseDto;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class TokenServiceImpl implements TokenService {
  private final SocialTokenVerifier socialTokenVerifier;
  private final SecretKey accessKey;
  private final long expirationSeconds;

  public TokenServiceImpl(
      SocialTokenVerifier socialTokenVerifier,
      @Value("${liftcrew.jwt.secret}") String secret,
      @Value("${liftcrew.jwt.expiration}") long expirationSeconds) {
    this.socialTokenVerifier = socialTokenVerifier;
    this.accessKey = Keys.hmacShaKeyFor(secret.getBytes());
    this.expirationSeconds = expirationSeconds;
  }

  @Override
  public ExchangeTokenResponseDto exchangeToken(String firebaseToken) {
    SocialTokenData tokenData = socialTokenVerifier.verifyToken(firebaseToken);

    String accessToken = generateAccessToken(tokenData.getUid(), tokenData.getEmail());

    return ExchangeTokenResponseDto.builder()
        .accessToken(accessToken)
        .refreshToken(null)
        .build();
  }

  @Override
  public ExchangeTokenResponseDto refreshToken(String refreshToken) {
    // TODO: implement refresh token flow
    throw new UnauthorizedException("Refresh token not yet implemented");
  }

  @Override
  public JwtUser verifyAccessToken(String token) {
    try {
      Claims claims = Jwts.parser()
          .verifyWith(accessKey)
          .requireIssuer("liftcrew-api")
          .requireAudience("liftcrew-app")
          .build()
          .parseSignedClaims(token)
          .getPayload();

      return JwtUser.builder()
          .uid(claims.getSubject())
          .email(claims.get("email", String.class))
          .build();
    } catch (JwtException e) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private String generateAccessToken(String uid, String email) {
    Date now = new Date();
    Date expiry = new Date(now.getTime() + expirationSeconds * 1000);

    return Jwts.builder()
        .issuer("liftcrew-api")
        .audience().add("liftcrew-app").and()
        .subject(uid)
        .claim("email", email)
        .issuedAt(now)
        .expiration(expiry)
        .signWith(accessKey)
        .compact();
  }
}