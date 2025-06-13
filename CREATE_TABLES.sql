/* ────────────────────────────
   HN-CLONE DATABASE SCHEMA
   (no FK on comments.story_id)
   ──────────────────────────── */

/* ─────────── STORIES ─────────── */

CREATE TABLE IF NOT EXISTS stories (
    id             BIGINT PRIMARY KEY,
    by             TEXT,
    kids           JSONB,
    score          INT,
    time           BIGINT,
    title          TEXT,
    url            TEXT,
    text           TEXT,
    active         INTEGER DEFAULT -1,
    last_activated BIGINT
);

CREATE INDEX IF NOT EXISTS idx_stories_active
    ON stories(active);


/* ─────────── COMMENTS ─────────── */

CREATE TABLE IF NOT EXISTS comments (
    id         BIGINT PRIMARY KEY,
    by         TEXT,
    kids       JSONB,
    parent     BIGINT,
    story_id   BIGINT,      -- now just a plain column
    text       TEXT,
    time       BIGINT,
    active     BOOLEAN DEFAULT FALSE,
    is_bot     BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_comments_story
    ON comments(story_id);


/* ─────────── BOTS ─────────── */

CREATE TABLE IF NOT EXISTS bots (
    username           TEXT PRIMARY KEY,
    llm                TEXT,
    created            BIGINT,
    active             BOOLEAN DEFAULT FALSE,
    when_method_name   TEXT,      -- add DEFAULT 'test' if you want automatic population
    what_method_name   TEXT,      -- add DEFAULT 'test' if you want automatic population
    context            TEXT
);

/* ─────────── GUESSES ─────────── */

CREATE TABLE IF NOT EXISTS guesses (
    id          BIGSERIAL PRIMARY KEY,
    comment_id  BIGINT REFERENCES comments(id) ON DELETE SET NULL,
    is_fake     BOOLEAN,
    timestamp   BIGINT
);

CREATE INDEX IF NOT EXISTS idx_guesses_comment
    ON guesses(comment_id);
