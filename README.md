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

## Évolutions possibles

- Synchronisation multi-postes via une base de données partagée (Supabase, Firebase…)
- Comptes utilisateurs et droits (direction / cuisine / salle)
- Statistiques avancées : food cost, ticket moyen, chiffre d'affaires
- Impression des bons de commande fournisseurs
- Application installable (PWA) et mode hors-ligne

---

*Application autonome — aucune dépendance externe.*
