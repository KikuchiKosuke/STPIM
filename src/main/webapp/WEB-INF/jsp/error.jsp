<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="stpim.util.Html" %>
<%
Integer statusCode = (Integer) request.getAttribute("javax.servlet.error.status_code");
int status = statusCode == null ? 500 : statusCode.intValue();
String title = status == 404 ? "ページが見つかりません"
        : status == 400 ? "入力内容を確認してください"
        : status == 403 ? "この操作は許可されていません"
        : "処理中にエラーが発生しました";
String message = status == 404 ? "URLが正しいか確認してください。"
        : status == 400 ? "入力内容を確認して、もう一度お試しください。"
        : status == 403 ? "ログイン状態と操作内容を確認してください。"
        : "時間をおいてから、もう一度お試しください。";
String ctx = request.getContextPath();
String originalUri = (String) request.getAttribute("javax.servlet.error.request_uri");
String query = request.getQueryString();
String retryUrl = originalUri != null && originalUri.startsWith(ctx + "/")
        ? originalUri : ctx + "/calendar";
if (query != null && !query.isEmpty()) retryUrl += "?" + query;
boolean canRetry = "GET".equalsIgnoreCase(request.getMethod());
%>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><%= Html.escape(title) %> | STPIM</title>
  <link rel="stylesheet" href="<%= ctx %>/css/style.css">
</head>
<body>
  <main class="error-page">
    <section class="panel error-card" role="alert">
      <span class="error-code"><%= status %></span>
      <p class="eyebrow">STPIM</p>
      <h1><%= Html.escape(title) %></h1>
      <p class="heading-sub"><%= Html.escape(message) %></p>
      <div class="error-actions">
        <% if (canRetry) { %><a class="button primary" href="<%= Html.escape(retryUrl) %>">もう一度開く</a><% } %>
        <a class="button" href="<%= ctx %>/calendar">カレンダーへ戻る</a>
        <button class="button quiet" type="button" onclick="history.back()">前の画面へ戻る</button>
      </div>
    </section>
  </main>
</body>
</html>
