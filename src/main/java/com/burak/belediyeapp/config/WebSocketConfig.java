package com.burak.belediyeapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Mesajların dağıtılacağı prefixler
        config.enableSimpleBroker("/topic");
        // Client'tan server'a gönderilecek mesajların prefix'i
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Bağlantı endpoint'i
        registry.addEndpoint("/ws-belediye")
                .setAllowedOriginPatterns("*") // Production'da Vercel domain'i ile kısıtlanacak
                .withSockJS();
    }
}
