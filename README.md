# MotionPrompter

Atelier personnel de motion design, en PWA installable (Mac, iPhone, Android) :

1. **Apprendre** : 46 termes de motion design, chacun avec une démo animée en code (rejouer, vitesse, paramètres réels), la formulation exacte à écrire dans un prompt, des favoris et un quiz de reconnaissance avec révision espacée.
2. **Atelier** : un directeur artistique IA qui pose les questions du brief une à une, challenge l’idée et propose 3 directions créatives. Le panneau Brief se remplit tout seul et reste modifiable.
3. **Styles** : une bibliothèque de styles réutilisables (palette, typo, effets, rythme, easing, interdits), avec le style préchargé « Template 1 blanc » et l’import depuis une description libre.
4. **Générer** : le prompt final pour Claude, toujours en 7 sections, avec un éditeur, une checklist qualité, des versions par format, un export .md et un « Retour de rendu » qui produit un prompt de correction ciblé.
5. **Projets & Réglages** : historique, recherche, duplication, notes, export/import JSON, choix du moteur IA, thème et taille du texte.

Tout est stocké en local (IndexedDB via Dexie). Rien n’est envoyé ailleurs que vers le moteur IA choisi.

---

## Installation et lancement

Prérequis : **Node.js 18 ou plus** (20 ou 22 recommandé).

```bash
npm install
npm run dev
```

Ouvre ensuite http://localhost:5173.

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement (localhost:5173) |
| `npm run dev:lan` | Idem, accessible depuis le téléphone sur le même Wi-Fi |
| `npm run typecheck` | Vérification TypeScript stricte |
| `npm run build` | Typecheck + build PWA de production dans `dist/` |
| `npm run preview` | Sert le build de production (localhost:4173) |
| `npm run preview:lan` | Idem, accessible sur le réseau local |
| `npm run icons` | Régénère les icônes PNG (script Node sans dépendance) |
| `npm run cap:add:android` | Crée le projet Android Capacitor (une seule fois) |
| `npm run cap:sync` | Build + copie dans le projet Android |
| `npm run apk:debug` | Build + sync + génère l’APK debug (macOS/Linux) |
| `npm run apk:debug:win` | Idem sous Windows |

## Build PWA

```bash
npm run build
npm run preview
```

Le dossier `dist/` contient l’app, le `manifest.webmanifest` et le service worker (Workbox, mise à jour automatique). Après une première visite, l’onglet **Apprendre**, les **Styles**, les **Projets** (historique) et le générateur par gabarit fonctionnent **hors ligne**.

Pour l’héberger gratuitement : dépose `dist/` sur Netlify, Vercel, Cloudflare Pages ou GitHub Pages (HTTPS obligatoire pour le service worker hors `localhost`). Les chemins sont relatifs (`base: './'`), donc un sous-dossier fonctionne aussi.

## Déploiement automatique (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` build l’app et la publie en HTTPS à chaque push sur `main` :

**https://mateoo992.github.io/motion-design-app/**

À faire une seule fois sur GitHub : **Settings › Pages › Build and deployment › Source : GitHub Actions**. Ensuite, chaque modification fusionnée dans `main` est en ligne en une à deux minutes (suivi dans l’onglet **Actions**). Le workflow peut aussi être relancé à la main (**Actions › Déployer sur GitHub Pages › Run workflow**).

## Installer l’app

### Mac (Chrome, Edge ou Safari 17+)
1. Ouvre l’URL de l’app (en local : `npm run preview` puis http://localhost:4173).
2. Chrome/Edge : icône « Installer » dans la barre d’adresse. Safari : menu **Fichier › Ajouter au Dock**.

### iPhone (Safari)
1. Ouvre **https://mateoo992.github.io/motion-design-app/** dans **Safari** (voir « Déploiement automatique »).
2. Bouton **Partager** › **Sur l’écran d’accueil** › **Ajouter**.
3. L’app s’ouvre en plein écran, avec ses données locales sur le téléphone.

Pour tester sans hébergement : `npm run dev:lan` sur le Mac puis ouvre `http://IP-DU-MAC:5173` dans Safari. L’ajout à l’écran d’accueil fonctionne, mais sans service worker (donc sans mode hors ligne), car iOS l’exige en HTTPS.

### Android (Chrome)
- **PWA** : ouvre l’URL HTTPS dans Chrome › menu ⋮ › **Installer l’application**.
- **APK** : voir ci-dessous.

## Générer l’APK Android (debug)

Prérequis : **Android Studio** (il fournit le SDK Android et un JDK 17). Définis `ANDROID_HOME` si Gradle ne trouve pas le SDK (sur Mac : `export ANDROID_HOME=$HOME/Library/Android/sdk`).

```bash
npm install
npm run cap:add:android      # une seule fois : crée le dossier android/
npm run apk:debug            # macOS / Linux
# ou : npm run apk:debug:win  (Windows)
```

L’APK est généré dans :

```
android/app/build/outputs/apk/debug/app-debug.apk
```

Installe-le avec `adb install android/app/build/outputs/apk/debug/app-debug.apk`, ou copie le fichier sur le téléphone (autorise « Sources inconnues »). Pour ouvrir le projet dans Android Studio : `npm run cap:open`.

`capacitor.config.ts` autorise le trafic HTTP en clair (`cleartext`, `allowMixedContent`) pour joindre Ollama sur le réseau local depuis l’APK.

## Configurer le moteur IA (onglet Projets › Réglages)

### 1. Claude API (Anthropic)
1. Crée une clé sur https://console.anthropic.com (API Keys).
2. Réglages › **Claude (API)** › colle la clé. **La clé reste sur cet appareil** : elle est stockée dans IndexedDB, envoyée uniquement à `api.anthropic.com` et jamais incluse dans les exports.
3. Modèle : liste déroulante ou saisie libre. Valeur par défaut : `claude-sonnet-5-5`.

L’app appelle l’API directement depuis le navigateur avec l’en-tête `anthropic-dangerous-direct-browser-access: true`, en streaming. Les erreurs gérées : clé manquante ou refusée, modèle introuvable, limite de requêtes, surcharge, réseau coupé, annulation (bouton Arrêter), conversation trop longue (l’historique le plus ancien est retiré automatiquement et l’app te prévient).

### 2. Ollama (local)
1. Installe Ollama (https://ollama.com) puis un modèle : `ollama pull llama3.1` (un modèle de 8B ou plus est conseillé, en français `mistral-small` ou `qwen2.5` donnent de bons résultats).
2. **Autorise l’app à appeler Ollama (CORS)** avec `OLLAMA_ORIGINS` :
   - macOS (app Ollama) :
     ```bash
     launchctl setenv OLLAMA_ORIGINS "*"
     launchctl setenv OLLAMA_HOST "0.0.0.0"
     ```
     puis quitte et relance l’app Ollama.
   - macOS/Linux en ligne de commande :
     ```bash
     OLLAMA_ORIGINS="*" OLLAMA_HOST=0.0.0.0 ollama serve
     ```
   - Windows (PowerShell) : `setx OLLAMA_ORIGINS "*"` et `setx OLLAMA_HOST "0.0.0.0"`, puis redémarre Ollama.
   - Pour être plus strict que `*`, liste les origines : `OLLAMA_ORIGINS="http://localhost:5173,http://localhost:4173,http://192.168.1.20:5173,capacitor://localhost,https://localhost"`.
3. Réglages › **Ollama (local)** › URL `http://localhost:11434` › **Actualiser la liste** (lit `/api/tags`) › choisis le modèle.

**Depuis le téléphone (réseau local)** :
1. `OLLAMA_HOST=0.0.0.0` (voir ci-dessus) pour qu’Ollama écoute sur le réseau, pas seulement sur le Mac.
2. Trouve l’IP du Mac : `ipconfig getifaddr en0` (ex. `192.168.1.20`).
3. Lance l’app en LAN : `npm run dev:lan` (ou `npm run preview:lan`) et ouvre `http://192.168.1.20:5173` sur le téléphone.
4. Dans Réglages, mets l’URL Ollama `http://192.168.1.20:11434`.
5. Limite : une app servie en **HTTPS** (PWA hébergée) ne peut pas appeler un Ollama en **HTTP** (contenu mixte bloqué par le navigateur). Utilise alors l’app en HTTP sur le réseau local, l’APK Android, ou un tunnel HTTPS vers Ollama.

### 3. Mode hors ligne
Aucun appel réseau. Apprendre, Styles et Projets fonctionnent normalement ; l’Atelier pose les questions du brief sans IA ; Générer produit le prompt **par gabarit** à partir du brief et du style (avec les paramètres réels des effets du glossaire) ; « Rendre plus précis », « Raccourcir », les versions par format et le « Retour de rendu » fonctionnent aussi, par règles.

## Structure du projet

```
src/
  main.tsx, App.tsx, index.css   point d’entrée, coquille, thème (clair/sombre, glass)
  types.ts                       types partagés
  db/db.ts                       Dexie : projects, styles, favorites, quiz, settings
  store/                         Zustand : settings, project (projet courant), ui
  providers/                     interface Provider.generate(messages, options) + claude, ollama, offline
  prompts/                       prompts système (directeur artistique, prompt final, import de style,
                                 correcteur de rendu) + gabarit hors ligne
  glossary/                      46 termes et leurs démos (kit Web Animations API + Canvas)
  components/                    Layout, DemoPlayer, TermDrawer, RichText (termes cliquables), BriefPanel, ui
  screens/                       Learn, Atelier, Styles, Generate, Projects (+ Réglages)
  lib/                           brief, quiz, qualité du prompt, sauvegarde, utilitaires
scripts/generate-icons.mjs       icônes PNG générées sans dépendance
```

## Hypothèses prises

- **Hébergement** : GitHub Pages via GitHub Actions, sur le dépôt `mateoo992/motion-design-app`. La base Vite reste relative (`base: './'`) : elle fonctionne sous `/motion-design-app/`, reste valable si le dépôt est renommé, et c’est aussi ce qu’exige Capacitor pour l’APK. GitHub Pages gratuit demande un dépôt **public** ; la clé API n’est jamais dans le code (elle reste dans le navigateur de chaque appareil).
- **Style de l’interface** : police système (avec Figtree si elle est installée) pour rester 100 % hors ligne, sans police téléchargée.
- **Pas de routeur** : la navigation entre les 5 onglets est un état Zustand ; c’est plus simple et robuste en PWA et dans Capacitor.
- **Onglet 5** : « Projets » et « Réglages » partagent un onglet avec un sélecteur en haut.
- **Moteur par défaut** : mode hors ligne au premier lancement (aucune clé requise pour découvrir l’app).
- **Brief automatique** : le directeur artistique ajoute à chaque réponse un bloc invisible `<brief>{…}</brief>` que l’app lit pour remplir le panneau. Un champ modifié à la main est **verrouillé** (icône cadenas) et l’IA ne l’écrase plus ; un clic sur le cadenas le déverrouille.
- **Brief « complet »** pour générer : objectif, cible, plateforme, format, durée, message, CTA, ton, et au moins une scène avec début/fin, texte et effet. Les références et textes à l’écran sont facultatifs.
- **Atelier hors ligne** : questions scriptées dans le même ordre que l’IA ; le format est déduit de la plateforme (TikTok/Reels → 9:16, LinkedIn/fil → 4:5, YouTube/web → 16:9, sinon 1:1).
- **Limite de contexte** : estimation à ~3,5 caractères par token ; budget de 120 000 tokens pour Claude et 8 192 tokens de contexte pour Ollama ; au-delà, les plus anciens messages sont retirés.
- **Liste des modèles Claude** : identifiants de la famille Claude 5 au moment de l’écriture ; le champ libre permet d’en saisir un autre.
- **Export JSON** : contient projets, styles, favoris, progression du quiz et préférences, **sans la clé API**. L’import fusionne (même identifiant = remplacé).
- **Quiz** : système de Leitner à 5 boîtes (1 min, 10 min, 1 j, 3 j, 7 j) ; les mauvaises réponses proposées viennent en priorité de la même catégorie.
- **Démos** : certaines valeurs sont exagérées pour être visibles (ex. grain à 20 % au lieu de 6 %), c’est indiqué dans les paramètres. Les démos ignorent volontairement `prefers-reduced-motion`, le reste de l’interface le respecte.
- **Spring** : la WAAPI n’a pas d’easing ressort natif ; la courbe est simulée physiquement puis échantillonnée en keyframes.
- **Formats** : 9:16 = 1080×1920, 4:5 = 1080×1350, 1:1 = 1080×1080, 16:9 = 1920×1080 ; safe zones 9:16 = 250 px en haut, 380 px en bas, 160 px à droite.
- **Versions de prompt** : chaque génération, réécriture ou correction crée une version ; la version active est modifiable directement dans l’éditeur.

## 5 pistes d’amélioration

1. **Aperçu intégré** : coller le HTML renvoyé par Claude dans un iframe sandboxé pour prévisualiser et enregistrer la vidéo directement dans l’app (MediaRecorder + captureStream).
2. **Synchronisation chiffrée** entre Mac et iPhone (ex. fichier chiffré sur iCloud Drive / Google Drive ou CRDT via un petit serveur), pour retrouver les projets partout.
3. **Proxy optionnel** (Cloudflare Worker) pour ne pas exposer la clé Claude dans le navigateur quand l’app est partagée avec Mathis et Lucas.
4. **Timeline visuelle** dans le brief : glisser-déposer les scènes sur une piste temporelle, avec aperçu des effets du glossaire sur le vrai texte de la scène.
5. **Bibliothèque de résultats** : sauvegarder les rendus réussis (HTML + capture) avec leurs prompts, et un mode « few-shot » qui injecte les meilleurs exemples dans le générateur.
