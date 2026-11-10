package stpim.service;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

import stpim.dao.UserDao;
import stpim.model.User;

/** 利用者登録とパスワード認証。JDK 標準の PBKDF2 を使用する。 */
public class AuthService {
    private static final int ITERATIONS = 120000;
    private static final int SALT_BYTES = 16;
    private static final int KEY_BITS = 256;
    private final UserDao userDao;
    private final SecureRandom random = new SecureRandom();

    public AuthService(UserDao userDao) { this.userDao = userDao; }

    public String register(String username, String password) {
        String name = username == null ? "" : username.trim();
        if (name.length() < 3 || name.length() > 30) return "ユーザー名は3〜30文字で入力してください。";
        if (password == null || password.length() < 8) return "パスワードは8文字以上で入力してください。";
        if (userDao.findByUsername(name) != null) return "このユーザー名はすでに使われています。";
        User user = new User();
        user.setUsername(name);
        user.setPasswordHash(hash(password.toCharArray()));
        userDao.save(user);
        return null;
    }

    public User authenticate(String username, String password) {
        User user = userDao.findByUsername(username);
        if (user == null || password == null) return null;
        try {
            String[] parts = user.getPasswordHash().split(":", 3);
            int iterations = Integer.parseInt(parts[0]);
            byte[] salt = Base64.getDecoder().decode(parts[1]);
            byte[] expected = Base64.getDecoder().decode(parts[2]);
            byte[] actual = derive(password.toCharArray(), salt, iterations);
            return MessageDigest.isEqual(expected, actual) ? user : null;
        } catch (RuntimeException e) {
            return null;
        }
    }

    private String hash(char[] password) {
        byte[] salt = new byte[SALT_BYTES];
        random.nextBytes(salt);
        byte[] key = derive(password, salt, ITERATIONS);
        return ITERATIONS + ":" + Base64.getEncoder().encodeToString(salt) + ":" + Base64.getEncoder().encodeToString(key);
    }

    private byte[] derive(char[] password, byte[] salt, int iterations) {
        PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, KEY_BITS);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (Exception e) {
            throw new IllegalStateException("パスワードを処理できませんでした", e);
        } finally {
            spec.clearPassword();
        }
    }
}
