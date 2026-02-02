#!/bin/sh
set -e

# Normalize model names in the database by removing possible 'ollama:' prefixes
# Expects environment variables: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
# Or will try to execute against local docker postgres container named 'cyberquiz-postgres-prod'

SQL="UPDATE \"GenerationSettings\" SET \"defaultModel\" = regexp_replace(\"defaultModel\", '^ollama:', '' ) WHERE \"defaultModel\" LIKE 'ollama:%';\nUPDATE \"GenerationSettings\" SET \"fallbackModel\" = regexp_replace(\"fallbackModel\", '^ollama:', '' ) WHERE \"fallbackModel\" LIKE 'ollama:%';"

if [ -n "$PGHOST" ]; then
  echo "Running SQL against PGHOST=$PGHOST"
  psql "postgresql://${PGUSER:-cyberquiz}:${PGPASSWORD:-changeme}@${PGHOST}:${PGPORT:-5432}/${PGDATABASE:-cyberquiz}" -c "$SQL"
else
  echo "No PGHOST provided, attempting to run inside docker postgres container 'cyberquiz-postgres-prod'"
  docker exec -i cyberquiz-postgres-prod psql -U cyberquiz -d cyberquiz -c "$SQL"
fi

echo "Normalization complete."
