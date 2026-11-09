<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="java.util.List, stpim.model.Block, stpim.model.BlockStatus, stpim.model.BlockType, stpim.util.BlockView, stpim.util.Html" %>
<%
    // JSTL を入れたら、この部分は c:forEach に書き換えられる
    @SuppressWarnings("unchecked")
    List<Block> todoBlocks = (List<Block>) request.getAttribute("todoBlocks");
    @SuppressWarnings("unchecked")
    List<Block> doneBlocks = (List<Block>) request.getAttribute("doneBlocks");
    BlockType tab = (BlockType) request.getAttribute("tab");
    String ctx = request.getContextPath();
%>
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>STPIM</title>
  <link rel="stylesheet" href="<%= ctx %>/css/style.css">
</head>
<body data-ctx="<%= ctx %>">
  <header>
    <h1>STPIM</h1>
    <span><%= request.getAttribute("date") %></span>
  </header>
  <main>
    <div class="tabs">
      <a class="tab<%= tab == BlockType.TIME ? " active" : "" %>" href="<%= ctx %>/day?date=<%= request.getAttribute("date") %>&tab=TIME">時間制</a>
      <a class="tab<%= tab == BlockType.PRIORITY ? " active" : "" %>" href="<%= ctx %>/day?date=<%= request.getAttribute("date") %>&tab=PRIORITY">優先順位</a>
    </div>

    <h2>これからやること（横にドラッグしてクリア）</h2>
    <div class="tower">
<% if (todoBlocks.isEmpty()) { %>
      <div class="empty">ブロックがありません</div>
<% } %>
<% for (Block b : todoBlocks) { %>
      <div class="<%= BlockView.cssClass(b) %>" data-id="<%= b.getId() %>">
        <div class="block-title"><%= Html.escape(b.getTitle()) %></div>
        <div class="block-sub"><%= Html.escape(BlockView.subText(b)) %></div>
<%   if (b.getBlockType() == BlockType.PRIORITY && b.getActualStartAt() == null) { %>
        <div class="block-actions"><button type="button" class="btn-start" data-id="<%= b.getId() %>">開始</button></div>
<%   } %>
      </div>
<% } %>
    </div>

    <h2>クリア済み</h2>
    <div class="tower">
<% if (doneBlocks.isEmpty()) { %>
      <div class="empty">まだありません</div>
<% } %>
<% for (Block b : doneBlocks) { %>
      <div class="<%= BlockView.cssClass(b) %>" data-id="<%= b.getId() %>">
        <div class="block-title"><%= Html.escape(b.getTitle()) %></div>
        <div class="block-sub"><%= Html.escape(BlockView.subText(b)) %></div>
        <div class="block-actions"><button type="button" class="btn-undo" data-id="<%= b.getId() %>">戻す</button></div>
      </div>
<% } %>
    </div>
  </main>
  <div class="toast" id="toast"></div>
  <script src="<%= ctx %>/js/day.js"></script>
</body>
</html>
