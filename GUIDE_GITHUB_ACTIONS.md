# Guide GitHub Actions - publication du site

Ce guide explique comment automatiser la publication du site apres chaque push sur `main`.

Le site est actuellement prevu pour etre publie sur un VPS avec Docker Compose, derriere Nginx Proxy Manager. L'action GitHub ne construit pas le site elle-meme : elle se connecte au VPS, met a jour le depot, puis relance le conteneur Docker.

## Principe

1. Le code est pousse sur GitHub.
2. GitHub Actions demarre sur la branche `main`.
3. L'action se connecte au VPS en SSH.
4. Le VPS recupere la derniere version du depot.
5. Docker reconstruit l'image et redemarre le service.
6. Nginx Proxy Manager continue de rediriger le domaine vers le conteneur `gabycrolage-web:8080`.

## Prerequis cote VPS

Sur le VPS, le projet doit deja etre clone dans un dossier stable, par exemple :

```bash
/opt/gabycrolage
```

Le VPS doit avoir :

- Git
- Docker
- Docker Compose
- un acces SSH avec cle
- le fichier `.env` deja present dans le dossier du projet
- le reseau Docker externe `npm-graab` deja cree
- Nginx Proxy Manager configure vers `gabycrolage-web` sur le port `8080`

Le fichier `.env` ne doit pas etre stocke dans GitHub. Il reste uniquement sur le VPS.

## Commande de publication manuelle

Avant d'automatiser, verifier que cette commande fonctionne directement sur le VPS :

```bash
cd /opt/gabycrolage
git pull origin main
docker compose build --no-cache
docker compose up -d
```

Si cette commande fonctionne, GitHub Actions pourra faire la meme chose automatiquement.

## Secrets GitHub a creer

Dans GitHub :

`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`

Creer les secrets suivants :

| Secret | Description |
| --- | --- |
| `VPS_HOST` | Adresse IP ou nom de domaine du VPS |
| `VPS_USER` | Utilisateur SSH, par exemple `root` ou `deploy` |
| `VPS_SSH_KEY` | Cle privee SSH autorisee a se connecter au VPS |
| `VPS_PROJECT_PATH` | Chemin du projet sur le VPS, par exemple `/opt/gabycrolage` |

La cle `VPS_SSH_KEY` doit etre la cle privee complete, avec les lignes :

```text
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

La cle publique correspondante doit etre ajoutee dans `~/.ssh/authorized_keys` sur le VPS pour l'utilisateur choisi.

## Workflow GitHub Actions

Creer ce fichier dans le depot :

```text
.github/workflows/deploy.yml
```

Contenu :

```yaml
name: Deploy

on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: deploy-production
  cancel-in-progress: true

jobs:
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script_stop: true
          script: |
            cd "${{ secrets.VPS_PROJECT_PATH }}"
            git fetch origin main
            git reset --hard origin/main
            docker compose build --no-cache
            docker compose up -d
            docker image prune -f
```

## Pourquoi `git reset --hard origin/main`

Sur le VPS, le dossier de production doit refleter exactement la version publiee sur `main`.

`git reset --hard origin/main` evite les deploiements bloques par des fichiers modifies localement. Il ne faut donc pas faire de modifications manuelles dans le dossier du projet sur le VPS, sauf pour les fichiers ignores par Git comme `.env`.

## Verification apres publication

Apres un push sur `main` :

1. Ouvrir l'onglet `Actions` du depot GitHub.
2. Verifier que le workflow `Deploy` est passe au vert.
3. Ouvrir le site public.
4. Si necessaire, verifier les logs sur le VPS :

```bash
cd /opt/gabycrolage
docker compose ps
docker compose logs --tail=100 web
```

## Points d'attention

- Ne pas commiter `.env`.
- Garder `IG_ACCESS_TOKEN`, `IG_USER_ID` et les autres secrets Instagram uniquement dans le `.env` du VPS.
- Verifier que le reseau Docker `npm-graab` existe avant le premier deploiement.
- Verifier que Nginx Proxy Manager pointe bien vers `gabycrolage-web` et le port `8080`.
- Ne pas exposer directement le port `8080` sauf pour un debug local temporaire.

