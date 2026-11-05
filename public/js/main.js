// STPIM 画面（日画面の試作）。まだサーバやデータベースにはつながっていない。
(function (S) {
  'use strict';
  const { BlockType, BlockStatus, PriorityLabel, Blocks } = S;

  const pad = function (n) { return String(n).padStart(2, '0'); };
  const today = (function () {
    const d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  })();

  // 試作用のサンプル（データベースができたら、ここを置き換える）
  const blocks = [];
  [
    { title: '数学の勉強', memo: 'テスト範囲を1周', blockType: BlockType.TIME, plannedStartTime: '19:00', plannedEndTime: '20:00', isTimeAttack: true, betterDirection: S.BetterDirection.LONGER },
    { title: '朝の会議', memo: '', blockType: BlockType.TIME, plannedStartTime: '00:00', plannedEndTime: '00:30' },
    { title: '洗濯物を干す', memo: '', blockType: BlockType.PRIORITY, priority: S.Priority.HIGH },
    { title: '買い物', memo: '大根、乾そば', blockType: BlockType.PRIORITY, priority: S.Priority.LOW },
  ].forEach(function (input) {
    input.targetDate = today;
    const res = Blocks.createBlock(input);
    if (res.block) blocks.push(res.block);
  });

  let currentTab = BlockType.TIME;
  const tower = document.getElementById('tower');
  const cleared = document.getElementById('cleared');
  const toast = document.getElementById('toast');
  document.getElementById('today').textContent = today;

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 3500);
  }

  function hhmm(date) { return pad(date.getHours()) + ':' + pad(date.getMinutes()); }

  function describeResult(block, r) {
    const parts = [];
    if (r.diffFromPlanMinutes !== null) {
      const d = r.diffFromPlanMinutes;
      parts.push(d === 0 ? '予定どおり' : (d < 0 ? '予定より' + (-d) + '分早い' : '予定より' + d + '分遅れ'));
    }
    if (block.blockType === BlockType.PRIORITY) {
      parts.push((block.actualStartAt ? hhmm(block.actualStartAt) : '--:--') + ' 〜 ' + hhmm(block.actualEndAt));
    }
    if (r.durationMinutes !== null) parts.push('所要' + r.durationMinutes + '分');
    return '「' + block.title + '」をクリア：' + parts.join('／');
  }

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function subText(b) {
    const bits = [];
    if (b.blockType === BlockType.TIME) bits.push(b.plannedStartTime + '〜' + b.plannedEndTime);
    else bits.push('優先：' + PriorityLabel[b.priority]);
    if (b.status === BlockStatus.MISSED) bits.push('未処理');
    if (b.blockType === BlockType.PRIORITY && b.actualStartAt && b.status === BlockStatus.TODO) bits.push('実行中（' + hhmm(b.actualStartAt) + '〜）');
    if (b.isTimeAttack) bits.push('タイムアタック');
    if (b.memo) bits.push(b.memo);
    return bits.join('　');
  }

  function buildBlock(b) {
    const node = el('div', 'block' + (b.status === BlockStatus.MISSED ? ' missed' : '') + (b.status === BlockStatus.DONE ? ' done' : ''));
    node.appendChild(el('div', 'block-title', b.title));
    node.appendChild(el('div', 'block-sub', subText(b)));
    const actions = el('div', 'block-actions');
    if (b.status === BlockStatus.DONE) {
      const undoBtn = el('button', '', '戻す');
      undoBtn.type = 'button';
      undoBtn.addEventListener('click', function () {
        const r = Blocks.undo(b);
        if (r !== true) showToast(r);
        render();
      });
      actions.appendChild(undoBtn);
    } else if (b.blockType === BlockType.PRIORITY && !b.actualStartAt) {
      const startBtn = el('button', '', '開始');
      startBtn.type = 'button';
      startBtn.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      startBtn.addEventListener('click', function () { Blocks.start(b, new Date()); render(); });
      actions.appendChild(startBtn);
    }
    if (actions.children.length > 0) node.appendChild(actions);
    if (b.status !== BlockStatus.DONE) attachDrag(node, b);
    return node;
  }

  // 横にドラッグして、一定距離を超えたらクリア。足りなければ元に戻る
  function attachDrag(node, b) {
    let startX = 0;
    let dragging = false;
    node.addEventListener('pointerdown', function (e) {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true; startX = e.clientX;
      node.classList.add('dragging');
      node.setPointerCapture(e.pointerId);
    });
    node.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      node.style.transform = 'translateX(' + (e.clientX - startX) + 'px)';
    });
    function finish(e) {
      if (!dragging) return;
      dragging = false;
      node.classList.remove('dragging');
      const dx = e.clientX - startX;
      if (Math.abs(dx) >= S.CLEAR_DRAG_THRESHOLD) {
        node.style.transform = 'translateX(' + (dx > 0 ? 900 : -900) + 'px)';
        node.style.opacity = '0';
        setTimeout(function () {
          const r = Blocks.clear(b, new Date());
          if (r) showToast(describeResult(b, r));
          render();
        }, 220);
      } else {
        node.style.transform = '';
      }
    }
    node.addEventListener('pointerup', finish);
    node.addEventListener('pointercancel', finish);
  }

  function fill(container, list, emptyText) {
    container.textContent = '';
    if (list.length === 0) { container.appendChild(el('div', 'empty', emptyText)); return; }
    list.forEach(function (b) { container.appendChild(buildBlock(b)); });
  }

  function render() {
    const sorted = Blocks.sortForTab(blocks, currentTab);
    fill(tower, sorted.filter(function (b) { return b.status !== BlockStatus.DONE; }), 'ブロックがありません');
    fill(cleared, sorted.filter(function (b) { return b.status === BlockStatus.DONE; }), 'まだありません');
    document.getElementById('tab-time').classList.toggle('active', currentTab === BlockType.TIME);
    document.getElementById('tab-priority').classList.toggle('active', currentTab === BlockType.PRIORITY);
  }

  document.getElementById('tab-time').addEventListener('click', function () { currentTab = BlockType.TIME; render(); });
  document.getElementById('tab-priority').addEventListener('click', function () { currentTab = BlockType.PRIORITY; render(); });

  // 日画面を開くたびに、予定の終了を過ぎた未着手の時間制を、未処理にする
  Blocks.markOverdueAsMissed(blocks, new Date());
  render();
})(window.STPIM);
