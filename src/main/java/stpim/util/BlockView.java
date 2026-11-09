package stpim.util;

import java.time.format.DateTimeFormatter;

import stpim.model.Block;
import stpim.model.BlockStatus;
import stpim.model.BlockType;

/** JSP に出す文章をつくる（JSP の中に処理を書かないための部品） */
public final class BlockView {

    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    private BlockView() {
    }

    /** ブロックのタイトルの下に出す文章 */
    public static String subText(Block b) {
        StringBuilder sb = new StringBuilder();
        if (b.getBlockType() == BlockType.TIME) {
            sb.append(b.getPlannedStartTime().format(HHMM)).append("〜").append(b.getPlannedEndTime().format(HHMM));
        } else {
            sb.append("優先：").append(b.getPriority().getLabel());
        }
        if (b.getStatus() == BlockStatus.MISSED) {
            sb.append("　未処理");
        }
        if (b.getBlockType() == BlockType.PRIORITY && b.getActualStartAt() != null
                && b.getStatus() == BlockStatus.TODO) {
            sb.append("　実行中（").append(b.getActualStartAt().format(HHMM)).append("〜）");
        }
        if (b.isTimeAttack()) {
            sb.append("　タイムアタック");
        }
        if (b.getMemo() != null && !b.getMemo().isEmpty()) {
            sb.append("　").append(b.getMemo());
        }
        return sb.toString();
    }

    /** ブロックの見た目の種類（CSSのクラス名） */
    public static String cssClass(Block b) {
        if (b.getStatus() == BlockStatus.MISSED) {
            return "block missed draggable";
        }
        if (b.getStatus() == BlockStatus.DONE) {
            return "block done";
        }
        return "block draggable";
    }
}
