package com.liftcrew.api.infra.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;

@Configuration
public class FirebaseConfig {

  @Value("${liftcrew.firebase.credentials-path}")
  private String credentialsPath;

 @Bean
  public FirebaseApp firebaseApp() throws IOException {
   if (FirebaseApp.getApps().isEmpty()) {
     FirebaseOptions options = FirebaseOptions.builder()
             .setCredentials(GoogleCredentials.fromStream(
                     new ClassPathResource(credentialsPath).getInputStream()
             )).build();
     return FirebaseApp.initializeApp(options);
   }
   return FirebaseApp.getInstance();
 }

 @Bean
  public FirebaseAuth firebaseAuth(FirebaseApp app) {
   return FirebaseAuth.getInstance(app);
 }
}
