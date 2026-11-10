package stpim.model;

/** クリアの結果（クラス図の ClearResult）。出せない値は null */
public class ClearResult {
    private final Integer diffFromPlanMinutes; // 時間制：予定終了との差（遅れが＋、早いが－）
    private final Integer durationMinutes;     // 所要時間（開始がないときは null）
    private final Integer previousDurationMinutes;
    private final Integer bestBeforeMinutes;
    private final Boolean personalBest;

    public ClearResult(Integer diffFromPlanMinutes, Integer durationMinutes) {
        this(diffFromPlanMinutes, durationMinutes, null, null, null);
    }

    public ClearResult(Integer diffFromPlanMinutes, Integer durationMinutes, Integer previousDurationMinutes,
            Integer bestBeforeMinutes, Boolean personalBest) {
        this.diffFromPlanMinutes = diffFromPlanMinutes;
        this.durationMinutes = durationMinutes;
        this.previousDurationMinutes = previousDurationMinutes;
        this.bestBeforeMinutes = bestBeforeMinutes;
        this.personalBest = personalBest;
    }

    public Integer getDiffFromPlanMinutes() { return diffFromPlanMinutes; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public Integer getPreviousDurationMinutes() { return previousDurationMinutes; }
    public Integer getBestBeforeMinutes() { return bestBeforeMinutes; }
    public Boolean getPersonalBest() { return personalBest; }
}
