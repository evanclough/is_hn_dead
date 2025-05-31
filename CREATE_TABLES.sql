/* ─────────── STORIES ─────────── */

CREATE TABLE IF NOT EXISTS stories (
    id             BIGINT PRIMARY KEY,
    by             TEXT,
    kids           JSONB,       -- JSON array of comment IDs
    descendants    INT,
    score          INT,
    time           BIGINT,      -- UNIX epoch seconds
    title          TEXT,
    url            TEXT,
    text           TEXT,
    summary        TEXT,
    active         INTEGER      DEFAULT -1,  -- -1 = inactive, 1..n = front-page rank
    last_activated BIGINT
);

CREATE INDEX IF NOT EXISTS idx_stories_active
    ON stories(active);


/* ─────────── COMMENTS ─────────── */

CREATE TABLE IF NOT EXISTS comments (
    id       BIGINT PRIMARY KEY,
    by       TEXT,
    kids     JSONB,
    parent   BIGINT,
    text     TEXT,
    time     BIGINT,
    active   BOOLEAN DEFAULT FALSE,
    is_bot   BOOLEAN DEFAULT FALSE
);

/*  (no index on comments.parent for now) */


/* ─────────── BOTS ─────────── */

CREATE TABLE IF NOT EXISTS bots (
    username    TEXT PRIMARY KEY,
    llm         TEXT,
    method      TEXT,
    personality JSONB,
    created     BIGINT,
    active      BOOLEAN DEFAULT FALSE
);


/* ─────────── GUESSES ─────────── */

CREATE TABLE IF NOT EXISTS guesses (
    id          BIGSERIAL PRIMARY KEY,
    comment_id  BIGINT
        REFERENCES comments(id) ON DELETE SET NULL,
    is_fake     BOOLEAN,
    timestamp   BIGINT
);

CREATE INDEX IF NOT EXISTS idx_guesses_comment
    ON guesses(comment_id);
