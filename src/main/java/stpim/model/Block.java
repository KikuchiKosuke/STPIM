package stpim.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/** ブロック（クラス図の Block） */
public class Block {
    private Integer id;
    private int userId;
    private LocalDate targetDate;
    private String title;
    private String memo;
    private BlockType blockType;
    private BlockStatus status = BlockStatus.TODO;
    private LocalTime plannedStartTime;   // 時間制のみ
    private LocalTime plannedEndTime;     // 時間制のみ
    private Priority priority;            // 優先順位のみ
    private LocalDateTime actualStartAt;
    private LocalDateTime actualEndAt;
    private boolean manualEnd;
    private int undoCount;
    private boolean timeAttack;
    private BetterDirection betterDirection;
    private Integer seriesId;             // 過去のタイムアタックのブロックを選んだとき、その系列IDを引き継ぐ（未実装）

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }
    public LocalDate getTargetDate() { return targetDate; }
    public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMemo() { return memo; }
    public void setMemo(String memo) { this.memo = memo; }
    public BlockType getBlockType() { return blockType; }
    public void setBlockType(BlockType blockType) { this.blockType = blockType; }
    public BlockStatus getStatus() { return status; }
    public void setStatus(BlockStatus status) { this.status = status; }
    public LocalTime getPlannedStartTime() { return plannedStartTime; }
    public void setPlannedStartTime(LocalTime plannedStartTime) { this.plannedStartTime = plannedStartTime; }
    public LocalTime getPlannedEndTime() { return plannedEndTime; }
    public void setPlannedEndTime(LocalTime plannedEndTime) { this.plannedEndTime = plannedEndTime; }
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public LocalDateTime getActualStartAt() { return actualStartAt; }
    public void setActualStartAt(LocalDateTime actualStartAt) { this.actualStartAt = actualStartAt; }
    public LocalDateTime getActualEndAt() { return actualEndAt; }
    public void setActualEndAt(LocalDateTime actualEndAt) { this.actualEndAt = actualEndAt; }
    public boolean isManualEnd() { return manualEnd; }
    public void setManualEnd(boolean manualEnd) { this.manualEnd = manualEnd; }
    public int getUndoCount() { return undoCount; }
    public void setUndoCount(int undoCount) { this.undoCount = undoCount; }
    public boolean isTimeAttack() { return timeAttack; }
    public void setTimeAttack(boolean timeAttack) { this.timeAttack = timeAttack; }
    public BetterDirection getBetterDirection() { return betterDirection; }
    public void setBetterDirection(BetterDirection betterDirection) { this.betterDirection = betterDirection; }
    public Integer getSeriesId() { return seriesId; }
    public void setSeriesId(Integer seriesId) { this.seriesId = seriesId; }
}
