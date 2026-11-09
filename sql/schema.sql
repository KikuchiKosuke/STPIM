-- STPIM のテーブル（PostgreSQL）。テーブル設計をもとにした最初の版
-- 使い方: psql -U postgres -d stpim -f sql/schema.sql

CREATE TABLE users (
    id            SERIAL       PRIMARY KEY,
    login_id      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blocks (
    id                 SERIAL       PRIMARY KEY,
    user_id            INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_date        DATE         NOT NULL,
    title              VARCHAR(100) NOT NULL,
    memo               TEXT,
    block_type         VARCHAR(10)  NOT NULL CHECK (block_type IN ('TIME', 'PRIORITY')),
    status             VARCHAR(10)  NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'DONE', 'MISSED')),
    planned_start_time TIME,
    planned_end_time   TIME,
    priority           SMALLINT     CHECK (priority BETWEEN 1 AND 3),   -- 1=高 2=中 3=低
    actual_start_at    TIMESTAMP,
    actual_end_at      TIMESTAMP,
    is_manual_end      BOOLEAN      NOT NULL DEFAULT FALSE,
    undo_count         SMALLINT     NOT NULL DEFAULT 0 CHECK (undo_count >= 0),
    is_time_attack     BOOLEAN      NOT NULL DEFAULT FALSE,
    better_direction   VARCHAR(10)  CHECK (better_direction IN ('LONGER', 'SHORTER')),
    series_id          INTEGER,
    created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- 種類に合う列だけが入っている（時間制は時刻、優先順位は優先順位）
    CONSTRAINT ck_blocks_type_fields CHECK (
        (block_type = 'TIME'
            AND planned_start_time IS NOT NULL
            AND planned_end_time IS NOT NULL
            AND planned_end_time > planned_start_time
            AND priority IS NULL)
        OR
        (block_type = 'PRIORITY'
            AND priority IS NOT NULL
            AND planned_start_time IS NULL
            AND planned_end_time IS NULL)
    ),
    -- 未処理になるのは時間制だけ
    CONSTRAINT ck_blocks_missed_timed_only CHECK (status <> 'MISSED' OR block_type = 'TIME'),
    -- タイムアタックのときだけ、長短を持つ
    CONSTRAINT ck_blocks_time_attack CHECK (is_time_attack = (better_direction IS NOT NULL)),
    -- 終了時刻は、完了のときだけ入る
    CONSTRAINT ck_blocks_done_end CHECK ((status = 'DONE') = (actual_end_at IS NOT NULL)),
    -- 終了は開始より前にならない
    CONSTRAINT ck_blocks_actual_order CHECK (actual_start_at IS NULL OR actual_end_at IS NULL OR actual_end_at >= actual_start_at)
);

CREATE INDEX ix_blocks_user_date ON blocks (user_id, target_date);
CREATE INDEX ix_blocks_series ON blocks (series_id);

-- タイムアタックの結果。前回・自己ベストは保存せず、同じ series_id の結果から計算する
CREATE TABLE time_attack_results (
    id               SERIAL  PRIMARY KEY,
    block_id         INTEGER NOT NULL UNIQUE REFERENCES blocks(id) ON DELETE CASCADE,
    series_id        INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0)
);

CREATE INDEX ix_tar_series ON time_attack_results (series_id);
