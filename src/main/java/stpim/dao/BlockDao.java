package stpim.dao;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import stpim.model.Block;

/** ブロックの保存先。いまはメモリ上（InMemoryBlockDao）。PostgreSQL ができたら、この interface を実装し直す */
public interface BlockDao {

    /** 指定した日のブロックを、すべて返す */
    List<Block> findByDate(int userId, LocalDate date);

    List<Block> findByMonth(int userId, YearMonth month);

    List<Block> findByUser(int userId);

    /** idで探す。なければ null */
    Block findById(int userId, int id);

    /** 保存する。idがなければ、新しく付ける */
    Block save(Block block);

    void delete(int userId, int id);

    int nextSeriesId();
}
