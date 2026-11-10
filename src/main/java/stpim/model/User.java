package stpim.model;

/** STPIM の利用者。パスワードは PBKDF2 のハッシュだけを保持する。 */
public class User {
    private Integer id;
    private String username;
    private String passwordHash;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}
