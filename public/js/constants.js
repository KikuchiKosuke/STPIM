// STPIM 共通の定数（クラス図の列挙型に対応）
window.STPIM = window.STPIM || {};

STPIM.BlockType = Object.freeze({ TIME: 'TIME', PRIORITY: 'PRIORITY' });
STPIM.BlockStatus = Object.freeze({ TODO: 'TODO', DONE: 'DONE', MISSED: 'MISSED' });
STPIM.Priority = Object.freeze({ HIGH: 1, MID: 2, LOW: 3 });
STPIM.PriorityLabel = Object.freeze({ 1: '高', 2: '中', 3: '低' });
STPIM.BetterDirection = Object.freeze({ LONGER: 'LONGER', SHORTER: 'SHORTER' });

// ブロックを横にドラッグして、この距離（px）を超えて離すとクリアになる
STPIM.CLEAR_DRAG_THRESHOLD = 120;
// タイトルの最大文字数
STPIM.TITLE_MAX_LENGTH = 100;
