package stpim.dao;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import stpim.model.Block;

/** 試作用：メモリ上に保存する。Tomcat を止めると消える */
public class InMemoryBlockDao implements BlockDao {

    private final Map<Integer, Block> store = new LinkedHashMap<Integer, Block>();
    private int nextId = 1;

    @Override
    public synchronized List<Block> findByDate(LocalDate date) {
        List<Block> result = new ArrayList<Block>();
        for (Block b : store.values()) {
            if (b.getTargetDate().equals(date)) {
                result.add(b);
            }
        }
        return result;
    }

    @Override
    public synchronized Block findById(int id) {
        return store.get(id);
    }

    @Override
    public synchronized Block save(Block block) {
        if (block.getId() == null) {
            block.setId(nextId++);
        }
        store.put(block.getId(), block);
        return block;
    }
}
