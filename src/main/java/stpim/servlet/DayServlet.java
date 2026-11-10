package stpim.servlet;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import stpim.dao.BlockDao;
import stpim.dao.Daos;
import stpim.model.Block;
import stpim.model.BlockStatus;
import stpim.model.BlockType;
import stpim.service.BlockService;
import stpim.util.Clock;

/** 日ごとの時間制・優先順位ブロックを表示する。 */
@WebServlet("/day")
public class DayServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final BlockService blockService = new BlockService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        LocalDate date = parseDate(req.getParameter("date"));
        BlockType tab = "PRIORITY".equals(req.getParameter("tab")) ? BlockType.PRIORITY : BlockType.TIME;
        int userId = CalendarServlet.userId(req);
        BlockDao dao = Daos.blockDao();
        List<Block> allUserBlocks = dao.findByUser(userId);
        for (Block changed : blockService.markOverdueAsMissed(allUserBlocks, Clock.now())) dao.save(changed);
        List<Block> all = dao.findByDate(userId, date);
        List<Block> timed = blockService.sortForTab(all, BlockType.TIME);
        List<Block> priority = blockService.sortForTab(all, BlockType.PRIORITY);
        List<Block> timedTodo = new ArrayList<Block>(), timedDone = new ArrayList<Block>();
        List<Block> priorityTodo = new ArrayList<Block>(), priorityDone = new ArrayList<Block>();
        for (Block b : timed) (b.getStatus() == BlockStatus.DONE ? timedDone : timedTodo).add(b);
        for (Block b : priority) (b.getStatus() == BlockStatus.DONE ? priorityDone : priorityTodo).add(b);
        req.setAttribute("date", date);
        req.setAttribute("currentView", "day");
        req.setAttribute("tab", tab);
        req.setAttribute("timedTodo", timedTodo);
        req.setAttribute("timedDone", timedDone);
        req.setAttribute("priorityTodo", priorityTodo);
        req.setAttribute("priorityDone", priorityDone);
        req.setAttribute("totalCleared", countDone(allUserBlocks));
        req.setAttribute("dayTotal", all.size());
        req.setAttribute("dayDone", timedDone.size() + priorityDone.size());
        req.setAttribute("dayMissed", countMissed(timedTodo) + countMissed(priorityTodo));
        req.setAttribute("result", req.getSession().getAttribute("clearResult"));
        req.setAttribute("resultBlock", req.getSession().getAttribute("clearBlock"));
        req.getSession().removeAttribute("clearResult");
        req.getSession().removeAttribute("clearBlock");
        req.getRequestDispatcher("/WEB-INF/jsp/day.jsp").forward(req, resp);
    }

    private LocalDate parseDate(String s) {
        try { return s == null || s.isEmpty() ? Clock.today() : LocalDate.parse(s); }
        catch (DateTimeParseException e) { return Clock.today(); }
    }
    private int countDone(List<Block> blocks) { int n = 0; for (Block b : blocks) if (b.getStatus() == BlockStatus.DONE) n++; return n; }
    private int countMissed(List<Block> blocks) { int n = 0; for (Block b : blocks) if (b.getStatus() == BlockStatus.MISSED) n++; return n; }
}
