package stpim.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import stpim.model.Block;
import stpim.model.BlockStatus;
import stpim.model.BlockType;

/** ブロックの作成・開始・未処理の判定・並べ替え（クラス図の BlockService） */
public class BlockService {

    public static final int TITLE_MAX_LENGTH = 100;

    /** 入力を検査する。エラーの文章のリストを返す（空ならOK） */
    public List<String> validate(BlockInput in) {
        List<String> errors = new ArrayList<String>();
        String title = in.title == null ? "" : in.title.trim();
        if (title.isEmpty()) {
            errors.add("タイトルを入力してください");
        }
        if (title.length() > TITLE_MAX_LENGTH) {
            errors.add("タイトルは" + TITLE_MAX_LENGTH + "文字以内で入力してください");
        }
        if (in.blockType == null) {
            errors.add("時間制か優先順位のどちらかを選んでください");
        } else if (in.blockType == BlockType.TIME) {
            if (in.plannedStartTime == null || in.plannedEndTime == null) {
                errors.add("開始時刻と終了時刻を入力してください");
            } else if (!in.plannedEndTime.isAfter(in.plannedStartTime)) {
                // 終了＝開始も不可にしている（要確認）
                errors.add("終了時刻は開始時刻より後にしてください");
            }
        } else if (in.priority == null) {
            errors.add("優先順位（高・中・低）を選んでください");
        }
        if (in.timeAttack && in.betterDirection == null) {
            errors.add("タイムアタックは「長い方が良い」か「短い方が良い」を選んでください");
        }
        return errors;
    }

    /** 検査に通った入力から、ブロックを作る（idはDAOが付ける） */
    public Block toBlock(BlockInput in) {
        Block b = new Block();
        b.setTargetDate(in.targetDate);
        b.setTitle(in.title.trim());
        b.setMemo(in.memo == null ? "" : in.memo);
        b.setBlockType(in.blockType);
        b.setStatus(BlockStatus.TODO);
        if (in.blockType == BlockType.TIME) {
            b.setPlannedStartTime(in.plannedStartTime);
            b.setPlannedEndTime(in.plannedEndTime);
        } else {
            b.setPriority(in.priority);
        }
        b.setTimeAttack(in.timeAttack);
        b.setBetterDirection(in.timeAttack ? in.betterDirection : null);
        return b;
    }

    /** 優先順位のブロックの「開始」ボタン。押せたら true */
    public boolean start(Block b, LocalDateTime now) {
        if (b.getBlockType() != BlockType.PRIORITY) {
            return false;
        }
        if (b.getStatus() != BlockStatus.TODO) {
            return false;
        }
        if (b.getActualStartAt() != null) {
            return false; // 二重押下は無視
        }
        b.setActualStartAt(now);
        return true;
    }

    /** 時間制で、予定の終了を過ぎても未着手のもの */
    public boolean isOverdue(Block b, LocalDateTime now) {
        return b.getBlockType() == BlockType.TIME
                && b.getStatus() == BlockStatus.TODO
                && LocalDateTime.of(b.getTargetDate(), b.getPlannedEndTime()).isBefore(now);
    }

    /** 日画面を開くたびに呼ぶ。未処理に変えたブロックのリストを返す */
    public List<Block> markOverdueAsMissed(List<Block> blocks, LocalDateTime now) {
        List<Block> changed = new ArrayList<Block>();
        for (Block b : blocks) {
            if (isOverdue(b, now)) {
                b.setStatus(BlockStatus.MISSED);
                changed.add(b);
            }
        }
        return changed;
    }

    /** タブごとの並び（時間制は時刻順、優先順位は高→中→低、同じ順位は作成順） */
    public List<Block> sortForTab(List<Block> blocks, final BlockType type) {
        List<Block> list = new ArrayList<Block>();
        for (Block b : blocks) {
            if (b.getBlockType() == type) {
                list.add(b);
            }
        }
        Collections.sort(list, new Comparator<Block>() {
            @Override
            public int compare(Block a, Block b) {
                int c;
                if (type == BlockType.TIME) {
                    c = a.getPlannedStartTime().compareTo(b.getPlannedStartTime());
                } else {
                    c = Integer.compare(a.getPriority().getRank(), b.getPriority().getRank());
                }
                return c != 0 ? c : Integer.compare(a.getId(), b.getId());
            }
        });
        return list;
    }
}
