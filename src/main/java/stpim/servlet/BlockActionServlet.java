package stpim.servlet;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import stpim.dao.BlockDao;
import stpim.dao.Daos;
import stpim.model.Block;
import stpim.model.ClearResult;
import stpim.service.BlockService;
import stpim.service.ClearService;
import stpim.util.Clock;

/** ブロックの操作（POST /block/start、/block/clear、/block/undo）。結果は JSON で返す */
@WebServlet("/block/*")
public class BlockActionServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final DateTimeFormatter HHMM = DateTimeFormatter.ofPattern("HH:mm");

    private final BlockService blockService = new BlockService();
    private final ClearService clearService = new ClearService(Daos.blockDao());

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json; charset=UTF-8");
        PrintWriter out = resp.getWriter();

        String action = req.getPathInfo() == null ? "" : req.getPathInfo();
        BlockDao dao = Daos.blockDao();
        Block block = null;
        try {
            block = dao.findById(userId(req), Integer.parseInt(req.getParameter("id")));
        } catch (NumberFormatException e) {
            // id が数字でないときは、下で「見つかりません」として返す
        }
        if (block == null) {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            out.print(error("ブロックが見つかりません"));
            return;
        }

        LocalDateTime now = Clock.now();
        if ("/start".equals(action)) {
            boolean ok = blockService.start(block, now);
            if (ok) dao.save(block);
            out.print(ok ? "{\"ok\":true}" : error("開始できないブロックです"));
        } else if ("/clear".equals(action)) {
            ClearResult r = clearService.clear(block, now);
            if (r == null) {
                out.print(error(block.getStatus() == stpim.model.BlockStatus.DONE
                        ? "すでにクリアされています" : "未来の日のブロックは当日になってからクリアできます"));
                return;
            }
            dao.save(block);
            req.getSession().setAttribute("clearResult", r);
            req.getSession().setAttribute("clearBlock", block);
            out.print("{\"ok\":true"
                    + ",\"title\":" + quote(block.getTitle())
                    + ",\"blockType\":" + quote(block.getBlockType().name())
                    + ",\"diffFromPlanMinutes\":" + number(r.getDiffFromPlanMinutes())
                    + ",\"durationMinutes\":" + number(r.getDurationMinutes())
                    + ",\"previousDurationMinutes\":" + number(r.getPreviousDurationMinutes())
                    + ",\"bestBeforeMinutes\":" + number(r.getBestBeforeMinutes())
                    + ",\"personalBest\":" + (r.getPersonalBest() == null ? "null" : r.getPersonalBest().toString())
                    + ",\"startAt\":" + (block.getActualStartAt() == null ? "null" : quote(block.getActualStartAt().format(HHMM)))
                    + ",\"endAt\":" + quote(block.getActualEndAt().format(HHMM))
                    + "}");
        } else if ("/manual".equals(action)) {
            LocalTime endTime = parseTime(req.getParameter("endTime"));
            ClearResult r = clearService.manualClear(block, endTime, now);
            if (r == null) {
                out.print(error("終了時刻を確認してください。開始時刻より後で、現在時刻までを入力できます。"));
                return;
            }
            dao.save(block);
            req.getSession().setAttribute("clearResult", r);
            req.getSession().setAttribute("clearBlock", block);
            out.print("{\"ok\":true"
                    + ",\"title\":" + quote(block.getTitle())
                    + ",\"blockType\":" + quote(block.getBlockType().name())
                    + ",\"diffFromPlanMinutes\":" + number(r.getDiffFromPlanMinutes())
                    + ",\"durationMinutes\":" + number(r.getDurationMinutes())
                    + ",\"endAt\":" + quote(block.getActualEndAt().format(HHMM)) + "}");
        } else if ("/undo".equals(action)) {
            String message = clearService.undo(block);
            if (message != null) {
                out.print(error(message));
                return;
            }
            dao.save(block);
            out.print("{\"ok\":true}");
        } else {
            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
            out.print(error("操作が見つかりません"));
        }
    }

    private static int userId(HttpServletRequest req) {
        return ((Integer) req.getSession(false).getAttribute("userId")).intValue();
    }

    private static LocalTime parseTime(String value) {
        try { return value == null ? null : LocalTime.parse(value); }
        catch (RuntimeException e) { return null; }
    }

    private static String error(String message) {
        return "{\"ok\":false,\"message\":" + quote(message) + "}";
    }

    private static String number(Integer n) {
        return n == null ? "null" : n.toString();
    }

    /** JSON の文字列にする（" と \ と改行をエスケープ） */
    private static String quote(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
            case '"': sb.append("\\\""); break;
            case '\\': sb.append("\\\\"); break;
            case '\n': sb.append("\\n"); break;
            case '\r': sb.append("\\r"); break;
            case '\t': sb.append("\\t"); break;
            default:
                if (c < 0x20) {
                    sb.append(String.format("\\u%04x", (int) c));
                } else {
                    sb.append(c);
                }
            }
        }
        return sb.append('"').toString();
    }
}
