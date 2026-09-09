# CORTEX IDE — Audit initial de la base Synara

**Statut :** audit initial réalisé le 9 septembre 2026.  
**Source examinée :** [`Emanuele-web04/synara`](https://github.com/Emanuele-web04/synara)  
**Commit source examiné :** `4bb3dccfa2cfdafb432bc4cdbc474921a379f6be`  
**Dépôt de travail :** [`Frankenstein-Labs/cortex-ide`](https://github.com/Frankenstein-Labs/cortex-ide)

## Conclusion

CORTEX IDE est initialisé comme une copie de travail complète de la base Synara. La structure applicative, les packages, les scripts, les tests, les configurations de build et les fichiers de licence sont conservés. Aucun grand rebranding, aucune suppression de fonctionnalité et aucune transformation en prototype n’ont été réalisés dans cette étape.

Le dépôt est une monorepo TypeScript orientée Bun. Elle contient une application desktop Electron, un serveur local/CLI, une application web React/Vite, une application marketing Next.js, deux packages partagés et un ensemble important de scripts de build, de release et de vérification.

## Périmètre et méthode

L’analyse a porté sur l’arborescence Git complète, les manifestes `package.json`, le verrouillage `bun.lock`, les configurations TypeScript/Vite/Turbo/Vitest, les fichiers d’entrée desktop et serveur, les scripts de packaging, les tests et le fichier `LICENSE`. Les affirmations de fonctionnement sont limitées aux commandes effectivement exécutées et rapportées dans le document de vérification final.

## Architecture réelle

| Zone | Emplacement réel | Rôle observé |
| --- | --- | --- |
| Applications | `apps/` | Conteneur des applications produit. |
| Desktop | `apps/desktop/` | Client desktop Electron, bootstrap principal, preload, ponts IPC, intégration backend et scripts de démarrage. |
| Serveur / CLI | `apps/server/` | Serveur applicatif et CLI local, orchestration, persistance SQLite, providers, WebSocket et terminal. Le package est nommé `@synara/cli`. |
| Web | `apps/web/` | Interface React 19 construite avec Vite, TanStack Router, Zustand, Lexical et xterm. |
| Marketing | `apps/marketing/` | Site marketing et documentation Next.js. |
| Contrats partagés | `packages/contracts/` | Contrats et types partagés entre les applications. |
| Code partagé | `packages/shared/` | Utilitaires et abstractions communes, notamment processus, filesystem, plateformes et intégrations. |
| Scripts | `scripts/` | Build, release, vérifications de provenance, packaging desktop, migrations de manifestes et tests de smoke. |
| Documentation | `.docs/`, `docs/`, `plans/`, `.plans/`, `audit/` | Documentation d’architecture, plans, procédures, audits et notes de release. |
| Ressources | `assets/`, `apps/desktop/resources/` | Ressources de développement, de production et ressources desktop. |

Il n’existe pas de répertoires racine `desktop/`, `server/`, `web/` ou `shared/` dans cette version. Les composants correspondants sont respectivement sous `apps/desktop`, `apps/server`, `apps/web` et `packages/shared`.

## Runtime et dépendances

Le gestionnaire de paquets et le runtime de développement recommandés sont Bun. Le dépôt déclare `bun@1.4.2` dans le champ `packageManager` et fournit `bun.lock` ainsi que `bunfig.toml`. Le serveur déclare une compatibilité Node.js `^22.19 || ^23.11 || >=24.10`, en complément de l’utilisation de Bun pour les commandes de développement.

La pile principale comprend TypeScript, React 19, Vite 8, Next.js pour le site marketing, Electron pour le desktop, Vitest pour les tests, Playwright pour certains tests navigateur/desktop, Effect pour des parties du serveur et `node-pty` pour les sessions terminal. Les versions et dépendances exactes restent celles des manifestes importés et de `bun.lock`.

## Application desktop

Le desktop est une application Electron. Son code se trouve dans `apps/desktop/src/`, avec notamment `main.ts`, `preload.ts`, des canaux IPC, des ponts WebSocket, la gestion de fenêtre, la récupération après crash du renderer, les mises à jour et la migration du stockage.

Les scripts desktop observés sont les suivants :

| Commande | Fonction |
| --- | --- |
| `bun run --filter @synara/desktop dev` | Lance le flux de développement desktop. |
| `bun run --filter @synara/desktop dev:bundle` | Recompile le bundle en mode watch. |
| `bun run --filter @synara/desktop dev:electron` | Lance le processus Electron de développement. |
| `bun run --filter @synara/desktop build` | Construit le bundle desktop. |
| `bun run --filter @synara/desktop start` | Démarre Electron à partir du bundle construit. |
| `bun run --filter @synara/desktop test` | Exécute les tests desktop avec Vitest. |
| `bun run --filter @synara/desktop smoke-test` | Exécute le smoke test desktop. |

Le desktop hydrate l’environnement du processus graphique avant de démarrer le backend. Les détails de plateforme sont centralisés dans le runtime partagé et dans les modules desktop. Le terminal utilise `node-pty`; sous Windows, la documentation source indique l’utilisation de ConPTY via node-pty même lorsque le backend est lancé sous Bun.

## Éditeur, fichiers et terminal

L’interface web contient l’éditeur et ses vues React. Lexical est présent pour les surfaces d’édition riches, tandis que `@pierre/diffs` fournit des capacités de comparaison. Les fichiers et projets sont traités par les couches du serveur et les abstractions partagées; la persistance applicative s’appuie notamment sur SQLite côté serveur.

Le terminal est exposé par le serveur et le desktop au moyen de sessions PTY. Les modules de runtime de processus centralisent la résolution des commandes, les environnements, la gestion des processus enfants, l’arrêt des arbres de processus et les particularités Windows/WSL. Ces mécanismes ne doivent pas être réimplémentés directement dans les futurs providers.

## Git et providers/agents

Le serveur contient des modules de projet, de GitHub, de branches, de worktrees et de pull requests, ainsi que des couches de providers et d’orchestration. Les providers lancent des processus avec un environnement construit par provider, observent un handshake borné et publient un état de démarrage typé. Le cycle documenté par la source est `discovering → starting → handshaking → authenticating → ready → running`, avec des sorties vers `failed` ou `stopped`.

Les agents et providers sont donc intégrés au serveur et à son orchestration plutôt qu’à une application autonome séparée. Toute évolution devra conserver les limites de processus et les mécanismes d’arrêt supervisé existants.

## Serveur

Le package serveur se trouve sous `apps/server` et expose le binaire `synara`. Ses commandes principales sont `dev`, `build`, `start`, `typecheck` et `test`. Le code couvre l’orchestration des tours, les providers, le serveur WebSocket, la persistance, les migrations, les projets, le terminal et les intégrations externes.

Le serveur utilise une base SQLite et possède des tests de migrations, de persistance, de runtime de processus, de providers, d’orchestration et d’intégration. Le serveur peut être exécuté en développement avec `bun run --filter @synara/cli dev` et à partir du build avec `bun run --filter @synara/cli start`.

## Web

L’application `apps/web` est une application React construite avec Vite. Elle utilise notamment TanStack Router, React Query, Zustand, Lexical, xterm et des bibliothèques de rendu Markdown/diff. Ses commandes déclarées couvrent `dev`, `build`, `preview`, `typecheck`, les tests Vitest, les tests navigateur Playwright et les tests Electron end-to-end.

Le web consomme les contrats et utilitaires des workspaces `@synara/contracts` et `@synara/shared`. Aucun remplacement de l’interface existante par une landing page CORTEX n’a été effectué.

## Build et packaging

Le build est piloté par les scripts Bun des workspaces, TypeScript, Vite, tsdown et Turbo. La configuration racine comprend `turbo.json`, `tsconfig.base.json`, `vitest.config.ts`, `bunfig.toml` et `bun.lock`.

Le dépôt contient des scripts de packaging et de release desktop dans `scripts/`, notamment la construction d’artefacts desktop, la vérification du démarrage d’un desktop packagé, la provenance des artefacts, la préparation des feeds de mise à jour et la finalisation des artefacts macOS. Les configurations observées prévoient des cibles macOS DMG/ZIP, Windows NSIS et Linux avec artefacts adaptés, mais la production effective de chaque artefact doit être vérifiée sur son runner et avec ses certificats disponibles.

Les signatures, la notarisation macOS, l’authentification Windows et la publication des mises à jour ne sont pas considérées comme vérifiées dans cet audit tant qu’un pipeline de release complet n’a pas été exécuté.

## Licence et obligations

Le dépôt source contient un fichier `LICENSE` sous licence MIT. La copie de travail conserve ce fichier ainsi que les notices, attributions, fichiers de contribution et métadonnées source. La licence MIT impose notamment de conserver la notice de copyright et la notice de permission dans les copies ou portions substantielles du logiciel.

Le dépôt CORTEX IDE doit donc conserver `LICENSE` et toute notice tierce éventuellement ajoutée par les dépendances ou par les futurs imports. Les changements futurs devront éviter de supprimer les attributions Synara sans analyse juridique préalable. Cet audit ne constitue pas un avis juridique.

## Modifications réalisées dans cette étape

| Élément | Modification |
| --- | --- |
| Code applicatif | Aucune modification fonctionnelle volontaire. |
| Structure | Structure complète conservée. |
| Licence | `LICENSE` conservé. |
| Documentation | Ajout de `CORTEX_IDE_AUDIT.md` et `CORTEX_IDE_ROADMAP.md`. |
| Identité | Aucun grand rebranding du code ou de l’interface. |
| GitHub | Création du dépôt de travail privé `Frankenstein-Labs/cortex-ide`. |

## Références

[1]: https://github.com/Emanuele-web04/synara "Dépôt source Synara"
[2]: https://github.com/Frankenstein-Labs/cortex-ide "Dépôt de travail CORTEX IDE"
[3]: https://opensource.org/license/mit "Texte de la licence MIT"
[4]: https://bun.sh/docs/install "Documentation d’installation de Bun"
[5]: https://www.electronjs.org/docs/latest/ "Documentation Electron"
[6]: https://microsoft.github.io/language-server-protocol/ "Language Server Protocol"

## État des vérifications

Les commandes et résultats détaillés de l’installation, des tests et des builds doivent être consignés dans le rapport final de cette initialisation. Tant qu’une commande n’a pas été exécutée avec succès dans cet environnement, elle n’est pas déclarée fonctionnelle par ce document.

> Règle de travail CORTEX IDE : une capacité est documentée comme fonctionnelle uniquement après une vérification reproductible.

[1] [2] [3] [4] [5] [6]

*Document préparé par Manus AI.*

---

[1]: https://github.com/Emanuele-web04/synara "Dépôt source Synara"
[2]: https://github.com/Frankenstein-Labs/cortex-ide "Dépôt de travail CORTEX IDE"
[3]: https://opensource.org/license/mit "Texte de la licence MIT"
[4]: https://bun.sh/docs/install "Documentation d’installation de Bun"
[5]: https://www.electronjs.org/docs/latest/ "Documentation Electron"
[6]: https://microsoft.github.io/language-server-protocol/ "Language Server Protocol"
