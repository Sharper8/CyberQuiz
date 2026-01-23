-- CyberQuiz: Production-Ready Validated Questions for Demo
-- 20 curated questions covering cybersecurity fundamentals
-- All questions are true/false format, human-validated, clear and educational

-- These can be imported via the admin panel or added directly to the database

-- Category: Sécurité Réseau (Network Security)
-- Q1: HTTPS encryption
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES 
  ('Le protocole HTTPS chiffre les données échangées entre votre navigateur et un site web', '["Vrai", "Faux"]', 'Vrai', 'HTTPS utilise TLS/SSL pour chiffrer toutes les communications, protégeant ainsi vos données contre l''interception.', 0.2, 'Sécurité Réseau', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q2: Firewall limitations
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Un pare-feu (firewall) peut bloquer toutes les cyberattaques sans exception', '["Vrai", "Faux"]', 'Faux', 'Un firewall ne protège que contre certaines attaques réseau. Il ne détecte pas les malwares, le phishing ou les vulnérabilités applicatives.', 0.3, 'Sécurité Réseau', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q3: VPN functionality
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Un VPN rend votre connexion Internet complètement anonyme', '["Vrai", "Faux"]', 'Faux', 'Un VPN chiffre votre trafic et masque votre IP, mais le fournisseur VPN peut toujours voir votre activité. L''anonymat total nécessite des mesures supplémentaires.', 0.4, 'Sécurité Réseau', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q4: DNS over HTTPS
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Le DNS-over-HTTPS (DoH) chiffre vos requêtes DNS pour plus de confidentialité', '["Vrai", "Faux"]', 'Vrai', 'DoH chiffre les requêtes DNS via HTTPS, empêchant leur interception et modification par des tiers (FAI, attaquants).', 0.5, 'Sécurité Réseau', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Category: Sécurité Web (Web Security)
-- Q5: SQL Injection
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Une injection SQL permet d''exécuter des commandes non autorisées sur une base de données', '["Vrai", "Faux"]', 'Vrai', 'L''injection SQL exploite des failles dans les requêtes pour exécuter du code SQL arbitraire, permettant de lire, modifier ou détruire des données.', 0.3, 'Sécurité Web', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q6: XSS vulnerability
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Le Cross-Site Scripting (XSS) affecte uniquement les sites en HTTP', '["Vrai", "Faux"]', 'Faux', 'Le XSS peut toucher les sites HTTPS aussi. HTTPS protège le transport mais pas contre l''injection de scripts malveillants dans les pages web.', 0.5, 'Sécurité Web', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q7: CSRF protection
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Les tokens CSRF protègent contre les requêtes non autorisées provenant d''autres sites', '["Vrai", "Faux"]', 'Vrai', 'Les tokens CSRF vérifient que chaque requête sensible provient bien du site légitime, empêchant les attaques Cross-Site Request Forgery.', 0.6, 'Sécurité Web', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q8: Cookie security
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('L''attribut HttpOnly empêche JavaScript d''accéder aux cookies', '["Vrai", "Faux"]', 'Vrai', 'L''attribut HttpOnly rend les cookies inaccessibles via JavaScript, protégeant ainsi les sessions contre le vol par XSS.', 0.4, 'Sécurité Web', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Category: Cryptographie (Cryptography)
-- Q9: Symmetric encryption
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Le chiffrement symétrique utilise la même clé pour chiffrer et déchiffrer', '["Vrai", "Faux"]', 'Vrai', 'Dans le chiffrement symétrique (AES, ChaCha20), une seule clé secrète est partagée entre les parties pour toutes les opérations.', 0.3, 'Cryptographie', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q10: Hashing vs Encryption
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('SHA-256 est un algorithme de chiffrement réversible', '["Vrai", "Faux"]', 'Faux', 'SHA-256 est une fonction de hachage cryptographique à sens unique. Le processus n''est pas réversible - on ne peut pas retrouver les données originales.', 0.5, 'Cryptographie', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q11: Public key cryptography
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Dans le chiffrement asymétrique, la clé publique peut être partagée librement', '["Vrai", "Faux"]', 'Vrai', 'La clé publique est destinée à être partagée largement. Seule la clé privée doit rester secrète pour garantir la sécurité du système.', 0.4, 'Cryptographie', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q12: Salt in password hashing
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Ajouter un "salt" aux mots de passe avant le hachage protège contre les rainbow tables', '["Vrai", "Faux"]', 'Vrai', 'Un salt unique par mot de passe rend les rainbow tables (tables précalculées de hash) inutilisables car chaque hash devient unique.', 0.6, 'Cryptographie', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Category: Authentification (Authentication)
-- Q13: MFA effectiveness
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('L''authentification à deux facteurs (2FA) protège contre le vol de mot de passe', '["Vrai", "Faux"]', 'Vrai', 'Même si un attaquant obtient votre mot de passe, il ne pourra pas se connecter sans le second facteur (code SMS, app authenticator, clé physique).', 0.3, 'Authentification', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q14: Password complexity
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Un mot de passe de 8 caractères complexes est aussi sûr qu''une phrase de passe de 20 caractères', '["Vrai", "Faux"]', 'Faux', 'La longueur est plus importante que la complexité. Une phrase de 20 caractères offre bien plus d''entropie et de résistance aux attaques par force brute.', 0.4, 'Authentification', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q15: Biometric security
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Les données biométriques (empreinte, visage) ne peuvent jamais être compromises', '["Vrai", "Faux"]', 'Faux', 'Les données biométriques peuvent être volées, reproduites ou contrefaites. De plus, contrairement aux mots de passe, on ne peut pas les changer si elles sont compromises.', 0.5, 'Authentification', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Category: Sécurité Email (Email Security)
-- Q16: Phishing detection
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Un email de phishing est toujours facile à identifier par ses fautes d''orthographe', '["Vrai", "Faux"]', 'Faux', 'Les attaques de phishing modernes sont très sophistiquées, avec des emails parfaitement rédigés imitant des organisations légitimes. Il faut vérifier l''expéditeur et les liens.', 0.3, 'Sécurité Email', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q17: SPF/DKIM
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Les enregistrements SPF et DKIM aident à vérifier l''authenticité d''un email', '["Vrai", "Faux"]', 'Vrai', 'SPF vérifie que le serveur envoyeur est autorisé, DKIM vérifie que l''email n''a pas été modifié. Ensemble, ils combattent l''usurpation d''identité.', 0.6, 'Sécurité Email', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Category: Malwares (Malware)
-- Q18: Ransomware
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Un ransomware chiffre vos fichiers et demande une rançon pour les déchiffrer', '["Vrai", "Faux"]', 'Vrai', 'Les ransomwares sont des malwares qui chiffrent vos données et exigent un paiement (généralement en cryptomonnaie) pour fournir la clé de déchiffrement.', 0.2, 'Malwares', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Q19: Antivirus limitations
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Un antivirus à jour protège contre 100% des malwares', '["Vrai", "Faux"]', 'Faux', 'Aucun antivirus n''offre une protection totale. Les nouvelles menaces (zero-day) et les techniques d''évasion peuvent contourner les détections.', 0.4, 'Malwares', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());

-- Category: Sécurité Mobile (Mobile Security)
-- Q20: App permissions
INSERT INTO "Question" ("questionText", "options", "correctAnswer", "explanation", "difficulty", "category", "questionType", "status", "isRejected", "aiProvider", "qualityScore", "createdAt", "updatedAt")
VALUES
  ('Il est sûr de donner toutes les permissions demandées par une application mobile', '["Vrai", "Faux"]', 'Faux', 'Chaque permission donne accès à des données sensibles. Il faut n''accorder que les permissions nécessaires au fonctionnement légitime de l''app.', 0.3, 'Sécurité Mobile', 'true-false', 'accepted', false, 'human', 1.0, NOW(), NOW());
