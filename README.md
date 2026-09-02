Démo en ligne:https://robot-nermine.duckdns.org/
# Simulateur de Robots Collaboratifs

Application web de simulation et de supervision de robots collaboratifs (cobots) JAKA et Universal Robots, avec infrastructure cloud complète.


## Aperçu

Ce projet permet de :
- Parcourir un catalogue de cobots (gammes JAKA et Universal Robots) avec leurs caractéristiques (portée, charge, spécificités)
- Simuler le pilotage d'un robot 6 axes via des commandes articulaires (J1-J6)
- Visualiser en temps réel la position du TCP (Tool Center Point) calculée par cinématique directe
- Superviser l'état du système via un stack de monitoring dédié

## Stack technique

**Frontend**
- React
- Rendu du robot en 3D / articulé
- Communication temps réel via WebSocket

**Backend**
- Node.js / Express
- WebSocket pour le pilotage temps réel du robot simulé

**Infrastructure & DevOps**
- Terraform pour le provisioning (VM Azure, réseau, règles de sécurité)
- Docker Compose pour l'orchestration multi-conteneurs
- Nginx en reverse proxy / serveur du frontend
- CI/CD via GitHub Actions

**Monitoring**
- Prometheus pour la collecte de métriques
- Grafana pour la visualisation
- cAdvisor pour les métriques de conteneurs

## Architecture

```
                         ┌─────────────┐
                         │   Nginx     │
                         │ (frontend)  │
                         └──────┬──────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────▼───────┐      ┌────────▼────────┐    ┌─────────▼────────┐
│  robot-backend │      │   Prometheus    │    │      Grafana      │
│ (Node/Express/ │◄─────┤                 │───►│                    │
│   WebSocket)   │      └────────┬────────┘    └────────────────────┘
└────────────────┘               │
                          ┌───────▼───────┐
                          │   cAdvisor    │
                          └───────────────┘
```

Le tout est déployé sur une VM Azure provisionnée via Terraform.

## Démarrage local

```bash
git clone <url-du-repo>
cd robot-project
docker compose up -d
```

L'application est ensuite accessible sur `http://localhost`.

### Variables d'environnement (frontend)

| Variable | Description | Défaut |
|---|---|---|
| `VITE_API_URL` | URL de l'API backend | `http://localhost:4000/api` |
| `VITE_WS_URL` | URL du WebSocket | `ws://localhost:4000/ws` |

## Déploiement

Le déploiement en production se fait sur une VM Azure, provisionnée via Terraform (`main.tf`), avec les conteneurs orchestrés par Docker Compose et le pipeline CI/CD GitHub Actions (`deploy.yml`) qui build et redéploie automatiquement à chaque push sur la branche principale.

```bash
docker compose build --no-cache
docker compose up -d
```

## Monitoring

- Prometheus scrape les métriques applicatives et système
- cAdvisor expose les métriques par conteneur
- Grafana centralise la visualisation (dashboards à documenter)

## Roadmap / Améliorations prévues

- [ ] Cinématique inverse pour un pilotage par position cible plutôt que par angle
- [ ] Limites articulaires complètes sur tous les axes (J1-J6)
- [ ] Sauvegarde et rejeu de séquences de mouvements
- [ ] Scénario de collaboration entre deux robots (handover d'objet)

## Auteur

Nermine — étudiante en Cloud Computing, École Polytechnique Internationale (EPI), Tunis
