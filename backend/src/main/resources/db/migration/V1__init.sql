-- initial schema for DeloSdelano

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(60)  NOT NULL,
    avatar TEXT,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('perfectionist','avoider','rebel','anxious')),
    trigger TEXT NOT NULL,
    impact SMALLINT NOT NULL CHECK (impact BETWEEN 1 AND 10),
    taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_user ON quiz_results(user_id, taken_at DESC);

CREATE TABLE plans (
    id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id  VARCHAR(20) NOT NULL CHECK (template_id IN ('full','mini','fear','ritual')),
    completed_chapters SMALLINT[]  NOT NULL DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    letter TEXT
);
CREATE UNIQUE INDEX one_active_plan ON plans(user_id, template_id) WHERE finished_at IS NULL;
CREATE INDEX idx_plans_user ON plans(user_id);

CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    done TEXT NOT NULL DEFAULT '',
    postponed TEXT NOT NULL DEFAULT '',
    distractions TEXT[] NOT NULL DEFAULT '{}',
    UNIQUE (user_id, date)
);

CREATE TABLE focus_sessions (
    id  UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task TEXT NOT NULL DEFAULT '',
    steps TEXT[] NOT NULL DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX idx_sessions_user ON focus_sessions(user_id, started_at DESC);

CREATE TABLE session_pauses (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES focus_sessions(id) ON DELETE CASCADE,
    paused_at TIMESTAMPTZ NOT NULL,
    reason VARCHAR(40) NOT NULL
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    read BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_notif_user ON notifications(user_id, created_at DESC);

CREATE TABLE ai_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_user_time ON ai_requests(user_id, created_at);