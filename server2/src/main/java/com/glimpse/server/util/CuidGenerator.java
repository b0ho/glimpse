package com.glimpse.server.util;

import org.hibernate.HibernateException;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;

import java.io.Serializable;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * CUID (Collision-resistant Unique Identifier) Generator
 * Prisma의 cuid()와 호환되는 ID 생성기
 */
public class CuidGenerator implements IdentifierGenerator {
    
    private static final String ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static long counter = 0;
    
    @Override
    public Serializable generate(SharedSessionContractImplementor session, Object object) throws HibernateException {
        return generateCuid();
    }
    
    public static String generateCuid() {
        // c + timestamp + counter + fingerprint + random
        StringBuilder cuid = new StringBuilder("c");
        
        // Timestamp (base36)
        String timestamp = Long.toString(Instant.now().toEpochMilli(), 36);
        cuid.append(timestamp);
        
        // Counter (base36, 4 chars)
        String counterStr = Long.toString(getNextCounter(), 36);
        cuid.append(String.format("%4s", counterStr).replace(' ', '0'));
        
        // Machine fingerprint (simplified - 4 random chars)
        cuid.append(randomString(4));
        
        // Random block (8 chars)
        cuid.append(randomString(8));
        
        return cuid.toString();
    }
    
    private static synchronized long getNextCounter() {
        return counter++;
    }
    
    private static String randomString(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}