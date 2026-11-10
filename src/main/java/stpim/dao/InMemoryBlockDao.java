package stpim.dao;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import stpim.model.Block;

/** 試作用：メモリ上に保存する。Tomcat を止めると消える */
public class InMemoryBlockDao implements BlockDao {

    private final Map<Integer, Block> store = new LinkedHashMap<Integer, Block>();
    private int nextId = 1;
    private int nextSeriesId = 1;

    @Override
    public synchronized List<Block> findByDate(int userId, LocalDate date) {
        List<Block> result = new ArrayList<Block>();
        for (Block b : store.values()) {
            if (b.getUserId() == userId && b.getTargetDate().equals(date)) {
                result.add(b);
            }
        }
        return result;
    }

    @Override
    public synchronized List<Block> findByMonth(int userId, YearMonth month) {
        List<Block> result = new ArrayList<Block>();
        for (Block b : store.values()) {
            if (b.getUserId() == userId && YearMonth.from(b.getTargetDate()).equals(month)) result.add(b);
        }
        return result;
    }

    @Override
    public synchronized List<Block> findByUser(int userId) {
        List<Block> result = new ArrayList<Block>();
        for (Block b : store.values()) if (b.getUserId() == userId) result.add(b);
        return result;
    }

    @Override
    public synchronized Block findById(int userId, int id) {
        Block block = store.get(id);
        return block != null && block.getUserId() == userId ? block : null;
    }

    @Override
    public synchronized Block save(Block block) {
        if (block.getId() == null) {
            block.setId(nextId++);
        }
        store.put(block.getId(), block);
        return block;
    }

    @Override
    public synchronized void delete(int userId, int id) {
        Block block = store.get(id);
        if (block != null && block.getUserId() == userId) store.remove(id);
    }

    @Override
    public synchronized int nextSeriesId() { return nextSeriesId++; }
}
