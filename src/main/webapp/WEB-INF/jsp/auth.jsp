<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="stpim.util.Html" %>
<%
boolean registerMode = Boolean.TRUE.equals(request.getAttribute("registerMode"));
String error = (String) request.getAttribute("error");
String ctx = request.getContextPath();
boolean registered = "1".equals(request.getParameter("registered"));
String formUsername = (String) request.getAttribute("formUsername");
%>
<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>STPIM ログイン</title><link rel="stylesheet" href="<%= ctx %>/css/style.css"></head>
<body><main class="login-page">
  <section class="login-story"><div class="brand login-brand"><span class="brand-mark"></span><span>STPIM</span></div>
    <p class="eyebrow">Schedule · Stack · Clear</p><h1>今日を、ひとつずつ。<br>軽やかに。</h1>
    <p>予定も、やりたいことも。ブロックを積んで、横へスライドして、今日の一歩をクリアしよう。</p>
    <div class="hero-stack" aria-hidden="true"><div class="hero-block">会議の準備</div><div class="hero-block">洗濯物をたたむ</div><div class="hero-block">卒業制作を進める</div></div>
  </section>
  <section class="login-side"><form class="login-card" method="post" action="<%= ctx %><%= registerMode ? "/register" : "/login" %>">
    <div class="auth-tabs"><a class="auth-tab <%= registerMode ? "" : "active" %>" href="<%= ctx %>/login">ログイン</a><a class="auth-tab <%= registerMode ? "active" : "" %>" href="<%= ctx %>/register">新規登録</a></div>
    <% if (registered) { %><div class="soft-note" role="status">登録しました。ユーザー名とパスワードでログインしてください。</div><% } %>
    <% if (error != null) { %><div class="auth-error" role="alert"><%= Html.escape(error) %></div><% } %>
    <label class="field"><span class="field-label">ユーザー名</span><input name="username" autocomplete="username" maxlength="30" required placeholder="例：stpim_user" value="<%= Html.escape(formUsername) %>"></label>
    <label class="field"><span class="field-label">パスワード</span><input name="password" type="password" autocomplete="<%= registerMode ? "new-password" : "current-password" %>" minlength="<%= registerMode ? "8" : "1" %>" required placeholder="<%= registerMode ? "8文字以上" : "パスワード" %>"></label>
    <button class="button primary auth-submit" type="submit"><%= registerMode ? "アカウントを作成" : "ログインしてカレンダーへ" %><span aria-hidden="true">→</span></button>
    <p class="auth-foot"><% if (registerMode) { %>ユーザー名は3〜30文字、パスワードは8文字以上です。<% } else { %>デモ：<strong>demo</strong> ／ <strong>demo1234</strong><br>試作用のデータはTomcatのメモリに保存されます。<% } %></p>
  </form></section>
</main></body></html>
