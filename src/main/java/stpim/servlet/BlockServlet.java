package stpim.servlet;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import stpim.dao.BlockDao;
import stpim.dao.Daos;
import stpim.model.BetterDirection;
import stpim.model.Block;
import stpim.model.BlockStatus;
import stpim.model.BlockType;
import stpim.model.Priority;
import stpim.service.BlockInput;
import stpim.service.BlockService;
import stpim.util.Clock;

/** 作成・編集・複製・削除を担当する。 */
@WebServlet("/blocks/*")
public class BlockServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final BlockService service = new BlockService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        int userId = CalendarServlet.userId(req);
        Block block = null;
        if ("/edit".equals(path)) {
            block = find(req, userId, req.getParameter("id"));
            if (block == null) { resp.sendError(404); return; }
        }
        req.setAttribute("block", block);
        req.setAttribute("date", validDate(req.getParameter("date"), block == null ? Clock.today() : block.getTargetDate()));
        BlockInput initial = new BlockInput();
        initial.targetDate = validDate(req.getParameter("date"), block == null ? Clock.today() : block.getTargetDate());
        try { initial.blockType = BlockType.valueOf(req.getParameter("type")); } catch (RuntimeException e) { }
        req.setAttribute("form", block == null ? initial : null);
        req.setAttribute("seriesCandidates", timeAttackCandidates(userId));
        setHeader(req, userId);
        req.getRequestDispatcher("/WEB-INF/jsp/block-form.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getPathInfo();
        int userId = CalendarServlet.userId(req);
        BlockDao dao = Daos.blockDao();
        if ("/delete".equals(path)) {
            Block block = find(req, userId, req.getParameter("id"));
            if (block != null) dao.delete(userId, block.getId());
            resp.sendRedirect(req.getContextPath() + "/day?date=" + (block == null ? Clock.today() : block.getTargetDate()));
            return;
        }
        if ("/duplicate".equals(path)) {
            Block source = find(req, userId, req.getParameter("id"));
            LocalDate target = parseDate(req.getParameter("targetDate"));
            if (source == null || target == null) { resp.sendError(400, "複製元または日付が不正です"); return; }
            Block copy = duplicate(source, target);
            dao.save(copy);
            resp.sendRedirect(req.getContextPath() + "/day?date=" + target + "&tab=" + copy.getBlockType().name());
            return;
        }
        if (!"/save".equals(path)) { resp.sendError(404); return; }

        Block existing = find(req, userId, req.getParameter("id"));
        if (req.getParameter("id") != null && existing == null) { resp.sendError(404); return; }
        boolean locked = existing != null && (existing.getStatus() == BlockStatus.DONE || existing.getActualStartAt() != null);
        if (locked) {
            String title = req.getParameter("title") == null ? "" : req.getParameter("title").trim();
            if (title.isEmpty() || title.length() > BlockService.TITLE_MAX_LENGTH) {
                req.setAttribute("errors", java.util.Collections.singletonList(title.isEmpty()
                        ? "タイトルを入力してください" : "タイトルは100文字以内で入力してください"));
                req.setAttribute("block", existing);
                req.setAttribute("date", existing.getTargetDate());
                BlockInput lockedForm = new BlockInput();
                lockedForm.title = req.getParameter("title");
                lockedForm.memo = req.getParameter("memo");
                lockedForm.timeAttack = existing.isTimeAttack();
                lockedForm.betterDirection = existing.getBetterDirection();
                req.setAttribute("form", lockedForm);
                req.setAttribute("seriesCandidates", timeAttackCandidates(userId));
                setHeader(req, userId);
                req.getRequestDispatcher("/WEB-INF/jsp/block-form.jsp").forward(req, resp);
                return;
            }
            existing.setTitle(title);
            existing.setMemo(req.getParameter("memo") == null ? "" : req.getParameter("memo").trim());
            dao.save(existing);
            resp.sendRedirect(req.getContextPath() + "/day?date=" + existing.getTargetDate() + "&tab=" + existing.getBlockType().name());
            return;
        }
        BlockInput input = parseInput(req);
        List<String> errors = service.validate(input);
        if (!errors.isEmpty()) {
            req.setAttribute("errors", errors);
            req.setAttribute("block", existing);
            req.setAttribute("date", input.targetDate == null ? Clock.today() : input.targetDate);
            req.setAttribute("form", input);
            req.setAttribute("seriesCandidates", timeAttackCandidates(userId));
            setHeader(req, userId);
            req.getRequestDispatcher("/WEB-INF/jsp/block-form.jsp").forward(req, resp);
            return;
        }

        Block saved;
        saved = service.toBlock(input);
        saved.setUserId(userId);
        if (existing != null) {
            saved.setId(existing.getId());
            saved.setUndoCount(existing.getUndoCount());
            saved.setStatus(BlockStatus.TODO);
        }
        assignSeries(req, userId, existing, saved);
        dao.save(saved);
        resp.sendRedirect(req.getContextPath() + "/day?date=" + saved.getTargetDate() + "&tab=" + saved.getBlockType().name());
    }

    private void assignSeries(HttpServletRequest req, int userId, Block existing, Block saved) {
        if (!saved.isTimeAttack()) { saved.setSeriesId(null); return; }
        Integer compareId = parseInteger(req.getParameter("compareBlockId"));
        if (compareId != null) {
            Block candidate = Daos.blockDao().findById(userId, compareId);
            if (candidate != null && candidate.isTimeAttack() && candidate.getSeriesId() != null) {
                saved.setSeriesId(candidate.getSeriesId());
                saved.setBetterDirection(candidate.getBetterDirection());
                return;
            }
        }
        if (existing != null && existing.isTimeAttack() && existing.getSeriesId() != null) {
            saved.setSeriesId(existing.getSeriesId());
        } else {
            saved.setSeriesId(Daos.blockDao().nextSeriesId());
        }
    }

    private BlockInput parseInput(HttpServletRequest req) {
        BlockInput in = new BlockInput();
        in.targetDate = parseDate(req.getParameter("targetDate"));
        in.title = req.getParameter("title");
        in.memo = req.getParameter("memo");
        try { in.blockType = BlockType.valueOf(req.getParameter("blockType")); }
        catch (RuntimeException e) { in.blockType = null; }
        in.plannedStartTime = parseTime(req.getParameter("plannedStartTime"));
        in.plannedEndTime = parseTime(req.getParameter("plannedEndTime"));
        Integer rank = parseInteger(req.getParameter("priority"));
        in.priority = rank == null ? null : Priority.fromRank(rank);
        in.timeAttack = "on".equals(req.getParameter("timeAttack"));
        try { in.betterDirection = BetterDirection.valueOf(req.getParameter("betterDirection")); }
        catch (RuntimeException e) { in.betterDirection = null; }
        Integer compareId = parseInteger(req.getParameter("compareBlockId"));
        if (in.timeAttack && compareId != null) {
            Block candidate = Daos.blockDao().findById(CalendarServlet.userId(req), compareId);
            if (candidate != null && candidate.isTimeAttack()) in.betterDirection = candidate.getBetterDirection();
        }
        if (in.targetDate == null) in.targetDate = Clock.today();
        return in;
    }

    private List<Block> timeAttackCandidates(int userId) {
        java.util.ArrayList<Block> result = new java.util.ArrayList<Block>();
        for (Block block : Daos.blockDao().findByUser(userId)) {
            if (block.isTimeAttack() && block.getSeriesId() != null && block.getActualEndAt() != null) result.add(block);
        }
        return result;
    }

    private void setHeader(HttpServletRequest req, int userId) {
        int cleared = 0;
        for (Block item : Daos.blockDao().findByUser(userId)) if (item.getStatus() == BlockStatus.DONE) cleared++;
        req.setAttribute("totalCleared", cleared);
        req.setAttribute("currentView", "day");
    }

    private Block duplicate(Block source, LocalDate target) {
        Block copy = new Block();
        copy.setUserId(source.getUserId()); copy.setTargetDate(target); copy.setTitle(source.getTitle());
        copy.setMemo(source.getMemo()); copy.setBlockType(source.getBlockType()); copy.setPlannedStartTime(source.getPlannedStartTime());
        copy.setPlannedEndTime(source.getPlannedEndTime()); copy.setPriority(source.getPriority());
        copy.setTimeAttack(source.isTimeAttack()); copy.setBetterDirection(source.getBetterDirection()); copy.setSeriesId(source.getSeriesId());
        return copy;
    }

    private Block find(HttpServletRequest req, int userId, String value) {
        Integer id = parseInteger(value);
        return id == null ? null : Daos.blockDao().findById(userId, id);
    }
    private static Integer parseInteger(String value) { try { return value == null ? null : Integer.valueOf(value); } catch (RuntimeException e) { return null; } }
    private static LocalDate parseDate(String value) { try { return value == null ? null : LocalDate.parse(value); } catch (DateTimeParseException e) { return null; } }
    private static LocalTime parseTime(String value) { try { return value == null || value.isEmpty() ? null : LocalTime.parse(value); } catch (DateTimeParseException e) { return null; } }
    private static LocalDate validDate(String value, LocalDate fallback) { LocalDate date = parseDate(value); return date == null ? fallback : date; }
}
