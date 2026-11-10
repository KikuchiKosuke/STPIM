package stpim.dao;

import stpim.model.User;

/** 利用者の保存先。現在はメモリ上の実装を使う。 */
public interface UserDao {
    User findByUsername(String username);
    User findById(int id);
    User save(User user);
}
