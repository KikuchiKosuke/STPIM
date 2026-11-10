package stpim.dao;

import java.util.HashMap;
import java.util.Map;

import stpim.model.User;

/** Tomcat を停止すると利用者データが消える試作用DAO。 */
public class InMemoryUserDao implements UserDao {
    private final Map<String, User> byUsername = new HashMap<String, User>();
    private final Map<Integer, User> byId = new HashMap<Integer, User>();
    private int nextId = 1;

    @Override
    public synchronized User findByUsername(String username) {
        return username == null ? null : byUsername.get(username.trim().toLowerCase());
    }

    @Override
    public synchronized User findById(int id) {
        return byId.get(id);
    }

    @Override
    public synchronized User save(User user) {
        if (user.getId() == null) user.setId(nextId++);
        byId.put(user.getId(), user);
        byUsername.put(user.getUsername().trim().toLowerCase(), user);
        return user;
    }
}
