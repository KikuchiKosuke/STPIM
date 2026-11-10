package stpim.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import stpim.dao.BlockDao;
import stpim.model.BetterDirection;
import stpim.model.Block;
import stpim.model.BlockStatus;
import stpim.model.BlockType;
import stpim.model.ClearResult;
import stpim.util.Clock;

/** 通常クリア、手動終了時刻、取り消しを扱う。 */
public class ClearService {
    private final BlockDao blockDao;

    public ClearService(BlockDao blockDao) { this.blockDao = blockDao; }

    /** クリアする。すでに完了・未来日・不正な時刻なら null。 */
    public ClearResult clear(Block b, LocalDateTime now) {
        if (b.getStatus() == BlockStatus.DONE || b.getTargetDate().isAfter(now.toLocalDate())) return null;
        LocalDateTime start = actualStartForClear(b, now);
        return complete(b, now, start, false);
    }

    /** 終了時刻の手入力。時間制ブロックのみ、対象日と現在時刻で検査する。 */
    public ClearResult manualClear(Block b, LocalTime endTime, LocalDateTime now) {
        if (b == null || b.getStatus() == BlockStatus.DONE || b.getBlockType() != BlockType.TIME
                || b.getTargetDate().isAfter(now.toLocalDate()) || endTime == null) return null;
        LocalDateTime endAt = LocalDateTime.of(b.getTargetDate(), endTime);
        if (endAt.isAfter(now)) return null;
        LocalDateTime plannedStart = LocalDateTime.of(b.getTargetDate(), b.getPlannedStartTime());
        if (endAt.isBefore(plannedStart)) return null;
        return complete(b, endAt, plannedStart, true);
    }

    private LocalDateTime actualStartForClear(Block b, LocalDateTime now) {
        if (b.getBlockType() == BlockType.TIME) {
            LocalDateTime plannedStart = LocalDateTime.of(b.getTargetDate(), b.getPlannedStartTime());
            return now.isBefore(plannedStart) ? null : plannedStart;
        }
        return b.getActualStartAt();
    }

    private ClearResult complete(Block b, LocalDateTime endAt, LocalDateTime startAt, boolean manual) {
        Integer diff = null;
        if (b.getBlockType() == BlockType.TIME) {
            LocalDateTime plannedEnd = LocalDateTime.of(b.getTargetDate(), b.getPlannedEndTime());
            diff = roundMinutes(Duration.between(plannedEnd, endAt).getSeconds());
        }
        Integer duration = startAt == null ? null
                : Math.max(0, roundMinutes(Duration.between(startAt, endAt).getSeconds()));

        Integer previous = null;
        Integer bestBefore = null;
        Boolean personalBest = null;
        if (b.isTimeAttack() && duration != null && b.getSeriesId() != null) {
            List<Block> past = completedSeries(b);
            if (!past.isEmpty()) previous = durationOf(past.get(past.size() - 1));
            for (Block item : past) {
                int value = durationOf(item);
                if (bestBefore == null || better(b.getBetterDirection(), value, bestBefore)) bestBefore = value;
            }
            personalBest = bestBefore == null || better(b.getBetterDirection(), duration, bestBefore);
        }

        b.setStatus(BlockStatus.DONE);
        b.setActualStartAt(startAt);
        b.setActualEndAt(endAt);
        b.setManualEnd(manual);
        return new ClearResult(diff, duration, previous, bestBefore, personalBest);
    }

    public String undo(Block b) {
        if (b.getStatus() != BlockStatus.DONE) return "完了していないブロックは戻せません";
        if (b.getUndoCount() >= 1) return "戻せるのは1回だけです";
        b.setStatus(BlockStatus.TODO);
        b.setActualEndAt(null);
        b.setManualEnd(false);
        b.setUndoCount(b.getUndoCount() + 1);
        b.setActualStartAt(null);
        return null;
    }

    private List<Block> completedSeries(Block block) {
        List<Block> result = new ArrayList<Block>();
        for (Block item : blockDao.findByUser(block.getUserId())) {
            if (!item.getId().equals(block.getId()) && item.getStatus() == BlockStatus.DONE
                    && item.isTimeAttack() && block.getSeriesId().equals(item.getSeriesId())
                    && item.getActualStartAt() != null && item.getActualEndAt() != null) result.add(item);
        }
        result.sort(Comparator.comparing(Block::getActualEndAt).thenComparing(Block::getId));
        return result;
    }

    private int durationOf(Block b) {
        return Math.max(0, roundMinutes(Duration.between(b.getActualStartAt(), b.getActualEndAt()).getSeconds()));
    }

    private boolean better(BetterDirection direction, int candidate, int current) {
        return direction == BetterDirection.LONGER ? candidate > current : candidate < current;
    }

    private int roundMinutes(long seconds) { return (int) Math.round(seconds / 60.0); }
}
