package stpim.servlet;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import stpim.dao.Daos;
import stpim.model.User;
import stpim.service.AuthService;

/** ログイン、新規登録、ログアウト。 */
@WebServlet(urlPatterns = { "/login", "/register", "/logout" })
public class AuthServlet extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final AuthService authService = new AuthService(Daos.userDao());

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getServletPath();
        if ("/logout".equals(path)) {
            HttpSession session = req.getSession(false);
            if (session != null) session.invalidate();
            resp.sendRedirect(req.getContextPath() + "/login");
            return;
        }
        if (req.getSession(false) != null && req.getSession(false).getAttribute("userId") != null) {
            resp.sendRedirect(req.getContextPath() + "/calendar");
            return;
        }
        req.setAttribute("registerMode", "/register".equals(path));
        req.getRequestDispatcher("/WEB-INF/jsp/auth.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String path = req.getServletPath();
        if ("/register".equals(path)) {
            String error = authService.register(req.getParameter("username"), req.getParameter("password"));
            if (error != null) {
                req.setAttribute("error", error);
                req.setAttribute("formUsername", req.getParameter("username"));
                req.setAttribute("registerMode", true);
                req.getRequestDispatcher("/WEB-INF/jsp/auth.jsp").forward(req, resp);
                return;
            }
            resp.sendRedirect(req.getContextPath() + "/login?registered=1");
            return;
        }
        User user = authService.authenticate(req.getParameter("username"), req.getParameter("password"));
        if (user == null) {
            req.setAttribute("error", "ユーザー名またはパスワードが違います。");
            req.setAttribute("formUsername", req.getParameter("username"));
            req.setAttribute("registerMode", false);
            req.getRequestDispatcher("/WEB-INF/jsp/auth.jsp").forward(req, resp);
            return;
        }
        req.getSession(true);
        req.changeSessionId();
        HttpSession session = req.getSession(false);
        session.setMaxInactiveInterval(8 * 60 * 60);
        session.setAttribute("userId", user.getId());
        session.setAttribute("username", user.getUsername());
        resp.sendRedirect(req.getContextPath() + "/calendar");
    }
}
