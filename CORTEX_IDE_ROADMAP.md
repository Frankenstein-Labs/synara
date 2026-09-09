# CORTEX IDE — Feuille de route

Cette feuille de route décrit l’évolution future de la base Synara importée vers CORTEX IDE. Elle ne constitue pas une déclaration de fonctionnalités déjà disponibles. La priorité immédiate est de stabiliser et de comprendre la base existante sans supprimer ses capacités.

## Principes directeurs

CORTEX IDE doit rester une base de développement réelle, testable et extensible. Chaque évolution devra préserver la licence MIT et les attributions requises, documenter ses impacts, fournir des tests adaptés et éviter les régressions du desktop, du serveur, du web et des packages partagés.

Les décisions d’architecture devront partir de la structure réellement présente dans le dépôt. Les fonctionnalités ne seront déclarées disponibles qu’après implémentation et vérification. Les changements importants devront être réalisés sur des branches dédiées et intégrés après revue.

## Phase 1 — Stabiliser la base actuelle

La première phase consiste à rendre la copie de travail reproductible et fiable. Elle comprend la validation des prérequis Bun/Node, l’installation déterministe des dépendances, la réussite des tests existants, la réussite des typechecks et la vérification des builds web, serveur et desktop.

Cette phase doit également établir une matrice de support Windows, macOS et Linux, documenter les limites de packaging, vérifier les flux de démarrage du desktop et du serveur, et distinguer les problèmes hérités de Synara des changements propres à CORTEX IDE.

## Phase 2 — Faire évoluer l’éditeur vers le multi-langage

L’éditeur devra progressivement prendre en charge JavaScript, TypeScript, Python, C, C++, Rust, Go, Java, C# et d’autres langages selon la demande et la maturité des intégrations.

L’architecture cible devra étudier le **Language Server Protocol (LSP)** comme frontière commune pour les services de langage. L’étude devra couvrir la découverte des serveurs, leur installation, leur cycle de vie, les capacités annoncées, la configuration par workspace, la sécurité des processus et la compatibilité avec le runtime desktop et serveur existant.

Cette phase ne doit pas supposer que tous les langages seront supportés simultanément. Chaque intégration devra être ajoutée avec des critères de compatibilité, des tests et une stratégie de repli lorsqu’un language server n’est pas disponible.

## Phase 3 — Fonctionnalités IDE

Après la stabilisation de la base et la première architecture LSP, CORTEX IDE pourra ajouter les fonctionnalités IDE suivantes :

| Domaine                 | Capacités visées                               |
| ----------------------- | ---------------------------------------------- |
| Assistance à l’écriture | Autocomplete et complétion contextuelle.       |
| Qualité                 | Diagnostics, linting et formatting.            |
| Navigation              | Go to definition et find references.           |
| Symboles                | Rename symbol et refactoring.                  |
| Exécution               | Debugging et inspection des processus.         |
| Validation              | Testing, résultats de tests et relance ciblée. |

Chaque capacité devra être conçue pour fonctionner par langage et par provider. L’interface devra exposer clairement les capacités disponibles au lieu de masquer les limites d’un environnement donné.

## Phase 4 — Plateforme d’extensions

CORTEX IDE pourra devenir une plateforme d’extensions avec une API stable, un Extension Host isolé, un Extension Manager, des mécanismes d’installation, d’activation et de désactivation, un système de permissions, un SDK et un Marketplace.

La priorité d’architecture devra être la sécurité. Les extensions devront avoir des permissions explicites, un cycle de vie observable et des limites d’accès au filesystem, au réseau, aux processus et aux secrets. Le Marketplace devra prévoir la provenance, la version, la compatibilité et la possibilité de retirer ou bloquer une extension compromise.

## Phase 5 — CORTEX AI

CORTEX AI pourra ajouter les capacités suivantes :

| Domaine        | Objectif futur                                               |
| -------------- | ------------------------------------------------------------ |
| Interaction    | AI Chat intégré au workspace.                                |
| Compréhension  | Repository Intelligence et Project Analysis.                 |
| Dépendances    | Dependency Analysis et détection des risques.                |
| Assistance     | Code Assistance, Debugging Assistance et Testing Assistance. |
| Automatisation | Agent Orchestration avec contrôles et limites explicites.    |

La conception devra respecter les frontières de sécurité existantes. Les agents devront rendre leurs actions observables, demander les autorisations appropriées pour les opérations sensibles, limiter leurs changements et produire des traces exploitables. Aucune capacité IA n’est ajoutée par cette étape d’importation.

## Phase 6 — CORTEX Cloud

Une phase ultérieure pourra connecter CORTEX IDE à CORTEX Cloud pour fournir l’identité et la collaboration :

- authentication ;
- user identity ;
- projects ;
- organizations ;
- repositories ;
- cloud workspaces ;
- synchronization ;
- API tokens ;
- quotas.

Cette phase nécessitera une conception séparée des comptes, des permissions, du stockage des secrets, de la synchronisation concurrente, de la rétention des données, de la facturation éventuelle et des limites de quota. Elle ne doit pas être introduite avant que le modèle de sécurité et les flux de récupération soient validés.

## Ordre de livraison recommandé

| Priorité | Résultat attendu                | Condition de passage                                       |
| -------- | ------------------------------- | ---------------------------------------------------------- |
| 1        | Base importée et reproductible  | Installation, tests, typechecks et builds documentés.      |
| 2        | Matrice de runtime et packaging | Démarrage desktop et artefacts vérifiés par plateforme.    |
| 3        | Première intégration LSP        | Un langage supporté de bout en bout avec tests.            |
| 4        | Fonctions IDE fondamentales     | Diagnostics, navigation et formatage vérifiés.             |
| 5        | Extension Host sécurisé         | API versionnée et permissions testées.                     |
| 6        | CORTEX AI contrôlable           | Actions traçables, limites et tests de sécurité.           |
| 7        | CORTEX Cloud                    | Identité, projets et synchronisation conçus puis vérifiés. |

## Hors périmètre immédiat

Le grand rebranding de l’interface, le remplacement du code existant, la suppression de fonctionnalités Synara et l’ajout de services cloud ne font pas partie de l’importation initiale. Ils ne devront commencer qu’après la clôture de la Phase 1 et après l’établissement d’une baseline de tests et de builds.

## Références

[1]: https://github.com/Emanuele-web04/synara "Dépôt source Synara"
[2]: https://github.com/Frankenstein-Labs/cortex-ide "Dépôt de travail CORTEX IDE"
[3]: https://microsoft.github.io/language-server-protocol/ "Language Server Protocol"

_Document préparé par Manus AI._
