package stpim.model;

/** 優先順位（高・中・低）。数字が小さいほど優先 */
public enum Priority {
    HIGH(1, "高"), MID(2, "中"), LOW(3, "低");

    private final int rank;
    private final String label;

    Priority(int rank, String label) {
        this.rank = rank;
        this.label = label;
    }

    public int getRank() {
        return rank;
    }

    public String getLabel() {
        return label;
    }

    public static Priority fromRank(int rank) {
        for (Priority p : values()) {
            if (p.rank == rank) {
                return p;
            }
        }
        return null;
    }
}
