package stpim.dao;

import java.time.LocalDate;
import java.util.List;

import stpim.model.Block;

/** ブロックの保存先。いまはメモリ上（InMemoryBlockDao）。PostgreSQL ができたら、この interface を実装し直す */
public interface BlockDao {

    /** 指定した日のブロックを、すべて返す */
    List<Block> findByDate(LocalDate date);

    /** idで探す。なければ null */
    Block findById(int id);

    /** 保存する。idがなければ、新しく付ける */
    Block save(Block block);
}
