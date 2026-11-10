package stpim.servlet;

import java.io.IOException;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import stpim.dao.Daos;
import stpim.model.Block;
import stpim.model.BlockStatus;
import stpim.service.BlockService;
import stpim.util.Clock;

@WebServlet("/records")
public class RecordsServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final BlockService service = new BlockService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        int userId = CalendarServlet.userId(req);
        List<Block> blocks = Daos.blockDao().findByUser(userId);
        for (Block changed : service.markOverdueAsMissed(blocks, Clock.now())) Daos.blockDao().save(changed);
        String status = req.getParameter("status");
        if (status != null && !"ALL".equals(status)) {
            try {
                BlockStatus expected = BlockStatus.valueOf(status);
                blocks.removeIf(b -> b.getStatus() != expected && !(expected == BlockStatus.MISSED
                        && b.getBlockType() == stpim.model.BlockType.TIME && b.getStatus() == BlockStatus.TODO
                        && b.getTargetDate().atTime(b.getPlannedEndTime()).isBefore(Clock.now())));
            } catch (IllegalArgumentException e) { status = "ALL"; }
        } else status = "ALL";
        String month = req.getParameter("month");
        if (month != null && !"ALL".equals(month)) {
            try { YearMonth selected = YearMonth.parse(month); blocks.removeIf(b -> !YearMonth.from(b.getTargetDate()).equals(selected)); }
            catch (DateTimeParseException e) { month = "ALL"; }
        } else month = "ALL";
        blocks.sort(Comparator.comparing(Block::getTargetDate).reversed()
                .thenComparing(Comparator.comparing(Block::getId).reversed()));
        List<Block> all = Daos.blockDao().findByUser(userId);
        req.setAttribute("blocks", blocks);
        req.setAttribute("months", months(all));
        req.setAttribute("selectedStatus", status);
        req.setAttribute("selectedMonth", month);
        req.setAttribute("totalCleared", count(all, BlockStatus.DONE));
        req.setAttribute("todoCount", count(all, BlockStatus.TODO));
        req.setAttribute("missedCount", count(all, BlockStatus.MISSED));
        req.setAttribute("currentView", "records");
        req.getRequestDispatcher("/WEB-INF/jsp/records.jsp").forward(req, resp);
    }

    private int count(List<Block> blocks, BlockStatus status) { int count=0; for(Block b:blocks) if(b.getStatus()==status)count++; return count; }
    private List<String> months(List<Block> blocks) {
        java.util.TreeSet<String> values = new java.util.TreeSet<String>(Comparator.reverseOrder());
        for (Block b : blocks) values.add(YearMonth.from(b.getTargetDate()).toString());
        return new ArrayList<String>(values);
    }
}
