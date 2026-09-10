# Cortex Platform Direction

## Positionnement

Le dépôt existant est déjà une plateforme d’orchestration d’agents et de développement : il comprend une application Electron, un client web avec éditeur et terminal, un serveur de sessions, Git/worktrees, MCP, plusieurs providers et une découverte de plugins côté provider. Cortex ne doit donc pas réimplémenter immédiatement un IDE complet ni importer aveuglément une marketplace externe.

Le rebranding vers **Cortex** est traité comme une migration de produit : packages, identifiants d’exécution, textes visibles, scripts de build et documentation active utilisent désormais cette identité. Les archives historiques sont conservées comme archives et ne participent pas au runtime.

## Instincts : une mémoire de conventions, pas une automatisation opaque

**Cortex Instincts** est le nom retenu pour une mémoire de projet révisable. Un instinct est une convention explicitement affichée, limitée par un scope et accompagnée d’un niveau de confiance et de preuves. Par exemple : « Les tests de ce workspace utilisent Vitest et doivent rester dans le dossier `*.test.ts` ».

Les instincts peuvent être proposés par Cortex à partir d’indices de travail, mais ils ne deviennent actifs qu’après acceptation. Chaque instinct peut être mis en pause, rejeté ou modifié. Le modèle partagé est dans `packages/contracts/src/instincts.ts`; la persistance et l’interface seront ajoutées ensuite derrière les frontières RPC existantes.

Cette approche donne une fonctionnalité différenciante sans surprendre l’utilisateur : les préférences sont locales au workspace, auditables, exportables et réversibles. Les instincts ne doivent jamais modifier un fichier ou une commande sans passer par les permissions et validations déjà présentes dans Cortex.

## LSP : réutiliser l’éditeur, ajouter un service de workspace

Le dépôt ne contient pas encore de client LSP ou de gestionnaire de serveurs de langage générique. Il contient des diagnostics liés aux providers et des briques d’éditeur, mais cela ne remplace pas le protocole Language Server Protocol.

La trajectoire retenue est une couche serveur dédiée :

1. déclarer les serveurs par langage et par workspace;
2. lancer les processus LSP avec un transport contrôlé (`stdio` en premier);
3. router les requêtes documentées (initialisation, synchronisation de texte, diagnostics, completion, hover, définition et références) via les frontières RPC existantes;
4. exposer les capacités réellement négociées à l’éditeur;
5. isoler les processus, limiter leur durée de vie et nettoyer les sessions à la fermeture du workspace.

Les contrats de configuration et de diagnostics sont déjà posés dans `packages/contracts/src/lsp.ts`. La prochaine étape technique est un `LanguageServerManager` côté serveur, puis un adaptateur d’éditeur qui consomme les diagnostics et les actions LSP sans casser le flux actuel de fichiers.

## Extensions

La découverte de plugins existe déjà pour certains providers (`ProviderDiscoveryService`). Elle ne constitue pas encore une API d’extensions natives de l’éditeur. Cortex doit conserver cette distinction : les plugins provider sont des capacités d’agents, tandis que les extensions Cortex pourront contribuer à l’éditeur, aux commandes, aux langages et aux vues.

Avant d’accepter des extensions « comme VS Code », il faudra définir un manifeste signé ou explicitement approuvé, des permissions, un hôte d’exécution isolé et une API versionnée. LSP sera le premier point d’intégration de langage, car il apporte une valeur élevée avec une surface de sécurité plus maîtrisable qu’un runtime d’extensions arbitraire.
