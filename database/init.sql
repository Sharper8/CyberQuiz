-- Database initialization script for on-prem PostgreSQL
-- This will be executed when the database container is first created

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer BOOLEAN NOT NULL,
  category VARCHAR(100) NOT NULL,
  ai_generated BOOLEAN DEFAULT FALSE,
  validated BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pseudo VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  mode VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_questions_validated ON questions(validated);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);

-- Insert sample questions
INSERT INTO questions (question, answer, category, ai_generated, validated) VALUES
  ('Un email d''une banque demandant de vérifier vos informations personnelles est toujours légitime', FALSE, 'Phishing', FALSE, TRUE),
  ('Il est sûr d''utiliser le même mot de passe pour plusieurs comptes en ligne', FALSE, 'Mots de passe', FALSE, TRUE),
  ('Le protocole HTTPS garantit que le site web est sécurisé et fiable', TRUE, 'Réseaux', FALSE, TRUE),
  ('Les mises à jour de sécurité doivent être installées dès qu''elles sont disponibles', TRUE, 'Sécurité', FALSE, TRUE),
  ('Partager des informations personnelles sur les réseaux sociaux n''a aucun risque', FALSE, 'RGPD', FALSE, TRUE)
ON CONFLICT DO NOTHING;

-- Create web_anon role for PostgREST (optional, for future API)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'web_anon') THEN
    CREATE ROLE web_anon NOLOGIN;
  END IF;
END
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO web_anon;
GRANT SELECT ON questions, scores TO web_anon;
GRANT INSERT ON scores TO web_anon;
