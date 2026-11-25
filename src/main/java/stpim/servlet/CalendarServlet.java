package stpim.servlet;

import java.io.IOException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import stpim.dao.BlockDao;
import stpim.dao.Daos;
import stpim.model.Block;
import stpim.service.BlockService;
import stpim.util.Clock;

@WebServlet("/calendar")
public class CalendarServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final BlockService service = new BlockService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        LocalDate selected;
        try { selected = LocalDate.parse(req.getParameter("date")); }
        catch (RuntimeException e) { selected = null; }
        YearMonth month;
        if (selected != null) {
            // The clicked day is authoritative, including dates in the adjacent-month cells.
            month = YearMonth.from(selected);
        } else {
            try { month = YearMonth.parse(req.getParameter("month")); }
            catch (DateTimeParseException | NullPointerException e) { month = YearMonth.from(Clock.today()); }
            selected = month.equals(YearMonth.from(Clock.today())) ? Clock.today() : month.atDay(1);
        }
        int userId = userId(req);
        BlockDao dao = Daos.blockDao();
        List<Block> blocks = dao.findByMonth(userId, month);
        List<Block> all = dao.findByUser(userId);
        for (Block changed : service.markOverdueAsMissed(all, Clock.now())) dao.save(changed);
        req.setAttribute("month", month);
        req.setAttribute("selectedDate", selected);
        req.setAttribute("blocks", blocks);
        req.setAttribute("totalCleared", countDone(all));
        req.setAttribute("currentView", "calendar");
        req.getRequestDispatcher("/WEB-INF/jsp/calendar.jsp").forward(req, resp);
    }

    static int userId(HttpServletRequest req) { return ((Integer) req.getSession(false).getAttribute("userId")).intValue(); }
    private int countDone(List<Block> blocks) {
        int total = 0;
        for (Block block : blocks) if (block.getStatus() == stpim.model.BlockStatus.DONE) total++;
        return total;
    }
}
