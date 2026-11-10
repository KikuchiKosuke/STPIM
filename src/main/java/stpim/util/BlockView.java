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

    public static String cardHtml(Block b, String contextPath) {
        String status = b.getStatus() == BlockStatus.DONE ? "完了" : b.getStatus() == BlockStatus.MISSED ? "未処理" : "未着手";
        String statusClass = b.getStatus().name().toLowerCase();
        String kind = b.getBlockType() == BlockType.TIME ? "timed" : "priority";
        String schedule = b.getBlockType() == BlockType.TIME
                ? "<span class=\"time-start\">" + b.getPlannedStartTime().format(HHMM) + "</span><span class=\"time-arrow\">↓</span><span class=\"time-end\">" + b.getPlannedEndTime().format(HHMM) + "</span>"
                : "<span class=\"priority-label\">優先順位</span><strong class=\"priority-value\">" + escape(b.getPriority().getLabel()) + "</strong>";
        StringBuilder html = new StringBuilder();
        html.append("<article class=\"block-card ").append(kind).append(" ").append(cssClass(b).contains("missed") ? "missed " : "")
                .append(cssClass(b).contains("done") ? "done " : "").append(b.isTimeAttack() ? "attack " : "")
                .append("\" data-id=\"").append(b.getId()).append("\">");
        html.append("<div class=\"block-time ").append(kind.equals("priority") ? "priority-time" : "").append("\">").append(schedule).append("</div>");
        html.append("<div class=\"block-content\"><h3 class=\"block-title\">").append(escape(b.getTitle())).append("</h3>");
        if (b.getMemo() != null && !b.getMemo().trim().isEmpty()) html.append("<p class=\"block-memo\">").append(escape(b.getMemo())).append("</p>");
        html.append("<div class=\"block-tags\">");
        if (b.isTimeAttack()) html.append("<span class=\"mini-tag\">タイムアタック · ").append(b.getBetterDirection() == stpim.model.BetterDirection.LONGER ? "長い方" : "短い方").append("が良い</span>");
        if (b.getActualStartAt() != null && b.getStatus() != BlockStatus.DONE) html.append("<span class=\"mini-tag\">開始 ").append(b.getActualStartAt().format(HHMM)).append("</span>");
        html.append("</div></div><div class=\"block-tools\"><span class=\"status-pill ").append(statusClass).append("\">").append(status).append("</span>");
        html.append(b.getStatus() == BlockStatus.DONE ? "<span class=\"swipe-glyph\">✓</span>" : "<span class=\"swipe-glyph\">⟶</span>").append("</div>");
        html.append("<div class=\"block-actions\"><a class=\"button small\" href=\"").append(contextPath).append("/blocks/edit?id=").append(b.getId()).append("\">編集</a>");
        if (b.getStatus() == BlockStatus.DONE) {
            if (b.getUndoCount() == 0) html.append("<button class=\"button small\" type=\"button\" data-action=\"undo\" data-id=\"").append(b.getId()).append("\">クリアを戻す</button>");
            else html.append("<span class=\"tiny\">戻し済み</span>");
        } else {
            if (b.getBlockType() == BlockType.PRIORITY && b.getActualStartAt() == null) html.append("<button class=\"button small\" type=\"button\" data-action=\"start\" data-id=\"").append(b.getId()).append("\">開始</button>");
            html.append("<button class=\"button primary small\" type=\"button\" data-action=\"clear\" data-id=\"").append(b.getId()).append("\">クリア</button>");
            if (b.getBlockType() == BlockType.TIME) html.append("<details class=\"inline-details\"><summary>終了時刻を入力</summary><form class=\"manual-form\" data-id=\"").append(b.getId()).append("\"><input type=\"time\" name=\"endTime\" required><button class=\"button small\" type=\"submit\">保存</button></form></details>");
            html.append("<details class=\"inline-details\"><summary>複製</summary><form method=\"post\" action=\"").append(contextPath).append("/blocks/duplicate\"><input type=\"hidden\" name=\"id\" value=\"").append(b.getId()).append("\"><input type=\"date\" name=\"targetDate\" required><button class=\"button small\" type=\"submit\">追加</button></form></details>");
        }
        html.append("</div></article>");
        return html.toString();
    }

    private static String escape(String value) { return Html.escape(value); }
}
