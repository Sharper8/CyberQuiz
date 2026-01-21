# Matrice des flux - CyberQuiz

But: documenter les échanges réseau, rendre le format réutilisable et automatisable.

## Schéma de données (colonnes)
- id: Identifiant unique du flux
- source: Nom logique de l'émetteur (service/container)
- source_host: Hôte ou réseau d'origine (ex: host, cyberquiz-network)
- source_port: Port source (host:container ou interne)
- destination: Nom logique du destinataire (service/container)
- destination_host: Hôte ou réseau cible
- destination_port: Port cible (container port ou host:container)
- protocol: TCP/UDP/HTTP/gRPC/... (préciser couche applicative si possible)
- direction: outbound / inbound / bidirectional
- auth: Méthode d'authentification (none, password, jwt, api-key, mTLS)
- encryption: TLS/None/mTLS (chiffrement en transit)
- purpose: Raison fonctionnelle du flux
- persistence: transient / persistent / streaming
- volume_or_data: indique si données persistantes en jeu (DB, index, modèles)
- exposure: "host-exposed" / "internal" / "public-proxy" (exposition en prod/dev)
- notes: Informations complémentaires / risques
- validation_needed: points à valider avec GODAGA (boolean or list)

## CSV header (exportable)
id,source,source_host,source_port,destination,destination_host,destination_port,protocol,direction,auth,encryption,purpose,persistence,volume_or_data,exposure,notes,validation_needed

## JSON schema (simplifié)
{
  "type": "object",
  "properties": {
    "id": {"type":"string"},
    "source": {"type":"string"},
    "source_host": {"type":"string"},
    "source_port": {"type":"string"},
    "destination": {"type":"string"},
    "destination_host": {"type":"string"},
    "destination_port": {"type":"string"},
    "protocol": {"type":"string"},
    "direction": {"type":"string"},
    "auth": {"type":"string"},
    "encryption": {"type":"string"},
    "purpose": {"type":"string"},
    "persistence": {"type":"string"},
    "volume_or_data": {"type":"string"},
    "exposure": {"type":"string"},
    "notes": {"type":"string"},
    "validation_needed": {"type":["boolean","array"]}
  },
  "required": ["id","source","destination","protocol","destination_port"]
}

---

## Matrice des flux (extrait initial - environnement dev)

| id | source | source_host | source_port | destination | destination_host | destination_port | protocol | direction | auth | encryption | purpose | persistence | volume_or_data | exposure | notes | validation_needed |
|----|--------|-------------|-------------|-------------|------------------|------------------|----------|-----------|------|------------|---------|-------------|----------------|----------|-------|-------------------|
| F01 | `nextjs-app` | cyberquiz-network | 3000 (container) / 3333 (host) | `postgres` | cyberquiz-network | 5432 | TCP / PostgreSQL | outbound | DB credentials (env) | none (dev) / TLS? (prod) | Application DB reads/writes | persistent | database | host-exposed (dev) / internal (prod?) | uses `DATABASE_URL` env | ["Confirm TLS and DB user in prod"] |
| F02 | `pgadmin` | host / cyberquiz-network | 80 (container) / 5050 (host) | `postgres` | cyberquiz-network | 5432 | TCP / PostgreSQL | bidirectional | pgadmin creds | none (dev) / TLS? (prod) | DB administration | persistent | database | host-exposed (dev) | admin UI; restrict in prod | ["Restrict access behind LB/ACL"] |
| F03 | `nextjs-app` | cyberquiz-network | 3000 / 3333 | `qdrant` | cyberquiz-network | 6333 (HTTP) / 6334 (gRPC) | HTTP/gRPC | outbound | API key? (unknown) | none (dev) / TLS? (prod) | Vector search / embeddings store | persistent | vector DB | host-exposed (dev) | check if app writes embeddings | ["Confirm auth, TLS, and which API used"] |
| F04 | `nextjs-app` | cyberquiz-network | 3000 / 3333 | `ollama` | cyberquiz-network | 11434 | HTTP | outbound | none / API key? | none (dev) / TLS? (prod) | LLM inference (prompts -> responses) | transient | model artifacts stored in ollama volume | host-exposed (dev) | verify prompts content (PII) & logging | ["Confirm model hosting, prompt logging, filtering/proxy"] |
| F05 | `host` (dev) | developer machine | arbitrary | `nextjs-app` | host | 3333 | HTTP | inbound | none | none | Developer access / local testing | transient | n/a | host-exposed | dev-only | ["Prod exposure? reverse-proxy?"] |
| F06 | `host` | developer machine | arbitrary | `qdrant` | host | 6333/6334 | HTTP/gRPC | inbound | none | none | dev access | persistent | qdrant storage | host-exposed | dev-only | ["Disable public exposure in prod"] |
| F07 | `host` | developer machine | arbitrary | `ollama` | host | 11434 | HTTP | inbound | none | none | dev access to local LLM | persistent (models) | ollama volume | host-exposed | restrict in prod | ["Move behind internal network/proxy"] |

---

## Mode d'emploi pour réutilisation et automatisation

1. Format canonique
   - Maintenir un fichier source `docs/matrice_flux.csv` ou `docs/matrice_flux.json` conforme au header/schema ci-dessus.
   - Le Markdown ci-dessus peut être régénéré à partir du CSV/JSON via un script simple.

2. Exemple de script Python rapide (dépendances: `pyyaml`, `python-dotenv`) pour extraire depuis `docker-compose*.yml` et `.env*` (boilerplate) :

```python
# scripts/generate_flow_matrix.py
import csv
import yaml
from pathlib import Path

def parse_compose(path):
    d = yaml.safe_load(Path(path).read_text())
    services = d.get('services', {})
    rows = []
    for name, svc in services.items():
        ports = svc.get('ports', [])
        env_file = svc.get('env_file')
        networks = svc.get('networks', [])
        # Simplified: emit flows for host mappings
        for p in ports:
            # p e.g. "3333:3000"
            if isinstance(p, str) and ':' in p:
                host_p, cont_p = p.split(':', 1)
                rows.append({
                    'id': f'EXPORT-{name}-{host_p}-{cont_p}',
                    'source': name,
                    'source_host': 'host',
                    'source_port': f'{host_p}',
                    'destination': name,
                    'destination_host': 'host',
                    'destination_port': f'{cont_p}',
                    'protocol': 'tcp',
                    'direction': 'inbound',
                    'auth': '',
                    'encryption': '',
                    'purpose': 'exposed port',
                })
    return rows

if __name__ == '__main__':
    rows = parse_compose('docker-compose.dev.yml')
    writer = csv.DictWriter(open('docs/matrice_flux.csv','w',newline=''), fieldnames=list(rows[0].keys()))
    writer.writeheader()
    writer.writerows(rows)
```

3. Pipeline recommandé
   - Exécuter le parser qui génère `docs/matrice_flux.csv` à chaque changement de `docker-compose*.yml` (CI job).
   - Ajouter une validation CI qui s'assure que les flux exposés ne contiennent pas secrets en clair.
   - Lors de préparation d'un DAT, importer le CSV et compléter colonnes `auth`, `encryption`, `validation_needed` manuellement ou via un court questionnaire automatisé.

## Checklist de validation (à envoyer à GODAGA)
- Liste des services prod et diff vs dev (qui reste exposé publiquement?)
- Authentification entre services (DB creds, API keys, JWT, mTLS)
- Chiffrement en transit (TLS) et au repos (DB encryption)
- Politique de secrets (Vault, env files, rotation)
- Reverse-proxy / Ingress et règles d'accès (ACLs / firewall)
- Flux sortants autorisés (egress) et restrictions réseau
- Logging/retention des prompts envoyés à l'IA (Ollama)

---

## Notes finales
- Ce document sert de base: chaque flux doit être validé en prod et attaché à une règle de contrôle (ACL, firewall, LB).
- Pour l'atelier EBIOS RM, exporte ce CSV vers l'outil de cartographie (ou intègre en tant que table d'actifs/connexions).


