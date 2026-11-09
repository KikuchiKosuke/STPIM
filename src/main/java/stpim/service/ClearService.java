package stpim.service;

import java.time.Duration;
import java.time.LocalDateTime;

import stpim.model.Block;
import stpim.model.BlockStatus;
import stpim.model.BlockType;
import stpim.model.ClearResult;

/** クリアと、クリアを戻す処理（クラス図の ClearService） */
public class ClearService {

    /** クリアする。すでに完了なら null を返す */
    public ClearResult clear(Block b, LocalDateTime now) {
        if (b.getStatus() == BlockStatus.DONE) {
            return null;
        }
        b.setStatus(BlockStatus.DONE);
        b.setActualEndAt(now);
        if (b.getBlockType() == BlockType.TIME && b.getActualStartAt() == null) {
            // 時間制は、予定の開始時刻をそのまま開始時刻とする
            b.setActualStartAt(LocalDateTime.of(b.getTargetDate(), b.getPlannedStartTime()));
        }
        Integer diff = null;
        if (b.getBlockType() == BlockType.TIME) {
            // 予定終了との差。遅れが＋、早いが－（秒は切り捨て）
            LocalDateTime plannedEnd = LocalDateTime.of(b.getTargetDate(), b.getPlannedEndTime());
            diff = (int) Duration.between(plannedEnd, now).toMinutes();
        }
        Integer duration = null;
        if (b.getActualStartAt() != null) {
            // 予定の開始より前にクリアしたときは、マイナスにならないよう 0 分にする（要確認）
            duration = (int) Math.max(0, Duration.between(b.getActualStartAt(), now).toMinutes());
        }
        return new ClearResult(diff, duration);
    }

    /** クリアを戻す（1回だけ）。戻せたら null、だめなら理由の文章を返す */
    public String undo(Block b) {
        if (b.getStatus() != BlockStatus.DONE) {
            return "完了していないブロックは戻せません";
        }
        if (b.getUndoCount() >= 1) {
            return "戻せるのは1回だけです";
        }
        b.setStatus(BlockStatus.TODO);
        b.setActualEndAt(null);
        b.setManualEnd(false);
        b.setUndoCount(b.getUndoCount() + 1);
        if (b.getBlockType() == BlockType.TIME) {
            b.setActualStartAt(null); // 時間制の開始は、クリア時に決まる値
        }
        return null;
    }
}
