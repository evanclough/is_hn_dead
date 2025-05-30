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
    active         BOOLEAN      DEFAULT FALSE,
    last_activated BIGINT
);

-- keep this one
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
    deleted  BOOLEAN DEFAULT FALSE,
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
    created     BIGINT
);


/* ─────────── GUESSES ─────────── */

CREATE TABLE IF NOT EXISTS guesses (
    id          BIGSERIAL PRIMARY KEY,
    comment_id  BIGINT
        REFERENCES comments(id) ON DELETE SET NULL,
    is_real     BOOLEAN,
    timestamp   BIGINT
);

-- keep this one
CREATE INDEX IF NOT EXISTS idx_guesses_comment
    ON guesses(comment_id);
