package stpim.servlet;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import stpim.dao.Daos;
import stpim.model.BetterDirection;
import stpim.model.Block;
import stpim.model.BlockStatus;

@WebServlet("/time-attack")
public class TimeAttackServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        List<Block> all = Daos.blockDao().findByUser(CalendarServlet.userId(req));
        Map<Integer, Block> bySeries = new LinkedHashMap<Integer, Block>();
        for (Block b : all) if (b.isTimeAttack() && b.getSeriesId() != null && !bySeries.containsKey(b.getSeriesId())) bySeries.put(b.getSeriesId(), b);
        List<Block> series = new ArrayList<Block>(bySeries.values());
        series.sort(Comparator.comparing(Block::getTitle, String.CASE_INSENSITIVE_ORDER).thenComparing(Block::getId));
        Integer selected = parseId(req.getParameter("series"));
        if (selected == null && !series.isEmpty()) selected = series.get(0).getSeriesId();
        Block active = null;
        for (Block b : series) if (b.getSeriesId().equals(selected)) active = b;
        if (active == null && !series.isEmpty()) { active = series.get(0); selected = active.getSeriesId(); }
        List<Block> records = new ArrayList<Block>();
        if (active != null) for (Block b : all) {
            if (b.getSeriesId().equals(active.getSeriesId()) && b.getStatus() == BlockStatus.DONE
                    && b.getActualStartAt() != null && b.getActualEndAt() != null) records.add(b);
        }
        records.sort(Comparator.comparing(Block::getActualEndAt).thenComparing(Block::getId));
        Map<Integer, Integer> bestBySeries = new LinkedHashMap<Integer, Integer>();
        for (Block representative : series) {
            Integer bestValue = null;
            for (Block item : all) {
                if (item.getStatus() != BlockStatus.DONE || item.getActualStartAt() == null || item.getActualEndAt() == null
                        || !representative.getSeriesId().equals(item.getSeriesId())) continue;
                int duration = durationMinutes(item);
                if (bestValue == null || (representative.getBetterDirection() == stpim.model.BetterDirection.LONGER
                        ? duration > bestValue : duration < bestValue)) bestValue = duration;
            }
            bestBySeries.put(representative.getSeriesId(), bestValue);
        }
        req.setAttribute("series", series);
        req.setAttribute("active", active);
        req.setAttribute("records", records);
        req.setAttribute("best", best(records, active == null ? null : active.getBetterDirection()));
        req.setAttribute("bestBySeries", bestBySeries);
        req.setAttribute("totalCleared", countDone(all));
        req.setAttribute("currentView", "attack");
        req.getRequestDispatcher("/WEB-INF/jsp/time-attack.jsp").forward(req, resp);
    }

    public static int durationMinutes(Block block) {
        return Math.max(0, (int) Math.round(Duration.between(block.getActualStartAt(), block.getActualEndAt()).getSeconds() / 60.0));
    }
    private Integer best(List<Block> records, BetterDirection direction) {
        Integer best = null;
        for (Block b : records) {
            int value = durationMinutes(b);
            if (best == null || (direction == BetterDirection.LONGER ? value > best : value < best)) best = value;
        }
        return best;
    }
    private int countDone(List<Block> blocks) { int n=0; for(Block b:blocks) if(b.getStatus()==BlockStatus.DONE)n++; return n; }
    private static Integer parseId(String s) { try { return s==null?null:Integer.valueOf(s); } catch(RuntimeException e){return null;} }
}
