# C.A.P.R.I : contexte pour reprendre le projet

Lu automatiquement au démarrage d'une session. Le README décrit le produit ; ce fichier décrit comment travailler dessus.

## Le projet en deux phrases

C.A.P.R.I est un copilote commercial pour Windows (Tauri 2 + React) : une fenêtre transparente toujours au premier plan écoute les appels, tient une fiche vivante du prospect et souffle quoi dire. Il fonctionne avec les propres clés API de l'utilisateur, sans serveur. L'application est terminée et utilisable ; on la fait évoluer.

## Règles de travail

- **Répondre en français. Jamais d'emoji**, ni dans les réponses, ni dans le code, ni dans les commits.
- Interface et textes visibles **toujours en français**.
- Développer et pousser sur `main` (build Windows automatique). Pas de pull request sans demande.
- Messages de commit en français, sans accents ni caractères spéciaux dans la première ligne, terminés par les lignes d'attribution demandées par la session. Ne jamais citer le nom d'un modèle dans les fichiers.
- Avant de pousser : `npx tsc --noEmit -p .` puis `npm run build`. Côté Rust, `cargo check` dans `src-tauri` (sous Linux, il faut les paquets WebKitGTK).
- **Aucun secret dans le dépôt** (il est public) : pas de clé, pas de `.env`, pas d'e-mail personnel. Les captures et démos utilisent un prospect fictif.
- Respecter la **licence GPL-3.0** : C.A.P.R.I est dérivé de Pluely 0.1.9. Garder `LICENSE` et `NOTICE`.

## Environnement et limites

- L'appli n'est testée que sous **Windows**. Le cloud n'a ni écran, ni micro, ni carte graphique : le rendu WebGL et l'audio ne se testent pas là-bas. Pour les captures, utiliser Playwright (navigateur) avec les vrais composants (voir l'historique des commits, page de démo provisoire à recréer puis supprimer).
- L'utilisateur ne lance jamais de commande : GitHub Actions construit l'installeur (`.github/workflows/build.yml`), publié sur la release `capri-latest`. Compter 10 à 15 minutes par build, et vérifier le résultat après un push.
- Installeur non signé (avertissement SmartScreen normal).

## Architecture

```
src-tauri/src/
  lib.rs          démarrage, fenêtres, commandes
  window.rs       overlay, tableau de bord, position, taille
  shortcuts.rs    raccourcis globaux, affichage/masquage de l'overlay (logique spécifique Windows)
  capture.rs      captures d'écran multi-écrans et sélection de zone
  speaker/        capture du son de l'ordinateur (WASAPI sous Windows) et du micro
  cli_ia.rs       IA via des outils en ligne de commande locaux
  fichiers.rs     lecture de fichiers (connaissances)
  db/             migrations SQLite
src/
  pages/app/      overlay : onglets Demander, Écouter, Accueil (components/overlay, components/completion)
  pages/rendez-vous, knowledge, system-prompts, dev (fournisseurs), audio, screenshot, settings, shortcuts, responses, chats
  hooks/          useCompletion (questions), useSystemAudio (écoute), useSuiviRdv (copilote), useSystemPrompts...
  lib/rdv/        types et logique du copilote de rendez-vous (fiche vivante, SPIN, cartes, compte-rendu)
  lib/voix.ts     synthèse vocale (voix de Windows)
  lib/functions/  appels aux LLM et à la transcription (modèles curl configurables)
  components/fx/  orbe animée (Phosphore.tsx : shader WebGL), fonds
  config/         constantes, raccourcis par défaut, modèles LLM proposés (modeles-llm.constants.ts)
```

Deux fenêtres Tauri : `main` (overlay) et `dashboard` (tableau de bord, créé caché au démarrage). Elles ne partagent pas leur état : elles se synchronisent par `localStorage` (événement `storage`) ou par des événements Tauri.

## Choix de conception à connaître

- **Fournisseurs configurables** : un LLM ou un service de transcription est une commande curl avec variables `{{API_KEY}}`, `{{MODEL}}`, `{{TEXT}}`, `{{IMAGE}}`, `{{SYSTEM_PROMPT}}`. L'interface n'expose que les LLM ajoutés par l'utilisateur ; « Remplissage auto » propose des modèles à jour. Les noms de modèles changent souvent : vérifier la documentation du fournisseur avant de les écrire.
- **Configuration de référence** : Groq pour tout (`openai/gpt-oss-120b` pour les réponses, `qwen/qwen3.8-27b` si les images comptent, `whisper-large-v3-turbo` pour la transcription). Une seule clé suffit.
- **Un LLM sans vision** refuse une requête qui contient une image : le code renvoie alors la question sans la capture.
- **Overlay sous Windows** : l'overlay n'est jamais vraiment masqué. Un seul état côté Rust (`appliquer_masquage_windows`), les clics traversent quand il est masqué, le front reçoit l'état tel quel. Ne pas séparer ces trois éléments (cela a déjà causé un overlay visible mais non cliquable).
- **Capture de zone multi-écrans** : l'écran figé est affiché en fond de la fenêtre de sélection, les fenêtres sont placées en pixels réels et associées à l'écran par nom. Ne pas compter sur la transparence de fenêtre.
- **Voix** : voix de Windows via `speechSynthesis` (gratuit, hors ligne). La conversation vocale coupe le micro pendant la réflexion et la lecture pour éviter que l'IA s'entende ; l'interruption à la voix n'existe pas encore.
- **Effets visuels** : réglage complet, léger, aucun. Le niveau complet utilise le shader phosphore (coûteux, rendu plafonné à 320 px, pause hors écran). Le niveau léger garde l'ancien halo.
- **Affichage des réponses** : Source Serif intégrée (hors ligne), encadré « À dire » pour la phrase à prononcer, grâce à une consigne qui demande au LLM de la mettre en citation Markdown.

## Pièges rencontrés

- Un état de visibilité dupliqué entre Rust et le front désynchronise les clics de l'overlay (voir plus haut).
- Une clé API collée avec un espace ou un retour à la ligne donne « Invalid API Key » : les variables sont nettoyées avant l'envoi.
- Les anciens modèles retirés (ex. Llama 3.3 chez Groq) donnent « model_not_found ».
- Le cache Rust de GitHub Actions peut garder l'ancienne icône : le workflow nettoie la caisse de l'appli avant de compiler.
- L'icône Windows se lit depuis la première image du `.ico` : garder la taille 256 en premier.
- Windows masque le pointeur pendant la saisie par défaut (réglage système), ce n'est pas un bug de l'appli.

## Points ouverts

1. **Licence du shader phosphore** : inspiré de « Phosphor 3 » de XorDev, licence non précisée. À confirmer auprès de l'auteur, ou à remplacer par un effet écrit de zéro, avant toute large diffusion.
2. Paramètres de voix (vitesse, choix de la voix) non exposés dans l'interface.
3. Interruption de l'IA à la voix (utile avec un casque), voix en ligne plus naturelles (OpenAI, ElevenLabs) en option.
4. Pas de signature de l'installeur ni de mise à jour automatique.
5. Pas de tests automatiques sur l'interface ; seuls les scripts `test:copilote` et `banc:copilote` testent le copilote.

## Idées de fonctions

Dictée dans n'importe quelle application, mémoire des préférences de l'utilisateur, lecture de PDF glissés dans l'overlay, thème clair, tutoriel de premier lancement, connecteurs (agenda, CRM, e-mail), raccourci pour copier directement la phrase à dire.

## Reprise rapide

```
Projet C.A.P.R.I, dépôt GreatSw0rd/C.A.P.R.I, branche main.
Lis CLAUDE.md (contexte) puis README.md (produit).
Réponds en français, jamais d'emoji. Vérifie avec tsc et npm run build avant de pousser sur main.
Prochaine étape : [ce que je veux ajouter].
```
