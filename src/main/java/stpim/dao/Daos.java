package stpim.dao;

/** DAOの置き場所。PostgreSQL に変えるときは、ここの1行を差し替える */
public final class Daos {

    private static final BlockDao BLOCK_DAO = new InMemoryBlockDao();

    private Daos() {
    }

    public static BlockDao blockDao() {
        return BLOCK_DAO;
    }
}
