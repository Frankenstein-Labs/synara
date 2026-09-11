# CORTEX IDE — Rapport de vérification initiale

**Date :** 9 septembre 2026
**Commit de base :** `4bb3dccfa2cfdafb432bc4cdbc474921a379f6be`
**Branche de travail :** `chore/import-cortex-baseline`
**Node vérifié :** `v22.16.0`
**Bun vérifié :** `1.4.2`

## Résumé exécutif

L’import complet de Cortex est présent dans le dépôt CORTEX IDE et les dépendances peuvent être installées après ajout du compilateur natif `g++`. Le typecheck complet passe sous Node `22.16.0`. Le build web passe dans le build global, mais le build global échoue ensuite sur le package serveur parce que les scripts déclarés utilisent `node` directement pour exécuter des fichiers TypeScript `.ts`.

La suite de tests progresse nettement avec Node `22.16.0`. Les packages scripts, contracts, shared et desktop passent leurs tests. La suite web compte 342 fichiers de test réussis et 3 ignorés, avec un seul test en échec par timeout. La suite complète n’est donc pas verte. Le desktop n’est pas déclaré fonctionnel de bout en bout tant que le build serveur et le smoke test n’ont pas été corrigés ou exécutés avec une toolchain compatible.

## Prérequis vérifiés

| Prérequis                 | Résultat                                                     |
| ------------------------- | ------------------------------------------------------------ |
| Node.js `22.16.0`         | Installé et utilisé pour le second passage.                  |
| Bun `1.4.2`               | Installé et utilisé conformément au `packageManager` racine. |
| Python 3                  | Détecté par `node-gyp` pendant l’installation native.        |
| `build-essential` / `g++` | Installé pour compiler `node-pty`.                           |
| Dépendances Bun           | Installation réussie après l’installation de `g++`.          |
| `node-pty`                | Compilation native Linux réussie pendant `bun install`.      |

Le premier passage sous Node `22.13.0` était insuffisant pour les tests SQLite. La source signale explicitement que `StatementSync.columns` exige Node `>=22.16`, `>=23.11` ou `>=24`.

## Commandes exécutées

```bash
npm install --global bun@1.4.2
sudo apt-get update
sudo apt-get install -y build-essential
bun install
source /home/ubuntu/.nvm/nvm.sh
nvm install 22.16.0
nvm use 22.16.0
bun run typecheck
bun run test
bun run --filter @cortex/cli build
bun run build:desktop
bun run brand:check
bun run windows-runtime:check
bun run migrations:check
bun run fmt:check
```

Les commandes ont été exécutées sans modifier volontairement le code applicatif. Les journaux détaillés ont été conservés dans l’environnement de vérification local.

## Résultats détaillés

| Vérification                          | Résultat           | Détail                                                                                                           |
| ------------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Installation initiale                 | Échec partiel      | `node-pty` ne trouvait pas `g++`.                                                                                |
| Installation après `build-essential`  | Réussie            | Bun a installé les dépendances et compilé `node-pty`.                                                            |
| Typecheck sous Node `22.16.0`         | Réussi             | 7 packages sur 7 terminés avec succès. Les diagnostics Effect sont des suggestions.                              |
| Tests packages scripts                | Réussi             | 14 fichiers et 92 tests réussis.                                                                                 |
| Tests contracts                       | Réussi             | 18 fichiers et 210 tests réussis.                                                                                |
| Tests shared                          | Réussi             | 66 fichiers et 643 tests réussis, 1 ignoré.                                                                      |
| Tests desktop                         | Réussi             | 74 fichiers réussis, 2 ignorés; 674 tests réussis, 6 ignorés.                                                    |
| Tests web                             | Échec ciblé        | 342 fichiers réussis, 3 ignorés; 1 fichier échoue et 1 test échoue sur timeout de 15 secondes.                   |
| Tests web en échec                    | À corriger         | `src/components/Sidebar.import.test.ts` — `loads after project-run wiring`.                                      |
| Typecheck initial sous Node `22.13.0` | Non concluant      | Les tests SQLite nécessitent une version Node plus récente.                                                      |
| Build web                             | Réussi             | Vite termine le build en environ 5 minutes 10 secondes. Des chunks dépassent 850 kB, avertissement non bloquant. |
| Build serveur                         | Échec              | `apps/server/scripts/cli.ts` est lancé par `node` et échoue avec `ERR_UNKNOWN_FILE_EXTENSION`.                   |
| Build desktop global                  | Échec en cascade   | Le bundle desktop avance, mais `build:desktop` dépend aussi du build serveur.                                    |
| Contrôle de marque                    | Échec d’exécution  | Le script `.ts` est lancé directement avec `node`.                                                               |
| Contrôle runtime Windows              | Échec d’exécution  | Le script `.ts` est lancé directement avec `node`.                                                               |
| Contrôle migrations                   | Échec d’exécution  | Le script `.ts` est lancé directement avec `node`.                                                               |
| Format check                          | Échec documentaire | Les deux nouveaux fichiers Markdown nécessitent le formatage Oxfmt du dépôt.                                     |

## Problèmes non masqués

### Exécution directe des scripts TypeScript

Plusieurs scripts racine sont déclarés sous la forme `node scripts/*.ts`. Sous Node `22.16.0`, cette invocation produit `TypeError [ERR_UNKNOWN_FILE_EXTENSION]`. Le même problème apparaît pour `apps/server/scripts/cli.ts`, `scripts/check-brand-identity.ts`, `scripts/check-windows-runtime-boundary.ts` et `scripts/check-migration-lineage.ts`.

Ce problème empêche de déclarer le build serveur, les contrôles spécialisés et le build desktop global comme fonctionnels. Il devra être résolu par une décision cohérente de toolchain, par exemple en utilisant Bun pour ces scripts ou en ajoutant une étape de compilation explicite. Aucune de ces corrections n’a été appliquée pendant l’import initial afin de préserver la base source.

### Test web en timeout

Le test `src/components/Sidebar.import.test.ts` dépasse le délai de 15 secondes pendant l’import de `Sidebar`. Le résultat observé est un échec isolé au sein de la suite web; il ne justifie pas la suppression ou l’assouplissement arbitraire du test. Il faut d’abord déterminer si le délai provient de la charge d’import, d’un effet de bord de module ou d’une régression réelle.

### Formatage des documents

Le contrôle `bun run fmt:check` détecte les deux nouveaux documents d’audit et de roadmap. Cette non-conformité documentaire doit être corrigée avant la finalisation du commit.

### Environnement desktop

Un message de test indique également qu’un scénario serveur n’a pas pu lancer une session PTY native dans une partie des tests. `node-pty` a pourtant été compilé avec succès pendant l’installation. Une vérification dédiée du smoke test desktop doit être répétée après correction du build serveur et dans un environnement graphique adapté.

## Structure réellement importée

La structure vérifiée est la suivante :

```text
apps/desktop/       Electron desktop, preload, IPC, fenêtres, mises à jour, PTY
apps/server/        serveur/CLI, orchestration, SQLite, Git, providers, WebSocket
apps/web/           React/Vite, éditeur, routes, terminal et interface utilisateur
apps/marketing/     Next.js, contenu marketing et documentation
packages/contracts/ contrats partagés
packages/shared/    runtime partagé, filesystem, processus et utilitaires
scripts/            build, release, packaging, provenance et checks
assets/             ressources de développement et de production
docs/               documentation produit, runtime et release
.plans/ plans/      plans d’architecture et d’évolution
audit/              audits et handoffs
```

Le fichier `LICENSE` MIT et les notices existantes ont été conservés. Les détails d’architecture et les obligations de licence sont décrits dans `CORTEX_IDE_AUDIT.md`.

## Prochaines étapes recommandées

La première étape recommandée est de choisir et documenter le lanceur officiel des scripts TypeScript. Cette décision doit corriger le build serveur et les trois contrôles spécialisés sans modifier le comportement applicatif.

La deuxième étape est de relancer les contrôles spécialisés et le build desktop complet. Il faudra ensuite exécuter un smoke test dans un environnement Linux graphique et, séparément, vérifier les cibles de packaging macOS, Windows et Linux sur leurs runners respectifs.

La troisième étape est d’analyser le timeout `Sidebar.import.test.ts` et de corriger sa cause sans augmenter aveuglément le délai. La quatrième étape est d’exécuter un test web ciblé puis la suite complète après correction.

La cinquième étape est de conserver une baseline CI pour le typecheck, les tests, le build web, le build serveur et les contrôles de provenance. Le grand rebranding CORTEX et les nouvelles fonctionnalités de roadmap doivent rester reportés jusqu’à la clôture de cette phase de stabilisation.

## Références

[1]: https://github.com/Emanuele-web04/cortex "Dépôt source Cortex"
[2]: https://github.com/Frankenstein-Labs/cortex-ide "Dépôt de travail CORTEX IDE"
[3]: https://bun.sh/docs/install "Documentation d’installation de Bun"
[4]: https://nodejs.org/en/download "Téléchargements Node.js"

[1] [2] [3] [4]

_Document préparé par Manus AI._
