(() => {
  "use strict";

  const STORE_KEY = "stpim.prototype.v1";
  const SESSION_KEY = "stpim.session.v1";
  const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const id = () => (globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const fromKey = (key) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d, 12); };
  const shiftDate = (key, days) => { const date = fromKey(key); date.setDate(date.getDate() + days); return dateKey(date); };
  const todayKey = () => dateKey(new Date());
  const pad = (number) => String(number).padStart(2, "0");
  const timeNow = () => `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
  const formatDate = (key, weekday = true) => {
    const date = fromKey(key);
    return `${date.getMonth() + 1}月${date.getDate()}日${weekday ? `（${WEEK[date.getDay()]}）` : ""}`;
  };
  const dateTime = (key, time) => new Date(`${key}T${time || "00:00"}:00`);
  const formatTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const monthKey = (key) => key.slice(0, 7);
  const monthLabel = (year, month) => `${year}年${month + 1}月`;
  const goalLabel = (goal) => goal === "LONGER" ? "長い方が良い" : "短い方が良い";
  const typeLabel = (type) => type === "TIMED" ? "時間制" : "優先順位";
  const statusLabel = (status) => ({ TODO: "未着手", DONE: "完了", MISSED: "未処理" })[status] || "未着手";

  function demoData() {
    const today = todayKey();
    const seriesStudy = id();
    const seriesClean = id();
    const makeBlock = (offset, title, type, extra = {}) => ({
      id: id(), seriesId: null, title, memo: "", type, targetDate: shiftDate(today, offset),
      start: null, end: null, priority: null, status: "TODO", isTimeAttack: false, goal: null,
      actualStartAt: null, actualEndAt: null, manualEnd: false, undoUsed: false, record: null,
      createdAt: new Date().toISOString(), ...extra,
    });
    const blocks = [
      makeBlock(0, "プロジェクト会議", "TIMED", { memo: "企画の進捗を共有する", start: "09:30", end: "10:30" }),
      makeBlock(0, "メールと事務作業", "TIMED", { memo: "返信と書類の確認", start: "11:00", end: "11:45", isTimeAttack: true, goal: "SHORTER", seriesId: seriesClean }),
      makeBlock(0, "卒業制作のUIを進める", "PRIORITY", { memo: "日画面の操作を仕上げる", priority: 1, isTimeAttack: true, goal: "LONGER", seriesId: seriesStudy, actualStartAt: new Date(`${today}T08:35:00`).toISOString() }),
      makeBlock(0, "買い物", "PRIORITY", { memo: "食材と日用品", priority: 2 }),
      makeBlock(-1, "机まわりを片づける", "PRIORITY", { memo: "書類をまとめる", priority: 1, status: "DONE", actualStartAt: new Date(`${shiftDate(today, -1)}T10:18:00`).toISOString(), actualEndAt: new Date(`${shiftDate(today, -1)}T10:42:00`).toISOString(), record: { durationMinutes: 24, previousDuration: 31, bestBefore: 31, isPersonalBest: true, manual: false } }),
      makeBlock(-1, "資料を提出する", "TIMED", { start: "13:00", end: "14:00", status: "DONE", actualEndAt: new Date(`${shiftDate(today, -1)}T13:54:00`).toISOString(), actualStartAt: new Date(`${shiftDate(today, -1)}T13:00:00`).toISOString(), record: { durationMinutes: 54, previousDuration: null, bestBefore: null, isPersonalBest: true, manual: false } }),
      makeBlock(-2, "メールと事務作業", "TIMED", { memo: "返信と書類の確認", start: "11:00", end: "11:45", isTimeAttack: true, goal: "SHORTER", seriesId: seriesClean, status: "DONE", actualStartAt: new Date(`${shiftDate(today, -2)}T11:00:00`).toISOString(), actualEndAt: new Date(`${shiftDate(today, -2)}T11:38:00`).toISOString(), record: { durationMinutes: 38, previousDuration: 42, bestBefore: 42, isPersonalBest: true, manual: false } }),
      makeBlock(-3, "卒業制作のUIを進める", "PRIORITY", { memo: "日画面の操作を仕上げる", priority: 1, isTimeAttack: true, goal: "LONGER", seriesId: seriesStudy, status: "DONE", actualStartAt: new Date(`${shiftDate(today, -3)}T09:00:00`).toISOString(), actualEndAt: new Date(`${shiftDate(today, -3)}T09:46:00`).toISOString(), record: { durationMinutes: 46, previousDuration: 35, bestBefore: 35, isPersonalBest: true, manual: false } }),
      makeBlock(-4, "洗濯物をたたむ", "TIMED", { start: "18:00", end: "18:30", status: "DONE", actualStartAt: new Date(`${shiftDate(today, -4)}T18:00:00`).toISOString(), actualEndAt: new Date(`${shiftDate(today, -4)}T18:33:00`).toISOString(), record: { durationMinutes: 33, previousDuration: null, bestBefore: null, isPersonalBest: true, manual: false } }),
    ];
    return [{ id: "demo-user", username: "demo", password: "demo1234", blocks }];
  }

  const state = {
    users: loadUsers(), user: null, view: "calendar", month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    selectedDate: todayKey(), selectedBlockId: null, selectedSeriesId: null, recordFilter: "ALL", recordMonth: "ALL",
    authMode: "login", authError: "", modal: null,
  };
  let sessionTimer = null;
  const clearing = new Set();

  function loadUsers() {
    try { const stored = localStorage.getItem(STORE_KEY); if (stored) return JSON.parse(stored); }
    catch (error) { console.warn("STPIM local data could not be loaded", error); }
    return demoData();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state.users)); }
    catch (error) { toast("保存できませんでした。ブラウザーの保存容量を確認してください。", true); }
  }
  function getUser() { return state.users.find((user) => user.id === state.user?.id) || null; }
  function blocks() { return getUser()?.blocks || []; }
  function byId(blockId) { return blocks().find((block) => block.id === blockId); }
  function statusOf(block) {
    if (block.status === "DONE") return "DONE";
    if (block.type === "TIMED" && block.targetDate && block.end) {
      const deadline = dateTime(block.targetDate, block.end);
      if (deadline.getTime() < Date.now()) return "MISSED";
    }
    return "TODO";
  }
  function finished() { return blocks().filter((block) => block.status === "DONE"); }
  function getSeries(seriesId) { return blocks().filter((block) => block.seriesId === seriesId && block.isTimeAttack); }
  function attackOutcome(block) {
    if (!block?.isTimeAttack || block.record?.durationMinutes == null) return null;
    const past = blocks().filter((item) => item.id !== block.id && item.seriesId === block.seriesId && item.status === "DONE" && item.record?.durationMinutes != null)
      .sort((a, b) => new Date(a.actualEndAt) - new Date(b.actualEndAt) || String(a.id).localeCompare(String(b.id)));
    const values = past.map((item) => item.record.durationMinutes);
    const bestBefore = values.length ? block.goal === "LONGER" ? Math.max(...values) : Math.min(...values) : null;
    const durationMinutes = block.record.durationMinutes;
    return {
      previousDuration: past.at(-1)?.record.durationMinutes ?? null,
      bestBefore,
      isPersonalBest: bestBefore == null || (block.goal === "LONGER" ? durationMinutes > bestBefore : durationMinutes < bestBefore),
    };
  }
  function seriesList() {
    const seen = new Set();
    return blocks().filter((block) => block.isTimeAttack && block.seriesId && !seen.has(block.seriesId) && seen.add(block.seriesId))
      .map((block) => ({ id: block.seriesId, title: block.title, goal: block.goal, records: blocks().filter((candidate) => candidate.seriesId === block.seriesId && candidate.status === "DONE" && candidate.record?.durationMinutes != null).sort((a, b) => new Date(a.actualEndAt) - new Date(b.actualEndAt) || String(a.id).localeCompare(String(b.id))) }))
      .sort((a, b) => a.title.localeCompare(b.title, "ja"));
  }
  function toast(message, error = false) {
    const root = $("#toast-root");
    if (!root) return;
    const el = document.createElement("div");
    el.className = `toast${error ? " error" : ""}`;
    el.innerHTML = `<span class="toast-icon">${error ? "!" : "✓"}</span><span>${esc(message)}</span>`;
    root.append(el); window.setTimeout(() => el.remove(), 3200);
  }

  function render() {
    const root = $("#app");
    if (!state.user) { root.innerHTML = renderAuth(); renderModal(); bindAuth(); return; }
    const activeUser = getUser();
    if (!activeUser) { state.user = null; render(); return; }
    root.innerHTML = `<div class="app-shell">${renderHeader()}${renderPage()}</div>`;
    bindApp(); renderModal();
  }

  function renderAuth() {
    return `<div class="login-page">
      <section class="login-story">
        <div class="brand login-brand"><span class="brand-mark"></span><span>STPIM</span></div>
        <h1>今日を、ひとつずつ。<br>軽やかに。</h1>
        <p>予定も、やりたいことも。ブロックを積んで、横にスライドして、今日の一歩をクリアしよう。</p>
        <div class="hero-stack" aria-hidden="true"><div class="hero-block">会議の準備</div><div class="hero-block">洗濯物をたたむ</div><div class="hero-block">卒業制作を進める</div></div>
      </section>
      <section class="login-side"><form class="login-card" id="auth-form">
        <div class="auth-tabs"><button class="auth-tab ${state.authMode === "login" ? "active" : ""}" type="button" data-auth-mode="login">ログイン</button><button class="auth-tab ${state.authMode === "register" ? "active" : ""}" type="button" data-auth-mode="register">新規登録</button></div>
        ${state.authError ? `<div class="auth-error" role="alert">${esc(state.authError)}</div>` : ""}
        ${state.authMode === "register" ? `<label class="field"><span class="field-label">ユーザー名</span><input name="username" autocomplete="username" maxlength="30" placeholder="ユーザー名" required><span class="field-hint">3文字以上。ログイン時に使います。</span></label>` : `<label class="field"><span class="field-label">ユーザー名</span><input name="username" autocomplete="username" placeholder="例：stpim_user" required></label>`}
        <label class="field"><span class="field-label">パスワード</span><input name="password" type="password" autocomplete="${state.authMode === "login" ? "current-password" : "new-password"}" placeholder="${state.authMode === "register" ? "8文字以上" : "パスワード"}" minlength="${state.authMode === "register" ? "8" : "1"}" required></label>
        <button class="button primary auth-submit" type="submit">${state.authMode === "login" ? "ログインしてカレンダーへ" : "アカウントを作成"}<span aria-hidden="true">→</span></button>
        <p class="auth-foot">${state.authMode === "login" ? `デモを見る：<strong>demo</strong> ／ <strong>demo1234</strong><br>この試作のアカウントと予定は、このブラウザー内に保存されます。` : "この試作では、入力した内容をこのブラウザー内に保存します。"}</p>
      </form></section>
    </div>`;
  }

  function renderHeader() {
    const nav = [["calendar", "カレンダー"], ["day", "今日のブロック"], ["attack", "タイムアタック"], ["records", "記録・累計"]];
    const total = finished().length;
    return `<header class="topbar"><button class="brand" data-action="go-calendar" aria-label="STPIM ホーム"><span class="brand-mark"></span><span>STPIM</span></button>
      <nav class="nav" aria-label="メインナビゲーション">${nav.map(([view, label]) => `<button class="nav-link ${state.view === view ? "active" : ""}" data-view="${view}">${label}</button>`).join("")}</nav>
      <div class="topbar-right"><span class="total-pill">累計クリア <span class="mono">${total}</span></span><span class="user-pill"><span class="avatar">${esc((state.user.username || "S").slice(0, 1).toUpperCase())}</span><span class="user-name">${esc(state.user.username)}</span></span><button class="logout-button" data-action="logout">ログアウト</button></div>
    </header>`;
  }

  function renderPage() {
    if (state.view === "day") return renderDay();
    if (state.view === "attack") return renderAttack();
    if (state.view === "records") return renderRecords();
    return renderCalendar();
  }

  function renderCalendar() {
    const year = state.month.getFullYear(); const month = state.month.getMonth();
    const first = new Date(year, month, 1, 12); const start = new Date(year, month, 1 - first.getDay(), 12);
    const days = Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; });
    const thisMonthBlocks = blocks().filter((block) => monthKey(block.targetDate) === `${year}-${pad(month + 1)}`);
    const counts = new Map(); for (const block of thisMonthBlocks) counts.set(block.targetDate, (counts.get(block.targetDate) || 0) + 1);
    const selected = blocks().filter((block) => block.targetDate === state.selectedDate).sort(sortBlocks);
    return `<main class="page"><div class="page-heading"><div><p class="eyebrow">予定を見渡す</p><h1>カレンダー</h1><p class="heading-sub">積み上げた予定を、今日の流れに。</p></div><div class="heading-actions"><button class="button" data-action="today">今日に戻る</button><button class="button primary" data-action="add-block">＋ ブロックを追加</button></div></div>
      <div class="calendar-layout"><section class="panel calendar-panel"><div class="calendar-toolbar"><button class="button icon" data-action="prev-month" aria-label="前月">‹</button><h2 class="month-title"><span class="mono">${year}</span>年${month + 1}月</h2><button class="button icon" data-action="next-month" aria-label="次月">›</button><span class="spacer"></span><button class="button small" data-action="today">今日</button></div>
        <div class="weekday-row">${WEEK.map((day, i) => `<div class="weekday" style="${i === 0 ? "color:#bb7868" : i === 6 ? "color:#6d91aa" : ""}">${day}</div>`).join("")}</div>
        <div class="calendar-grid">${days.map((date) => {
          const key = dateKey(date); const dayBlocks = blocks().filter((block) => block.targetDate === key).sort(sortBlocks); const missed = dayBlocks.filter((block) => statusOf(block) === "MISSED").length;
          const bars = dayBlocks.slice(0, 4).map((block) => `<span class="day-bar ${block.type === "PRIORITY" ? "priority" : ""} ${block.isTimeAttack ? "attack" : ""} ${statusOf(block) === "MISSED" ? "missed" : ""}"></span>`).join("");
          return `<button class="day-cell ${date.getMonth() !== month ? "muted" : ""} ${key === state.selectedDate ? "selected" : ""} ${key === todayKey() ? "today" : ""}" data-date="${key}" aria-label="${formatDate(key)}、${dayBlocks.length}件">
            <span class="day-num">${date.getDate()}</span><span class="day-bars">${bars}</span><span class="day-meta">${missed ? `<span class="missed-count">未処理 ${missed}</span>` : `<span></span>`}${dayBlocks.length > 4 ? `+${dayBlocks.length - 4}` : counts.has(key) ? `${dayBlocks.length}件` : ""}</span></button>`;
        }).join("")}</div>
      </section><aside class="calendar-side"><section class="panel side-card"><p class="eyebrow">選択した日</p><div class="selected-date">${formatDate(state.selectedDate)}</div><div class="mini-list">${selected.length ? selected.slice(0, 4).map((block) => `<div class="mini-item ${block.type === "PRIORITY" ? "priority" : ""} ${block.isTimeAttack ? "attack" : ""}" data-open-day="${block.id}"><span class="mini-time">${block.type === "TIMED" ? block.start : `優先 ${block.priority}`}</span><span class="mini-item-title">${esc(block.title)}</span></div>`).join("") : `<div class="empty-mini">この日のブロックはありません</div>`}${selected.length > 4 ? `<div class="tiny">ほか ${selected.length - 4}件</div>` : ""}</div><button class="button primary" style="width:100%" data-action="open-selected-day">この日のブロックを見る　→</button></section>
        <section class="panel side-card legend-panel"><h2>凡例</h2><div class="legend"><span class="legend-item"><i class="legend-dot"></i>時間制</span><span class="legend-item"><i class="legend-dot priority"></i>優先順位</span><span class="legend-item"><i class="legend-dot attack"></i>タイムアタック</span></div><div class="divider"></div><p class="tiny" style="line-height:1.7;margin:0">日付を選ぶと予定を確認できます。過ぎた時間制の予定は未処理として表示します。</p></section></aside></div>
    </main>`;
  }

  function sortBlocks(a, b) {
    const typeOrder = a.type.localeCompare(b.type);
    if (typeOrder) return typeOrder;
    if (a.type === "TIMED") return (a.start || "").localeCompare(b.start || "");
    return (a.priority || 99) - (b.priority || 99) || (a.createdAt || "").localeCompare(b.createdAt || "");
  }

  function renderBlock(block) {
    const status = statusOf(block); const selected = state.selectedBlockId === block.id;
    const time = block.type === "TIMED"
      ? `<span class="time-start">${esc(block.start)}</span><span class="time-arrow">↓</span><span class="time-end">${esc(block.end)}</span><span class="time-duration">${durationLabel(block.start, block.end)}</span>`
      : `<span class="priority-label">優先度</span><strong class="priority-value">${["", "高", "中", "低"][block.priority] || block.priority}</strong>`;
    const tags = `${block.isTimeAttack ? `<span class="mini-tag">タイムアタック</span>` : ""}${block.record?.durationMinutes != null ? `<span class="mini-tag">記録 ${block.record.durationMinutes}分</span>` : ""}${block.manualEnd ? `<span class="mini-tag">手入力</span>` : ""}`;
    const startAction = block.type === "PRIORITY" && status !== "DONE"
      ? block.actualStartAt
        ? `<button class="start-block-button started" type="button" data-action="start" data-id="${block.id}" disabled>開始済み ${formatTime(new Date(block.actualStartAt))}</button>`
        : `<button class="start-block-button" type="button" data-action="start" data-id="${block.id}" ${block.targetDate > todayKey() ? "disabled title='当日から開始できます'" : ""}>開始</button>`
      : "";
    return `<article class="block-card ${block.type === "PRIORITY" ? "priority" : ""} ${block.isTimeAttack ? "attack" : ""} ${status === "MISSED" ? "missed" : ""} ${status === "DONE" ? "done" : ""} ${selected ? "selected" : ""}" data-block="${block.id}" tabindex="0" aria-label="${esc(block.title)}、${statusLabel(status)}。横にスライドしてクリア" >
      <div class="block-time ${block.type === "PRIORITY" ? "priority-time" : ""}">${time}</div><div class="block-content"><h3 class="block-title">${esc(block.title)}</h3>${block.memo ? `<p class="block-memo">${esc(block.memo)}</p>` : ""}<div class="block-tags">${tags}${startAction}</div></div>
      <div class="block-tools"><span class="status-pill ${status.toLowerCase()}">${statusLabel(status)}</span>${status !== "DONE" ? `<span class="swipe-glyph" aria-hidden="true">⟶</span>` : `<span class="swipe-glyph" aria-hidden="true">✓</span>`}</div>
    </article>`;
  }

  function renderDay() {
    const dayBlocks = blocks().filter((block) => block.targetDate === state.selectedDate).sort(sortBlocks);
    const timed = dayBlocks.filter((block) => block.type === "TIMED"); const priority = dayBlocks.filter((block) => block.type === "PRIORITY");
    const selected = byId(state.selectedBlockId); const done = dayBlocks.filter((block) => statusOf(block) === "DONE").length; const missed = dayBlocks.filter((block) => statusOf(block) === "MISSED").length;
    const hour = new Date(state.selectedDate + "T12:00:00");
    return `<main class="page"><div class="day-toolbar"><button class="day-arrow" data-action="prev-day" aria-label="前日">‹</button><p class="eyebrow" style="margin:0">${state.selectedDate === todayKey() ? "今日の積み上げ" : "日のブロック"}</p><h1 class="day-date-label">${formatDate(state.selectedDate)}</h1><button class="day-arrow" data-action="next-day" aria-label="翌日">›</button><button class="button small" data-action="calendar">カレンダーへ</button><span class="spacer"></span><button class="button primary" data-action="add-block">＋ ブロックを追加</button></div>
      <div class="day-layout"><section class="day-main">${dayBlocks.length ? `<div class="day-columns ${timed.length === 0 || priority.length === 0 ? "single-board" : ""}">${timed.length ? renderBoard("TIMED", timed) : ""}${priority.length ? renderBoard("PRIORITY", priority) : ""}</div>` : `<section class="panel empty-day"><span class="empty-day-mark">＋</span><h2>この日はまだ空です</h2><p>予定をブロックにして、今日の積み上げを始めましょう。</p><div class="empty-day-actions"><button class="button" data-action="add-type" data-type="TIMED">時間制を追加</button><button class="button" data-action="add-type" data-type="PRIORITY">優先順位を追加</button></div></section>`}</section><aside class="day-side"><section class="panel side-card"><h2>この日のようす</h2><div class="stat-grid"><div class="stat-box"><span class="stat-label">残り</span><span class="stat-value">${dayBlocks.length - done}</span></div><div class="stat-box"><span class="stat-label">クリア</span><span class="stat-value">${done}</span></div><div class="stat-box"><span class="stat-label">未処理</span><span class="stat-value" style="${missed ? "color:var(--red)" : ""}">${missed}</span></div></div><div class="status-legend"><span class="status-pill">未着手</span><span class="status-pill done">完了</span><span class="status-pill missed">未処理</span></div></section>
        <section class="panel side-card"><h2>ブロックの操作</h2>${selected ? `<p style="font-size:12px;font-weight:700;margin:0 0 4px">${esc(selected.title)}</p><p class="tiny">${typeLabel(selected.type)} · ${statusLabel(statusOf(selected))}</p><div class="detail-actions">
          <button class="button small" data-action="edit" data-id="${selected.id}">編集</button><button class="button small" data-action="duplicate" data-id="${selected.id}">複製</button>
          ${statusOf(selected) !== "DONE" ? `${selected.type === "PRIORITY" ? selected.actualStartAt ? `<span class="tiny">開始 ${formatTime(new Date(selected.actualStartAt))}</span>` : `<button class="button small" data-action="start" data-id="${selected.id}" ${selected.targetDate > todayKey() ? "disabled" : ""}>開始</button>` : `<button class="button small" data-action="manual" data-id="${selected.id}" ${selected.targetDate > todayKey() ? "disabled" : ""}>終了時刻を入力</button>`}<button class="button primary small" data-action="clear-now" data-id="${selected.id}" ${selected.targetDate > todayKey() ? "disabled title='当日からクリアできます'" : ""}>今すぐクリア</button>` : `<button class="button small" data-action="undo" data-id="${selected.id}" ${selected.undoUsed ? "disabled title='戻せるのは1回までです'" : ""}>${selected.undoUsed ? "戻し済み" : "クリアを戻す"}</button><button class="button small" data-action="show-result" data-id="${selected.id}">結果を見る</button>`}</div>` : `<div class="detail-empty">ブロックを選ぶと操作が表示されます</div>`}</section>
      <section class="panel side-card gesture-panel"><h2>だるま落とし</h2><p class="gesture-note" style="margin:0">ブロックを右へスライドすると、飛び出す・端にぶつかる・ガラス状に割れる演出がランダムで発生。まれに金色の特別演出も。どのブロックからでもクリアできます。</p></section>
      </aside></div></main>`;
  }

  function renderBoard(type, items) {
    const isTimed = type === "TIMED";
    return `<section class="block-board"><header class="board-head"><div class="board-head-left"><span class="type-chip ${isTimed ? "" : "priority"}">${typeLabel(type)}</span><h2 class="board-title">${isTimed ? "時刻厳守の予定" : "順不同の用事"}</h2><span class="board-count">${items.length}件</span></div><span class="board-caption">${isTimed ? "開始時刻の順に積む" : "上ほど優先度が高い"}</span></header><div class="stack">${items.map(renderBlock).join("")}</div></section>`;
  }

  function durationLabel(start, end) {
    if (!start || !end) return "";
    const [startHour, startMinute] = start.split(":").map(Number); const [endHour, endMinute] = end.split(":").map(Number);
    const minutes = endHour * 60 + endMinute - startHour * 60 - startMinute;
    return minutes > 0 ? `${minutes >= 60 ? `${Math.floor(minutes / 60)}時間` : ""}${minutes % 60 ? `${minutes % 60}分` : ""}` : "";
  }

  function renderAttack() {
    const series = seriesList();
    if (!series.length) return `<main class="page"><div class="page-heading"><div><p class="eyebrow">昨日の自分と比べる</p><h1>タイムアタック</h1><p class="heading-sub">同じシリーズの記録が、少しずつ積み上がります。</p></div></div><section class="panel no-data">まだタイムアタックのブロックがありません。<br>ブロックの追加時に設定できます。<div style="margin-top:14px"><button class="button primary" data-action="add-block">＋ ブロックを作る</button></div></section></main>`;
    const active = series.find((entry) => entry.id === state.selectedSeriesId) || series[0]; state.selectedSeriesId = active.id;
    const records = active.records; const durations = records.map((block) => block.record.durationMinutes); const latest = records.at(-1);
    const best = durations.length ? (active.goal === "LONGER" ? Math.max(...durations) : Math.min(...durations)) : null;
    const latestOutcome = latest ? attackOutcome(latest) : null;
    const delta = latestOutcome?.previousDuration == null ? null : latest.record.durationMinutes - latestOutcome.previousDuration;
    const goalDelta = latest && latest.record.durationMinutes != null && best != null ? latest.record.durationMinutes - best : null;
    const chart = records.length ? records.map((block, index) => {
      const value = block.record.durationMinutes; const max = Math.max(...durations, 1); const height = Math.max(12, value / max * 125);
      return `<div class="chart-column"><span class="chart-number">${value}</span><div class="chart-bar ${index === records.length - 1 ? "latest" : ""}" style="height:${height}px"></div><span class="chart-label">${index === records.length - 1 ? "最新" : `${index + 1}回目`}</span></div>`;
    }).join("") : `<div class="no-data" style="width:100%;align-self:center">記録がありません<br><span class="tiny">このシリーズのブロックをクリアすると、ここに記録されます。</span></div>`;
    return `<main class="page"><div class="page-heading"><div><p class="eyebrow">昨日の自分と比べる</p><h1>タイムアタック</h1><p class="heading-sub">続けた分だけ、変化が見えてくる。</p></div></div><div class="records-layout"><aside class="panel series-list"><h2>タイムアタックの一覧</h2>${series.map((item) => {
      const itemBest = item.records.length ? (item.goal === "LONGER" ? Math.max(...item.records.map((b) => b.record.durationMinutes)) : Math.min(...item.records.map((b) => b.record.durationMinutes))) : null;
      return `<button class="series-option ${item.id === active.id ? "active" : ""}" data-series="${item.id}"><span class="series-name">${esc(item.title)}</span><span class="series-meta">${goalLabel(item.goal)} ／ 自己ベスト ${itemBest == null ? "—" : `${itemBest}分`}</span></button>`;
    }).join("")}<p class="tiny" style="line-height:1.65;margin:8px 2px 0">複製したブロックは同じシリーズとして記録されます。</p></aside><section class="panel records-main"><div class="records-title-row"><h2>${esc(active.title)}</h2><span class="type-chip attack">${goalLabel(active.goal)}</span><span class="spacer"></span><button class="button small" data-action="add-copy-series" data-series="${active.id}">今日に追加</button></div>
      <div class="metric-grid"><div class="metric-card"><span class="metric-label">自己ベスト</span><span class="metric-value">${best == null ? "—" : `${best}分`}</span></div><div class="metric-card"><span class="metric-label">直近の記録</span><span class="metric-value">${latest?.record.durationMinutes ?? "—"}${latest ? "分" : ""}</span></div><div class="metric-card"><span class="metric-label">直近記録の前回比</span><span class="metric-value">${delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}分`}</span></div><div class="metric-card"><span class="metric-label">記録数</span><span class="metric-value">${records.length}</span></div></div>
      <p class="chart-title">所要時間の推移　（分）</p><div class="chart">${chart}</div><div class="soft-note records-footnote">${latest ? latestOutcome?.isPersonalBest ? "最新の記録が自己ベストです。積み重ねたブロックの実績から計算しています。" : `最新の記録は${goalDelta != null ? `${Math.abs(goalDelta)}分、自己ベストに届かず` : "過去の記録と比較できません"}。` : "クリアしたブロックの記録がここに表示されます。開始時刻を記録しない場合は、所要時間の比較は行いません。"}</div></section></div></main>`;
  }

  function renderRecords() {
    const userBlocks = blocks(); const done = userBlocks.filter((block) => block.status === "DONE"); const todo = userBlocks.filter((block) => statusOf(block) === "TODO"); const missed = userBlocks.filter((block) => statusOf(block) === "MISSED");
    let filtered = userBlocks.slice();
    if (state.recordFilter !== "ALL") filtered = filtered.filter((block) => statusOf(block) === state.recordFilter);
    if (state.recordMonth !== "ALL") filtered = filtered.filter((block) => monthKey(block.targetDate) === state.recordMonth);
    filtered.sort((a, b) => b.targetDate.localeCompare(a.targetDate) || sortBlocks(a, b));
    const months = [...new Set(userBlocks.map((block) => monthKey(block.targetDate)))].sort().reverse();
    return `<main class="page"><div class="page-heading"><div><p class="eyebrow">今日までの積み上げ</p><h1>記録・累計</h1><p class="heading-sub">クリアした数も、残っている予定も。</p></div><div class="heading-actions"><button class="button" data-view="attack">タイムアタックを見る　→</button></div></div>
      <div class="summary-cards"><section class="panel summary-card emphasis"><span class="stat-label">累計クリア数</span><div class="stat-value">${done.length}</div></section><section class="panel summary-card"><span class="stat-label">完了</span><div class="stat-value">${done.length}</div></section><section class="panel summary-card"><span class="stat-label">未着手</span><div class="stat-value">${todo.length}</div></section><section class="panel summary-card"><span class="stat-label">未処理（記録に残す）</span><div class="stat-value" style="${missed.length ? "color:var(--red)" : ""}">${missed.length}</div></section></div>
      <section class="panel records-table-panel"><div class="filter-bar"><h2 style="font-size:14px;margin:0">ブロックの記録</h2><div class="filter-pills">${[["ALL", "すべて"], ["TODO", "未着手"], ["DONE", "完了"], ["MISSED", "未処理"]].map(([key, label]) => `<button class="filter-button ${state.recordFilter === key ? "active" : ""}" data-filter="${key}">${label}</button>`).join("")}</div><select class="select-compact" id="record-month"><option value="ALL" ${state.recordMonth === "ALL" ? "selected" : ""}>期間：すべて</option>${months.map((key) => `<option value="${key}" ${state.recordMonth === key ? "selected" : ""}>期間：${key.replace("-", "年")}月</option>`).join("")}</select></div>
      <div class="table-wrap"><table class="records-table"><thead><tr><th>日付</th><th>ブロック</th><th>積み方</th><th>状態</th><th>予定</th><th>実績</th><th>差</th></tr></thead><tbody>${filtered.length ? filtered.map((block) => {
        const status = statusOf(block); const plan = block.type === "TIMED" ? `${block.start}〜${block.end}` : "—";
        let actual = "—"; let diff = "—";
        if (block.status === "DONE" && block.actualEndAt) {
          const end = new Date(block.actualEndAt); actual = block.type === "TIMED" ? `${formatTime(end)}${block.manualEnd ? " 手入力" : " クリア"}` : `${block.actualStartAt ? formatTime(new Date(block.actualStartAt)) + "〜" : ""}${formatTime(end)}`;
          if (block.type === "TIMED") { const difference = Math.round((end - dateTime(block.targetDate, block.end)) / 60000); diff = `${difference > 0 ? "+" : ""}${difference}分`; }
        }
         return `<tr><td class="mono">${block.targetDate.slice(5).replace("-", "/")}</td><td class="row-title">${esc(block.title)}${attackOutcome(block)?.isPersonalBest && block.isTimeAttack ? ` <span class="mini-tag">自己ベスト</span>` : ""}</td><td><span class="type-chip ${block.type === "PRIORITY" ? "priority" : ""} ${block.isTimeAttack ? "attack" : ""}">${block.isTimeAttack ? "タイムアタック" : typeLabel(block.type)}</span></td><td><span class="status-pill ${status.toLowerCase()}">${statusLabel(status)}</span></td><td class="mono">${plan}</td><td class="mono">${actual}</td><td class="mono">${diff}</td></tr>`;
      }).join("") : `<tr><td colspan="7"><div class="no-data">条件に合うブロックがありません</div></td></tr>`}</tbody></table></div><div class="soft-note" style="margin-top:14px">表示中のデータはこのブラウザーに保存されています。時間制の差は予定終了時刻と実績終了時刻の差です。</div></section></main>`;
  }

  function renderModal() {
    const root = $("#modal-root"); if (!state.modal) { root.innerHTML = ""; return; }
    const modal = state.modal;
    if (modal.kind === "block") root.innerHTML = renderBlockModal(modal);
    else if (modal.kind === "duplicate") root.innerHTML = renderDuplicateModal(modal);
    else if (modal.kind === "manual") root.innerHTML = renderManualModal(modal);
    else if (modal.kind === "confirm-delete") root.innerHTML = renderConfirmDelete(modal);
    else if (modal.kind === "result") root.innerHTML = renderResultModal(modal);
    bindModal();
  }

  function renderBlockModal(modal) {
    const block = modal.blockId ? byId(modal.blockId) : null; const locked = block?.status === "DONE" || Boolean(block?.actualStartAt); const type = modal.type ?? block?.type ?? ""; const attack = modal.attack ?? block?.isTimeAttack ?? false;
    const series = seriesList().filter((entry) => entry.records.length > 0 || entry.id === block?.seriesId);
    const selectedSeries = modal.seriesId ?? block?.seriesId ?? "NEW";
    const selectedGoal = modal.goal ?? block?.goal ?? "";
    const title = modal.blockId ? "ブロックを編集" : "ブロックを追加";
    return `<div class="modal-backdrop" data-backdrop><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><h2 id="modal-title">${title}</h2><p>予定をひとつ、ブロックにしよう。</p></div><button class="modal-close" data-action="close-modal" aria-label="閉じる">×</button></header>
      <form id="block-form"><div class="modal-body"><input type="hidden" name="blockId" value="${esc(block?.id || "")}">
        ${locked ? `<div class="soft-note" style="margin-bottom:14px">開始済み・クリア済みのブロックでは記録がずれないよう、日付・積み方・記録の設定を変更できません。タイトルとメモは編集できます。</div>` : ""}
        <label class="field"><span class="field-label">タイトル <span style="color:var(--red)">必須</span></span><input name="title" maxlength="100" required placeholder="例：プロジェクト会議" value="${esc(modal.title ?? block?.title ?? "")}"></label>
        <label class="field"><span class="field-label">メモ <span class="tiny">任意</span></span><textarea name="memo" maxlength="500" placeholder="内容や持ち物など">${esc(modal.memo ?? block?.memo ?? "")}</textarea></label>
        <div class="field"><span class="field-label">積み方 <span style="color:var(--red)">必須</span></span><div class="segmented"><button type="button" class="segment ${type === "TIMED" ? "active" : ""}" data-type-choice="TIMED" ${locked ? "disabled" : ""}>時間制</button><button type="button" class="segment ${type === "PRIORITY" ? "active" : ""}" data-type-choice="PRIORITY" ${locked ? "disabled" : ""}>優先順位</button></div><input type="hidden" name="type" value="${type}"></div>
        <label class="field"><span class="field-label">日付</span><input name="targetDate" type="date" required ${locked ? "disabled" : ""} value="${esc(modal.targetDate ?? block?.targetDate ?? state.selectedDate)}"></label>
        <div class="time-fields" data-fields="TIMED" style="${type === "TIMED" ? "" : "display:none"}"><div class="subsection-label"><span class="type-chip">時間制の予定</span><span class="tiny">開始から終了までを予定時間にします</span></div><div class="two-fields"><label class="field" style="margin:0"><span class="field-label">開始時刻</span><input name="start" type="time" value="${esc(modal.start ?? block?.start ?? "09:00")}" ${type === "TIMED" ? "required" : ""} ${locked ? "disabled" : ""}></label><label class="field" style="margin:0"><span class="field-label">終了時刻</span><input name="end" type="time" value="${esc(modal.end ?? block?.end ?? "10:00")}" ${type === "TIMED" ? "required" : ""} ${locked ? "disabled" : ""}></label></div></div>
        <div class="priority-fields" data-fields="PRIORITY" style="${type === "PRIORITY" ? "" : "display:none"}"><div class="subsection-label"><span class="type-chip priority">優先順位の用事</span><span class="tiny">上ほど優先して取り組む</span></div><label class="field" style="margin:0"><span class="field-label">優先順位</span><select class="select-inline" name="priority" ${type === "PRIORITY" ? "required" : ""} ${locked ? "disabled" : ""}>${[[1,"高"],[2,"中"],[3,"低"]].map(([n,label]) => `<option value="${n}" ${(modal.priority ?? block?.priority ?? 1) === n ? "selected" : ""}>${label}</option>`).join("")}</select></label></div>
        <div class="attack-fields"><label class="check-row"><input name="isTimeAttack" type="checkbox" ${attack ? "checked" : ""} ${locked ? "disabled" : ""}><span>タイムアタックにする</span><span class="type-chip attack">記録を比べる</span></label><div data-attack-controls style="${attack ? "" : "display:none"}">
          ${series.length ? `<label class="field" style="margin-bottom:12px"><span class="field-label">比べる過去のブロック</span><select name="seriesId" class="select-inline" ${locked ? "disabled" : ""}><option value="NEW" ${selectedSeries === "NEW" ? "selected" : ""}>新しく記録を始める</option>${series.map((item) => `<option value="${item.id}" ${selectedSeries === item.id ? "selected" : ""}>${esc(item.title)}（${goalLabel(item.goal)}）</option>`).join("")}</select></label>` : `<p class="tiny" style="margin:0 0 10px">比較できる過去の記録がまだありません。今回はここから記録を始めます。</p>`}
          <div class="field" style="margin:0"><span class="field-label">どちらが良い記録？</span><div class="radio-row"><label class="radio-card"><input type="radio" name="goal" value="LONGER" ${selectedGoal === "LONGER" ? "checked" : ""} ${locked || selectedSeries !== "NEW" ? "disabled" : ""}>長い方が良い</label><label class="radio-card"><input type="radio" name="goal" value="SHORTER" ${selectedGoal === "SHORTER" ? "checked" : ""} ${locked || selectedSeries !== "NEW" ? "disabled" : ""}>短い方が良い</label></div></div>
        </div></div>
        ${modal.error ? `<p class="validation" role="alert">${esc(modal.error)}</p>` : ""}</div><footer class="modal-footer">${block ? `<button type="button" class="button danger small" data-action="delete" data-id="${block.id}">削除</button>` : ""}<span class="spacer"></span><button type="button" class="button" data-action="close-modal">キャンセル</button><button type="submit" class="button primary">保存する</button></footer></form></section></div>`;
  }

  function renderDuplicateModal(modal) {
    const block = byId(modal.blockId); if (!block) return "";
    return `<div class="modal-backdrop" data-backdrop><section class="modal narrow" role="dialog" aria-modal="true"><header class="modal-header"><div><h2>ブロックを複製</h2><p>「${esc(block.title)}」の設定を引き継ぎます。</p></div><button class="modal-close" data-action="close-modal">×</button></header><form id="duplicate-form"><div class="modal-body"><label class="field"><span class="field-label">複製先の日付</span><input name="targetDate" type="date" required value="${esc(modal.targetDate || todayKey())}"></label><div class="soft-note">${block.isTimeAttack ? `タイムアタックの条件「${goalLabel(block.goal)}」と記録シリーズも引き継ぎます。` : "内容をコピーし、新しい未着手ブロックとして追加します。"}</div>${modal.error ? `<p class="validation" style="margin-top:12px">${esc(modal.error)}</p>` : ""}</div><footer class="modal-footer"><span class="spacer"></span><button type="button" class="button" data-action="close-modal">キャンセル</button><button type="submit" class="button primary">複製する</button></footer></form></section></div>`;
  }

  function renderManualModal(modal) {
    const block = byId(modal.blockId); if (!block) return "";
    const defaultStart = block.type === "TIMED" ? block.start : block.actualStartAt ? formatTime(new Date(block.actualStartAt)) : "";
    return `<div class="modal-backdrop" data-backdrop><section class="modal narrow" role="dialog" aria-modal="true"><header class="modal-header"><div><h2>クリア忘れの終了時刻</h2><p>${esc(block.title)}</p></div><button class="modal-close" data-action="close-modal">×</button></header><form id="manual-form"><div class="modal-body"><label class="field"><span class="field-label">実際に終わった時刻</span><input name="endTime" type="time" required value="${esc(modal.endTime ?? timeNow())}"></label><p class="tiny">入力できるのは現在までの時刻です。${defaultStart ? `開始時刻（${defaultStart}）より後を指定してください。` : ""}</p>${modal.error ? `<p class="validation" role="alert" style="margin-top:12px">${esc(modal.error)}</p>` : ""}</div><footer class="modal-footer"><span class="spacer"></span><button type="button" class="button" data-action="close-modal">キャンセル</button><button type="submit" class="button primary">保存してクリア</button></footer></form></section></div>`;
  }

  function renderConfirmDelete(modal) {
    const block = byId(modal.blockId);
    return `<div class="modal-backdrop" data-backdrop><section class="modal narrow" role="dialog" aria-modal="true"><header class="modal-header"><h2>ブロックを削除</h2><button class="modal-close" data-action="close-modal">×</button></header><div class="modal-body"><p class="confirm-copy">「<strong>${esc(block?.title || "このブロック")}</strong>」を削除しますか？<br>このブロックのクリア記録も一覧から取り除かれます。</p></div><footer class="modal-footer"><span class="spacer"></span><button class="button" data-action="close-modal">いいえ</button><button class="button danger" data-action="confirm-delete" data-id="${esc(modal.blockId)}">削除する</button></footer></section></div>`;
  }

  function renderResultModal(modal) {
    const block = byId(modal.blockId); if (!block) return "";
    const record = block.record; const outcome = attackOutcome(block); let hero = "";
    if (record?.durationMinutes != null && block.isTimeAttack) {
      const previous = outcome?.previousDuration ?? null;
      const delta = previous == null ? null : record.durationMinutes - previous;
      hero = `<div class="result-hero green"><div class="result-kicker">${previous == null ? "最初の記録" : `前回（${previous}分）との比較`}</div><div class="result-value">${record.durationMinutes}分</div><div class="result-label">${outcome?.isPersonalBest ? "自己ベスト更新" : delta == null ? "記録しました" : `${delta > 0 ? "+" : ""}${delta}分`}</div></div>`;
    } else if (block.type === "TIMED" && block.actualEndAt) {
      const end = new Date(block.actualEndAt); const diff = Math.round((end - dateTime(block.targetDate, block.end)) / 60000);
      hero = `<div class="result-hero"><div class="result-kicker">予定終了との差</div><div class="result-value">${diff > 0 ? "+" : ""}${diff}分</div><div class="result-label">${diff === 0 ? "予定どおり" : diff < 0 ? `予定より${Math.abs(diff)}分早い` : `予定より${diff}分遅い`}</div></div>`;
    } else if (record?.durationMinutes != null) hero = `<div class="result-hero orange"><div class="result-kicker">所要時間</div><div class="result-value">${record.durationMinutes}分</div></div>`;
    else hero = `<div class="result-hero"><div class="result-kicker">クリアした時刻</div><div class="result-value">${block.actualEndAt ? formatTime(new Date(block.actualEndAt)) : "—"}</div><div class="result-label">開始時刻がないため所要時間の比較はありません</div></div>`;
    const rareReveal = block.lastEffect === "rare" ? `<div class="rare-reveal"><span class="rare-sparkle">✦</span><span><strong>レア演出！</strong><br>金色のブロックが飛び出した！</span><span class="rare-sparkle">✦</span></div>` : "";
    return `<div class="modal-backdrop" data-backdrop><section class="modal narrow" role="dialog" aria-modal="true"><header class="modal-header"><div><h2>クリア結果</h2><p>${esc(block.title)}</p></div><button class="modal-close" data-action="close-modal">×</button></header><div class="modal-body">${rareReveal}${hero}<div class="result-lines"><div class="result-line"><span>積み方</span><strong>${typeLabel(block.type)}</strong></div><div class="result-line"><span>クリア時刻</span><strong class="mono">${block.actualEndAt ? formatTime(new Date(block.actualEndAt)) : "—"}${block.manualEnd ? "（手入力）" : ""}</strong></div>${block.actualStartAt ? `<div class="result-line"><span>開始時刻</span><strong class="mono">${formatTime(new Date(block.actualStartAt))}</strong></div>` : ""}</div></div><footer class="modal-footer"><span class="spacer"></span><button class="button primary" data-action="close-modal">閉じる</button></footer></section></div>`;
  }

  function bindAuth() {
    $$('[data-auth-mode]').forEach((button) => button.addEventListener("click", () => { state.authMode = button.dataset.authMode; state.authError = ""; render(); }));
    $("#auth-form")?.addEventListener("submit", (event) => {
      event.preventDefault(); const form = new FormData(event.currentTarget); const username = String(form.get("username") || "").trim(); const password = String(form.get("password") || "");
      if (!username || !password) { state.authError = "ユーザー名とパスワードを入力してください。"; return render(); }
      if (state.authMode === "register") {
        if (username.length < 3) { state.authError = "ユーザー名は3文字以上で入力してください。"; return render(); }
        if (password.length < 8) { state.authError = "パスワードは8文字以上で入力してください。"; return render(); }
        if (state.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) { state.authError = "このユーザー名はすでに使われています。"; return render(); }
        const user = { id: id(), username, password, blocks: [] }; state.users.push(user); save(); state.authMode = "login"; state.authError = "アカウントを作成しました。ユーザー名とパスワードでログインしてください。"; render(); return;
      }
      const user = state.users.find((candidate) => candidate.username.toLowerCase() === username.toLowerCase() && candidate.password === password);
      if (!user) { state.authError = "ユーザー名かパスワードが違います。"; return render(); }
      state.user = { id: user.id, username: user.username }; localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, expiresAt: Date.now() + 8 * 60 * 60 * 1000 }));
      startSessionTimer(8 * 60 * 60 * 1000);
      state.authError = ""; state.view = "calendar"; state.selectedDate = todayKey(); render();
    });
  }

  function bindApp() {
    $$('[data-view]').forEach((button) => button.addEventListener("click", () => { state.view = button.dataset.view; if (state.view === "day") { state.selectedDate = todayKey(); state.selectedBlockId = null; } render(); }));
    $$('[data-action]').forEach((button) => button.addEventListener("click", handleAction));
    $$('[data-date]').forEach((button) => button.addEventListener("click", () => { state.selectedDate = button.dataset.date; const date = fromKey(state.selectedDate); state.month = new Date(date.getFullYear(), date.getMonth(), 1); state.selectedBlockId = null; render(); }));
    $$('[data-open-day]').forEach((button) => button.addEventListener("click", () => { state.selectedBlockId = button.dataset.openDay; state.view = "day"; state.selectedDate = byId(button.dataset.openDay)?.targetDate || state.selectedDate; render(); }));
    $$('[data-series]').forEach((button) => button.addEventListener("click", () => { state.selectedSeriesId = button.dataset.series; render(); }));
    $$('[data-filter]').forEach((button) => button.addEventListener("click", () => { state.recordFilter = button.dataset.filter; render(); }));
    $("#record-month")?.addEventListener("change", (event) => { state.recordMonth = event.target.value; render(); });
    $$('.block-card').forEach(bindBlockCard);
  }

  function handleAction(event) {
    const button = event.currentTarget; const action = button.dataset.action; const idValue = button.dataset.id;
    switch (action) {
      case "go-calendar": case "calendar": state.view = "calendar"; render(); break;
      case "today": state.selectedDate = todayKey(); state.month = new Date(new Date().getFullYear(), new Date().getMonth(), 1); render(); break;
      case "prev-month": state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); render(); break;
      case "next-month": state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); render(); break;
      case "prev-day": state.selectedDate = shiftDate(state.selectedDate, -1); state.selectedBlockId = null; render(); break;
      case "next-day": state.selectedDate = shiftDate(state.selectedDate, 1); state.selectedBlockId = null; render(); break;
      case "open-selected-day": state.view = "day"; render(); break;
      case "add-block": state.modal = { kind: "block" }; renderModal(); break;
      case "add-type": state.modal = { kind: "block", type: button.dataset.type }; renderModal(); break;
      case "edit": state.modal = { kind: "block", blockId: idValue }; renderModal(); break;
      case "delete": state.modal = { kind: "confirm-delete", blockId: idValue }; renderModal(); break;
      case "confirm-delete": deleteBlock(idValue); break;
      case "duplicate": state.modal = { kind: "duplicate", blockId: idValue }; renderModal(); break;
      case "add-copy-series": {
        const source = blocks().find((block) => block.seriesId === button.dataset.series);
        if (source) { state.modal = { kind: "duplicate", blockId: source.id, targetDate: todayKey() }; renderModal(); }
        break;
      }
      case "manual": state.modal = { kind: "manual", blockId: idValue }; renderModal(); break;
      case "clear-now": clearBlock(idValue); break;
      case "start": startBlock(idValue); break;
      case "undo": undoBlock(idValue); break;
      case "show-result": state.modal = { kind: "result", blockId: idValue }; renderModal(); break;
      case "close-modal": state.modal = null; renderModal(); break;
      case "logout": clearTimeout(sessionTimer); state.user = null; localStorage.removeItem(SESSION_KEY); state.view = "calendar"; render(); break;
      default: break;
    }
  }

  function bindBlockCard(card) {
    card.addEventListener("click", (event) => {
      if (card.dataset.skipClick === "1") { delete card.dataset.skipClick; return; }
      if (event.target.closest("button")) return;
      state.selectedBlockId = card.dataset.block; render();
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); state.selectedBlockId = card.dataset.block; render(); }
    });
    let startX = 0; let startY = 0; let deltaX = 0; let active = false; let moved = false;
    card.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button")) return;
      if (statusOf(byId(card.dataset.block) || {}) === "DONE" || event.button !== 0) return;
      startX = event.clientX; startY = event.clientY; deltaX = 0; active = true; moved = false;
      card.setPointerCapture?.(event.pointerId);
    });
    card.addEventListener("pointermove", (event) => {
      if (!active) return;
      const x = event.clientX - startX; const y = event.clientY - startY;
      if (Math.abs(y) > Math.abs(x) && Math.abs(y) > 8) { active = false; return; }
      if (Math.abs(x) > 5) { moved = true; card.classList.add("dragging"); card.style.transform = `translateX(${Math.max(-30, Math.min(x, 145))}px) rotate(${x > 0 ? Math.min(4, x / 45) : 0}deg)`; }
      deltaX = x;
    });
    card.addEventListener("pointerup", () => {
      if (!active && !moved) return;
      active = false; card.classList.remove("dragging");
      if (deltaX > 105) {
        card.dataset.skipClick = "1";
        clearBlock(card.dataset.block);
      } else if (moved) { card.dataset.skipClick = "1"; card.style.transform = ""; }
    });
    card.addEventListener("pointercancel", () => { active = false; card.classList.remove("dragging"); card.style.transform = ""; });
  }

  function bindModal() {
    $$('[data-action]', $("#modal-root")).forEach((button) => button.addEventListener("click", handleAction));
    $("[data-backdrop]")?.addEventListener("click", (event) => { if (event.target === event.currentTarget) { state.modal = null; renderModal(); } });
    $$('[data-type-choice]').forEach((button) => button.addEventListener("click", () => {
      const form = $("#block-form"); if (!form) return;
      const modal = state.modal; modal.type = button.dataset.typeChoice; modal.title = form.elements.title.value; modal.memo = form.elements.memo.value;
      modal.targetDate = form.elements.targetDate.value; modal.start = form.elements.start?.value || ""; modal.end = form.elements.end?.value || ""; modal.priority = Number(form.elements.priority?.value || 1);
      modal.attack = form.elements.isTimeAttack.checked; modal.seriesId = form.elements.seriesId?.value || "NEW"; modal.goal = form.elements.goal?.value || ""; renderModal();
    }));
    $("#block-form")?.addEventListener("change", (event) => {
      const form = event.currentTarget;
      if (event.target.name === "isTimeAttack") { state.modal.attack = event.target.checked; rememberForm(form); renderModal(); }
      if (event.target.name === "seriesId") {
        state.modal.seriesId = event.target.value; rememberForm(form); const picked = seriesList().find((item) => item.id === event.target.value);
         state.modal.goal = picked?.goal || ""; renderModal();
      }
    });
    $("#block-form")?.addEventListener("submit", submitBlockForm);
    $("#duplicate-form")?.addEventListener("submit", submitDuplicateForm);
    $("#manual-form")?.addEventListener("submit", submitManualForm);
    const firstInput = $(".modal input:not([type=hidden]), .modal select"); firstInput?.focus({ preventScroll: true });
  }

  function rememberForm(form) {
    const data = new FormData(form); const modal = state.modal;
    modal.blockId = String(data.get("blockId") || "") || undefined;
    modal.type = String(data.get("type") || ""); modal.title = String(data.get("title") || ""); modal.memo = String(data.get("memo") || "");
    modal.targetDate = String(data.get("targetDate") || byId(modal.blockId)?.targetDate || state.selectedDate); modal.start = String(data.get("start") || ""); modal.end = String(data.get("end") || "");
    modal.priority = Number(data.get("priority") || 1); modal.attack = form.elements.isTimeAttack.checked; modal.seriesId = String(data.get("seriesId") || "NEW"); modal.goal = String(data.get("goal") || "");
  }

  function submitBlockForm(event) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const modal = state.modal;
    const blockId = String(data.get("blockId") || ""); const existing = blockId ? byId(blockId) : null;
    const title = String(data.get("title") || "").trim(); const locked = existing?.status === "DONE" || Boolean(existing?.actualStartAt);
    const type = locked ? existing.type : String(data.get("type") || ""); const targetDate = locked ? existing.targetDate : String(data.get("targetDate") || "");
    const start = locked ? existing.start : String(data.get("start") || ""); const end = locked ? existing.end : String(data.get("end") || "");
    const priority = locked ? existing.priority : Number(data.get("priority") || 0);
    const isTimeAttack = locked ? existing.isTimeAttack : form.elements.isTimeAttack.checked; const selectedSeries = locked ? existing.seriesId : String(data.get("seriesId") || "NEW");
    const selectedGoal = locked ? existing.goal : String(data.get("goal") || ""); let error = "";
    if (!title) error = "タイトルを入力してください。";
    else if (title.length > 100) error = "タイトルは100文字以内で入力してください。";
    else if (!targetDate) error = "日付を選んでください。";
    else if (!["TIMED", "PRIORITY"].includes(type)) error = "時間制か優先順位を選んでください。";
    else if (type === "TIMED" && (!start || !end)) error = "開始時刻と終了時刻を入力してください。";
    else if (type === "TIMED" && end <= start) error = "終了時刻は開始時刻より後にしてください。";
    else if (type === "PRIORITY" && !priority) error = "優先順位を選んでください。";
    else if (isTimeAttack && selectedSeries !== "NEW" && !seriesList().some((item) => item.id === selectedSeries)) error = "比較する記録が見つかりません。";
    else if (isTimeAttack && selectedSeries === "NEW" && !["LONGER", "SHORTER"].includes(selectedGoal)) error = "記録の良い条件を選んでください。";
    if (error) { rememberForm(form); modal.error = error; return renderModal(); }

    let seriesId = null; let goal = null;
    if (isTimeAttack) {
      seriesId = selectedSeries !== "NEW" ? selectedSeries : existing?.seriesId || id();
      goal = selectedSeries !== "NEW" ? seriesList().find((item) => item.id === selectedSeries)?.goal : selectedGoal;
    }
    const next = {
      id: existing?.id || id(), seriesId, title, memo: String(data.get("memo") || "").trim(), type, targetDate,
       start: type === "TIMED" ? start : null, end: type === "TIMED" ? end : null,
       priority: type === "PRIORITY" ? priority : null, status: existing?.status === "DONE" ? "DONE" : "TODO",
      isTimeAttack, goal, actualStartAt: existing?.actualStartAt || null, actualEndAt: existing?.actualEndAt || null,
      manualEnd: existing?.manualEnd || false, undoUsed: existing?.undoUsed || false, record: existing?.record || null,
      createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const user = getUser(); if (existing) user.blocks[user.blocks.findIndex((item) => item.id === existing.id)] = next; else user.blocks.push(next);
    state.selectedDate = targetDate; state.selectedBlockId = next.id; state.view = "day"; state.modal = null; save(); render(); toast(existing ? "ブロックを更新しました。" : "ブロックを追加しました。");
  }

  function submitDuplicateForm(event) {
    event.preventDefault(); const form = event.currentTarget; const source = byId(state.modal.blockId); const date = String(new FormData(form).get("targetDate") || "");
    if (!source || !date) { state.modal.error = "複製先の日付を選んでください。"; return renderModal(); }
    const copy = { ...structuredClone(source), id: id(), targetDate: date, status: "TODO", actualStartAt: null, actualEndAt: null, manualEnd: false, undoUsed: false, record: null, lastEffect: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    getUser().blocks.push(copy); state.selectedDate = date; state.selectedBlockId = copy.id; state.view = "day"; state.modal = null; save(); render(); toast("同じ設定のブロックを複製しました。");
  }

  function submitManualForm(event) {
    event.preventDefault(); const form = event.currentTarget; const endTime = String(new FormData(form).get("endTime") || ""); const block = byId(state.modal.blockId);
    const startTime = block?.type === "TIMED" ? block.start : block?.actualStartAt ? formatTime(new Date(block.actualStartAt)) : null;
    let error = "";
    if (!endTime) error = "終了時刻を入力してください。";
    else if (startTime && endTime <= startTime) error = "終了時刻は開始時刻より後にしてください。";
    else if (dateTime(block.targetDate, endTime).getTime() > Date.now()) error = "未来の時刻は入力できません。";
    if (error) { state.modal.endTime = endTime; state.modal.error = error; return renderModal(); }
    complete(block, dateTime(block.targetDate, endTime), true); state.modal = null; render(); toast("終了時刻を記録しました。");
  }

  function clearBlock(blockId) {
    const block = byId(blockId); if (!block || statusOf(block) === "DONE" || clearing.has(blockId)) return;
    if (block.targetDate > todayKey()) { toast("未来の日のブロックは、当日になってからクリアできます。", true); return; }
    clearing.add(blockId);
    const card = $(`.block-card[data-block="${CSS.escape(blockId)}"]`);
    const effect = chooseClearEffect();
    if (!card) { clearing.delete(blockId); finishClear(block, effect); return; }
    playClearEffect(card, effect).then(() => {
      clearing.delete(blockId);
      const current = byId(blockId);
      if (current && current.status !== "DONE") finishClear(current, effect);
    });
  }

  function chooseClearEffect() {
    const roll = Math.random();
    if (roll < 0.025) return { id: "rare", className: "effect-rare", duration: 1450 };
    if (roll < 0.15) return { id: "shatter", className: "effect-shatter", duration: 1050 };
    if (roll < 0.43) return { id: "impact", className: "effect-impact", duration: 1120 };
    return { id: "launch", className: "effect-launch", duration: 900 };
  }

  function playClearEffect(card, effect) {
    return new Promise((resolve) => {
      const bounds = card.getBoundingClientRect();
      const distance = Math.max(240, Math.ceil(window.innerWidth - bounds.left + bounds.width + 70));
      card.style.setProperty("--travel-x", `${distance}px`);
      if (effect.id === "impact") {
        card.style.setProperty("--impact-x", `${Math.max(28, Math.round(window.innerWidth - bounds.right - 5))}px`);
        card.append(makeImpactFlash());
        makeParticles(card, 13);
      }
      if (effect.id === "shatter") makeShards(card);
      if (effect.id === "rare") makeParticles(card, 22, true);
      if (effect.id === "launch") makeParticles(card, 8);
      card.classList.add(effect.className);
      let finished = false;
      const done = (event) => {
        if (event && (event.target !== card || event.animationName !== effect.className.replace("effect-", "block-"))) return;
        if (finished) return; finished = true; clearTimeout(failsafe); resolve();
      };
      const failsafe = window.setTimeout(() => done(), effect.duration + 250);
      card.addEventListener("animationend", done);
    });
  }

  function makeImpactFlash() {
    const flash = document.createElement("span"); flash.className = "impact-flash"; flash.setAttribute("aria-hidden", "true"); return flash;
  }

  function makeShards(card) {
    const layer = document.createElement("span"); layer.className = "shard-layer"; layer.setAttribute("aria-hidden", "true");
    const pieces = 12; const seed = Math.random() * 18;
    const boundary = (angle) => {
      const radians = angle * Math.PI / 180; const dx = Math.cos(radians); const dy = Math.sin(radians);
      const factor = Math.min(50 / Math.max(Math.abs(dx), .001), 50 / Math.max(Math.abs(dy), .001));
      return [50 + dx * factor, 50 + dy * factor];
    };
    for (let index = 0; index < pieces; index += 1) {
      const first = boundary(index * 360 / pieces - 180 + seed); const second = boundary((index + 1) * 360 / pieces - 180 + seed);
      const midAngle = (index + .5) * 360 / pieces - 180 + seed; const radians = midAngle * Math.PI / 180;
      const midRadius = 45 + Math.random() * 8; const middle = [50 + Math.cos(radians) * midRadius, 50 + Math.sin(radians) * midRadius];
      const shard = document.createElement("i"); shard.className = "shard";
      shard.style.clipPath = `polygon(50% 50%, ${first[0]}% ${first[1]}%, ${middle[0]}% ${middle[1]}%, ${second[0]}% ${second[1]}%)`;
      shard.style.setProperty("--shard-x", `${Math.cos(radians) * (95 + Math.random() * 175)}px`);
      shard.style.setProperty("--shard-y", `${Math.sin(radians) * (75 + Math.random() * 145) - 24}px`);
      shard.style.setProperty("--shard-turn", `${Math.round((Math.random() - .5) * 85)}deg`);
      shard.style.setProperty("--shard-delay", `${Math.random() * 110}ms`);
      layer.append(shard);
    }
    const cracks = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    cracks.setAttribute("viewBox", "0 0 100 100"); cracks.setAttribute("preserveAspectRatio", "none"); cracks.classList.add("crack-lines");
    for (let index = 0; index < pieces; index += 1) {
      const point = boundary(index * 360 / pieces - 180 + seed);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      line.setAttribute("points", `50,50 ${50 + (point[0] - 50) * .35 + (Math.random() - .5) * 10},${50 + (point[1] - 50) * .35 + (Math.random() - .5) * 10} ${point[0]},${point[1]}`);
      line.setAttribute("class", "crack-line"); cracks.append(line);
    }
    layer.append(cracks); card.append(layer);
  }

  function makeParticles(card, count, gold = false) {
    const layer = document.createElement("span"); layer.className = `particle-layer ${gold ? "gold-particles" : ""}`; layer.setAttribute("aria-hidden", "true");
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2; const distance = 42 + Math.random() * 145;
      const particle = document.createElement("i"); particle.className = "clear-particle";
      particle.style.setProperty("--particle-x", `${Math.cos(angle) * distance}px`);
      particle.style.setProperty("--particle-y", `${Math.sin(angle) * distance}px`);
      particle.style.setProperty("--particle-delay", `${Math.random() * 170}ms`);
      particle.style.setProperty("--particle-size", `${4 + Math.random() * 7}px`);
      particle.style.setProperty("--particle-turn", `${Math.round(Math.random() * 360)}deg`);
      layer.append(particle);
    }
    card.append(layer);
  }

  function finishClear(block, effect) {
    let start = null;
    if (block.type === "TIMED") {
      const plannedStart = dateTime(block.targetDate, block.start);
      if (new Date() >= plannedStart) start = plannedStart;
    }
    else if (block.actualStartAt) start = new Date(block.actualStartAt);
    block.lastEffect = effect.id;
    complete(block, new Date(), false, start);
  }

  function complete(block, endDate, manual, actualStart = undefined) {
    if (!block) return;
    const start = actualStart === undefined ? (block.type === "TIMED" ? dateTime(block.targetDate, block.start) : block.actualStartAt ? new Date(block.actualStartAt) : null) : actualStart;
    const duration = start && endDate >= start ? Math.max(0, Math.round((endDate - start) / 60000)) : null;
    block.status = "DONE"; block.actualStartAt = start?.toISOString() || null; block.actualEndAt = endDate.toISOString(); block.manualEnd = manual; block.updatedAt = new Date().toISOString();
    block.record = { durationMinutes: duration, manual };
    if (manual) block.lastEffect = null;
    state.selectedBlockId = block.id; state.view = "day"; state.selectedDate = block.targetDate; state.modal = null; save(); render(); state.modal = { kind: "result", blockId: block.id }; renderModal();
  }

  function startBlock(blockId) {
    const block = byId(blockId);
    if (!block || block.type !== "PRIORITY" || statusOf(block) === "DONE" || block.actualStartAt) return;
    if (block.targetDate > todayKey()) { toast("未来の日のブロックは、当日になってから開始できます。", true); return; }
    block.actualStartAt = new Date().toISOString(); block.updatedAt = new Date().toISOString();
    save(); render(); toast("開始時刻を記録しました。");
  }

  function undoBlock(blockId) {
    const block = byId(blockId); if (!block || block.status !== "DONE") return;
    if (block.undoUsed) { toast("このブロックはすでに一度戻しています。", true); return; }
    block.status = "TODO"; block.actualStartAt = null; block.actualEndAt = null; block.manualEnd = false; block.record = null; block.lastEffect = null; block.undoUsed = true; block.updatedAt = new Date().toISOString();
    state.modal = null; save(); render(); toast("クリアを戻しました。記録も取り消されています。");
  }

  function deleteBlock(blockId) {
    const user = getUser(); const block = byId(blockId); if (!block) return;
    user.blocks = user.blocks.filter((item) => item.id !== blockId);
    state.selectedBlockId = null; state.modal = null; save(); render(); toast("ブロックを削除しました。");
  }

  function startSessionTimer(duration) {
    clearTimeout(sessionTimer);
    sessionTimer = window.setTimeout(() => {
      state.user = null; state.modal = null; localStorage.removeItem(SESSION_KEY); render();
      toast("ログインの有効期限が切れました。もう一度ログインしてください。", true);
    }, Math.max(0, duration));
  }

  // Login in the prototype lasts for one browser session, capped at eight hours.
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (session && session.expiresAt > Date.now()) {
      const user = state.users.find((candidate) => candidate.id === session.id);
      if (user) { state.user = { id: user.id, username: user.username }; startSessionTimer(session.expiresAt - Date.now()); }
      else localStorage.removeItem(SESSION_KEY);
    } else if (session) localStorage.removeItem(SESSION_KEY);
  } catch { localStorage.removeItem(SESSION_KEY); }
  window.setInterval(() => { if (state.user) render(); }, 60 * 1000);
  render();
})();
