package stpim.service;

import java.time.LocalDate;
import java.time.LocalTime;

import stpim.model.BetterDirection;
import stpim.model.BlockType;
import stpim.model.Priority;

/** ブロック作成画面で入力された値 */
public class BlockInput {
    public LocalDate targetDate;
    public String title;
    public String memo;
    public BlockType blockType;
    public LocalTime plannedStartTime;
    public LocalTime plannedEndTime;
    public Priority priority;
    public boolean timeAttack;
    public BetterDirection betterDirection;
}
