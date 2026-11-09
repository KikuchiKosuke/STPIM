package stpim.model;

/** クリアの結果（クラス図の ClearResult）。出せない値は null */
public class ClearResult {
    private final Integer diffFromPlanMinutes; // 時間制：予定終了との差（遅れが＋、早いが－）
    private final Integer durationMinutes;     // 所要時間（開始がないときは null）

    public ClearResult(Integer diffFromPlanMinutes, Integer durationMinutes) {
        this.diffFromPlanMinutes = diffFromPlanMinutes;
        this.durationMinutes = durationMinutes;
    }

    public Integer getDiffFromPlanMinutes() { return diffFromPlanMinutes; }
    public Integer getDurationMinutes() { return durationMinutes; }
}
