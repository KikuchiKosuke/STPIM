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

/** 日画面（S03）。開くたびに、予定の終了を過ぎた時間制のブロックを未処理にする */
@WebServlet("/day")
public class DayServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    private final BlockService blockService = new BlockService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        LocalDate date = parseDate(req.getParameter("date"));
        BlockType tab = "PRIORITY".equals(req.getParameter("tab")) ? BlockType.PRIORITY : BlockType.TIME;

        BlockDao dao = Daos.blockDao();
        List<Block> all = dao.findByDate(date);
        for (Block changed : blockService.markOverdueAsMissed(all, Clock.now())) {
            dao.save(changed);
        }

        List<Block> sorted = blockService.sortForTab(all, tab);
        List<Block> todoBlocks = new ArrayList<Block>();
        List<Block> doneBlocks = new ArrayList<Block>();
        for (Block b : sorted) {
            if (b.getStatus() == BlockStatus.DONE) {
                doneBlocks.add(b);
            } else {
                todoBlocks.add(b);
            }
        }

        req.setAttribute("date", date);
        req.setAttribute("tab", tab);
        req.setAttribute("todoBlocks", todoBlocks);
        req.setAttribute("doneBlocks", doneBlocks);
        req.getRequestDispatcher("/WEB-INF/jsp/day.jsp").forward(req, resp);
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isEmpty()) {
            return Clock.today();
        }
        try {
            return LocalDate.parse(s);
        } catch (DateTimeParseException e) {
            return Clock.today();
        }
    }
}
