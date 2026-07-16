# 🍷 Jéroboam 120 — Gestion de restaurant

Application web pour aider la direction d'un restaurant à tout piloter au
quotidien. **Aucune installation ni serveur nécessaire** : il suffit d'ouvrir
`index.html` dans un navigateur. Les données sont enregistrées localement dans
le navigateur (localStorage), avec export / import pour sauvegarder ou
transférer sur un autre poste.

## Modules inclus

| # | Module | Description |
|---|--------|-------------|
| 18 | **Tableau de bord** | Vue d'ensemble : alertes, plats du jour, équipe, checklists, consignes |
| 5 | **Stocks** | Inventaire des produits avec quantités et unités |
| 6 | **Alertes de réappro** | Signalement automatique dès qu'un produit passe sous son seuil |
| 7 | **Fournisseurs** | Contacts, catégories, délais de livraison, notes |
| 10 | **Cave / Vins** | Bouteilles, millésimes, emplacements, valeur du stock |
| 11 | **Planning équipe** | Services sur 7 jours par employé et par poste |
| 22 | **Menu du jour** | La cuisine écrit le menu (entrées, plats, desserts, suggestions) — visible par toute l'équipe |
| 23 | **Salle ↔ Cuisine** | Messages, signalements et plats épuisés en temps réel |
| 27 | **Checklists** | Ouverture / fermeture, avec suivi de progression |
| 30 | **Notes & consignes** | Le cahier de liaison numérique de l'équipe |

## Utilisation

1. Ouvrez `index.html` dans un navigateur récent (Chrome, Edge, Safari, Firefox).
   - Fonctionne sur ordinateur, tablette et mobile (interface responsive).
2. L'application démarre avec des **données d'exemple** pour se repérer.
   Modifiez, ajoutez ou supprimez librement — tout est sauvegardé au fil de l'eau.
3. **Sauvegarde** : bouton « ⬇︎ Exporter » (en bas du menu) → fichier `.json`.
   **Restauration / transfert** : bouton « ⬆︎ Importer ».

> ℹ️ Les données étant stockées dans le navigateur, elles restent sur le poste
> utilisé. Pour partager les mêmes données entre plusieurs postes, exportez
> depuis l'un et importez sur l'autre, ou envisagez une évolution avec base de
> données partagée (voir ci-dessous).

## Structure du projet

```
index.html          Page principale (structure + navigation)
assets/styles.css   Feuille de styles
assets/app.js       Logique de l'application (données, vues, modules)
```

## 📱 Applications mobiles (App Store & Play Store)

L'app est empaquetée avec **[Capacitor](https://capacitorjs.com/)** : la même
base web tourne dans une vraie app native **iOS** et **Android**, publiable sur
les stores. Le code web reste à la racine (l'app s'ouvre toujours dans un
navigateur) ; `www/` en est une copie générée automatiquement.

### Prérequis

| | Android | iOS |
|---|---|---|
| Outil | Android Studio | Xcode (**Mac obligatoire**) + [CocoaPods](https://cocoapods.org/) |
| Compte | Google Play — **25 $** une fois | Apple Developer — **99 $/an** |

### Mise en route

```bash
npm install                 # dépendances Capacitor
npm run build               # copie le web vers www/ puis « cap sync »
```

**Android :**
```bash
npm run open:android        # ouvre le projet dans Android Studio
```
Puis dans Android Studio : *Build → Generate Signed Bundle / APK* → `.aab` à
téléverser sur la [Play Console](https://play.google.com/console).

**iOS (sur Mac) :**
```bash
cd ios/App && pod install && cd ../..   # 1re fois : installe les pods
npm run open:ios                        # ouvre le projet dans Xcode
```
Puis dans Xcode : régler *Signing & Team*, *Bundle Identifier*
(`com.jeroboam120.app`), puis *Product → Archive* → *Distribute App* vers
App Store Connect.

### Après chaque modif du web

```bash
npm run build   # resynchronise www/ → android/ + ios/
```

### Icônes

Générées par `node scripts/gen-icons.mjs` depuis `assets/icon-512.png` (logo 🍷
sur fond bordeaux). Relancer ce script après avoir changé l'icône source.

> ℹ️ Les notifications push utilisent aujourd'hui le service worker web (PWA).
> Pour de vraies notifications natives en app, ajouter le plugin
> `@capacitor/push-notifications` (évolution).

## Évolutions possibles

- Synchronisation multi-postes via une base de données partagée (Supabase, Firebase…)
- Comptes utilisateurs et droits (direction / cuisine / salle)
- Statistiques avancées : food cost, ticket moyen, chiffre d'affaires
- Impression des bons de commande fournisseurs
- Application installable (PWA) et mode hors-ligne

---

*Application autonome — aucune dépendance externe.*
