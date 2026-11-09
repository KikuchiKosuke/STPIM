// 日画面の動き（ドラッグでクリア、開始、戻す）。処理はサーバ（BlockActionServlet）に頼む。
(function () {
  'use strict';
  var CLEAR_DRAG_THRESHOLD = 120; // この距離（px）を超えて離すとクリア
  var ctx = document.body.getAttribute('data-ctx') || '';
  var toast = document.getElementById('toast');

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 3500);
  }

  // 画面を読み込み直しても、直前の結果が見えるようにする
  var pending = sessionStorage.getItem('stpim-toast');
  if (pending) { sessionStorage.removeItem('stpim-toast'); showToast(pending); }

  function post(action, id) {
    return fetch(ctx + '/block/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'id=' + encodeURIComponent(id)
    }).then(function (res) { return res.json(); });
  }

  function describe(r) {
    var parts = [];
    if (r.diffFromPlanMinutes !== null) {
      var d = r.diffFromPlanMinutes;
      parts.push(d === 0 ? '予定どおり' : (d < 0 ? '予定より' + (-d) + '分早い' : '予定より' + d + '分遅れ'));
    }
    if (r.blockType === 'PRIORITY') {
      parts.push((r.startAt || '--:--') + ' 〜 ' + r.endAt);
    }
    if (r.durationMinutes !== null) { parts.push('所要' + r.durationMinutes + '分'); }
    return '「' + r.title + '」をクリア：' + parts.join('／');
  }

  function attachDrag(node) {
    var startX = 0;
    var dragging = false;
    node.addEventListener('pointerdown', function (e) {
      if (e.target.tagName === 'BUTTON') { return; }
      dragging = true; startX = e.clientX;
      node.classList.add('dragging');
      node.setPointerCapture(e.pointerId);
    });
    node.addEventListener('pointermove', function (e) {
      if (!dragging) { return; }
      node.style.transform = 'translateX(' + (e.clientX - startX) + 'px)';
    });
    function finish(e) {
      if (!dragging) { return; }
      dragging = false;
      node.classList.remove('dragging');
      var dx = e.clientX - startX;
      if (Math.abs(dx) < CLEAR_DRAG_THRESHOLD) { node.style.transform = ''; return; }
      node.style.transform = 'translateX(' + (dx > 0 ? 900 : -900) + 'px)';
      node.style.opacity = '0';
      post('clear', node.getAttribute('data-id')).then(function (r) {
        sessionStorage.setItem('stpim-toast', r.ok ? describe(r) : r.message);
        setTimeout(function () { location.reload(); }, 220);
      });
    }
    node.addEventListener('pointerup', finish);
    node.addEventListener('pointercancel', finish);
  }

  Array.prototype.forEach.call(document.querySelectorAll('.block.draggable'), attachDrag);

  Array.prototype.forEach.call(document.querySelectorAll('.btn-start'), function (btn) {
    btn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    btn.addEventListener('click', function () {
      post('start', btn.getAttribute('data-id')).then(function (r) {
        if (r.ok) { location.reload(); } else { showToast(r.message); }
      });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.btn-undo'), function (btn) {
    btn.addEventListener('click', function () {
      post('undo', btn.getAttribute('data-id')).then(function (r) {
        if (r.ok) { location.reload(); } else { showToast(r.message); }
      });
    });
  });
})();
