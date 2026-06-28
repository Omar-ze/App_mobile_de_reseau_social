package com.chatapp.service;

import com.chatapp.dto.*;
import com.chatapp.entity.User;
import com.chatapp.repository.UserRepository;
import com.chatapp.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;

    public AuthResponse register(RegisterRequest req) {
        if (userRepo.existsByUsername(req.getUsername()))
            throw new IllegalArgumentException("Nom d'utilisateur déjà pris");
        if (userRepo.existsByEmail(req.getEmail()))
            throw new IllegalArgumentException("Email déjà utilisé");

        User user = User.builder()
            .username(req.getUsername())
            .email(req.getEmail())
            .password(encoder.encode(req.getPassword()))
            .displayName(req.getDisplayName() != null ? req.getDisplayName() : req.getUsername())
            .build();
        userRepo.save(user);

        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token, toDto(user));
    }

    public AuthResponse login(AuthRequest req) {
        Authentication auth = authManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
        );
        User user = userRepo.findByUsername(auth.getName()).orElseThrow();
        String token = jwtUtil.generateToken(user.getUsername());
        return new AuthResponse(token, toDto(user));
    }

    public static UserDto toDto(User u) {
        return UserDto.builder()
            .id(u.getId())
            .username(u.getUsername())
            .email(u.getEmail())
            .displayName(u.getDisplayName())
            .avatarColor(u.getAvatarColor())
            .build();
    }
}
