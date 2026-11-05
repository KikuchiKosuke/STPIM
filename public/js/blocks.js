// STPIM ブロックの処理（画面に依存しない部分）。クラス図の Block / BlockService / ClearService に対応。
window.STPIM = window.STPIM || {};

(function (S) {
  'use strict';
  const { BlockType, BlockStatus, Priority } = S;

  let nextId = 1;

  // 'YYYY-MM-DD' と 'HH:MM' から、日本時間（端末の時刻）の Date を作る
  function toDate(dateStr, timeStr) {
    return new Date(dateStr + 'T' + timeStr + ':00');
  }

  // 入力を検査する。エラーの文章の配列を返す（空ならOK）
  function validate(input) {
    const errors = [];
    const title = (input.title || '').trim();
    if (title === '') errors.push('タイトルを入力してください');
    if (title.length > S.TITLE_MAX_LENGTH) errors.push('タイトルは' + S.TITLE_MAX_LENGTH + '文字以内で入力してください');
    if (input.blockType !== BlockType.TIME && input.blockType !== BlockType.PRIORITY) {
      errors.push('時間制か優先順位のどちらかを選んでください');
    }
    if (input.blockType === BlockType.TIME) {
      if (!input.plannedStartTime || !input.plannedEndTime) {
        errors.push('開始時刻と終了時刻を入力してください');
      } else if (input.plannedEndTime <= input.plannedStartTime) {
        // 終了＝開始も不可にしている（要確認）
        errors.push('終了時刻は開始時刻より後にしてください');
      }
    }
    if (input.blockType === BlockType.PRIORITY) {
      if (![Priority.HIGH, Priority.MID, Priority.LOW].includes(input.priority)) {
        errors.push('優先順位（高・中・低）を選んでください');
      }
    }
    if (input.isTimeAttack && !input.betterDirection) {
      errors.push('タイムアタックは「長い方が良い」か「短い方が良い」を選んでください');
    }
    return errors;
  }

  // ブロックを作る。検査に通らなければ { errors } を返す
  function createBlock(input) {
    const errors = validate(input);
    if (errors.length > 0) return { errors };
    const isTime = input.blockType === BlockType.TIME;
    const block = {
      id: nextId++,
      targetDate: input.targetDate,
      title: input.title.trim(),
      memo: input.memo || '',
      blockType: input.blockType,
      status: BlockStatus.TODO,
      plannedStartTime: isTime ? input.plannedStartTime : null,
      plannedEndTime: isTime ? input.plannedEndTime : null,
      priority: isTime ? null : input.priority,
      actualStartAt: null,
      actualEndAt: null,
      isManualEnd: false,
      undoCount: 0,
      isTimeAttack: !!input.isTimeAttack,
      betterDirection: input.isTimeAttack ? input.betterDirection : null,
      seriesId: null, // 過去のタイムアタックのブロックを選んだときに、その系列IDを引き継ぐ（未実装）
    };
    return { block };
  }

  // 優先順位のブロックの「開始」ボタン。押せたら true
  function start(block, now) {
    if (block.blockType !== BlockType.PRIORITY) return false;
    if (block.status !== BlockStatus.TODO) return false;
    if (block.actualStartAt) return false; // 二重押下は無視
    block.actualStartAt = now;
    return true;
  }

  // 分（秒は切り捨て）
  function minutesBetween(from, to) {
    return Math.trunc((to - from) / 60000);
  }

  // クリアする。結果（差・所要時間）を返す
  function clear(block, now) {
    if (block.status === BlockStatus.DONE) return null;
    block.status = BlockStatus.DONE;
    block.actualEndAt = now;
    if (block.blockType === BlockType.TIME && !block.actualStartAt) {
      // 時間制は、予定の開始時刻をそのまま開始時刻とする
      block.actualStartAt = toDate(block.targetDate, block.plannedStartTime);
    }
    const result = { diffFromPlanMinutes: null, durationMinutes: null };
    if (block.blockType === BlockType.TIME) {
      // 予定終了との差。遅れが＋、早いが－
      result.diffFromPlanMinutes = minutesBetween(toDate(block.targetDate, block.plannedEndTime), now);
    }
    if (block.actualStartAt) {
      result.durationMinutes = minutesBetween(block.actualStartAt, now);
    }
    return result;
  }

  // クリアを戻す（1回だけ）。戻せたら true、だめなら理由の文字列
  function undo(block) {
    if (block.status !== BlockStatus.DONE) return '完了していないブロックは戻せません';
    if (block.undoCount >= 1) return '戻せるのは1回だけです';
    block.status = BlockStatus.TODO;
    block.actualEndAt = null;
    block.isManualEnd = false;
    block.undoCount += 1;
    if (block.blockType === BlockType.TIME) block.actualStartAt = null; // 時間制の開始は、クリア時に決まる値
    return true;
  }

  // 時間制で、予定の終了を過ぎても未着手のもの
  function isOverdue(block, now) {
    return block.blockType === BlockType.TIME
      && block.status === BlockStatus.TODO
      && toDate(block.targetDate, block.plannedEndTime) < now;
  }

  // 日画面を開くたびに呼ぶ。更新した数を返す
  function markOverdueAsMissed(blocks, now) {
    let count = 0;
    blocks.forEach(function (b) {
      if (isOverdue(b, now)) { b.status = BlockStatus.MISSED; count += 1; }
    });
    return count;
  }

  // タブごとの並び（時間制は時刻順、優先順位は高→中→低、同じ順位は作成順）
  function sortForTab(blocks, blockType) {
    return blocks.filter(function (b) { return b.blockType === blockType; }).sort(function (a, b) {
      if (blockType === BlockType.TIME) {
        return a.plannedStartTime.localeCompare(b.plannedStartTime) || a.id - b.id;
      }
      return a.priority - b.priority || a.id - b.id;
    });
  }

  S.Blocks = { validate, createBlock, start, clear, undo, isOverdue, markOverdueAsMissed, sortForTab, toDate };
})(window.STPIM);
