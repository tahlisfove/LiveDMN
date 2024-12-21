# LiveDMN

LiveDMN est un projet backend permettant de gérer des données provenant de fichiers CSV compressés (ZIP ou GZ). L'objectif est de permettre à un utilisateur de télécharger des fichiers à partir de différentes sources, de les extraire, de randomiser les lignes, et de sauvegarder les résultats. Les logs des requêtes sont également enregistrés dans une base de données PostgreSQL pour un suivi complet.

<br>

## Fonctionnalités

### Fonctionnalités principales
- **Téléchargement de fichiers CSV compressés** : Supporte les formats `.zip` et `.gz`.
- **Extraction des fichiers CSV** : Extraction des fichiers compressés pour obtenir un fichier CSV.
- **Randomisation des données** : Sélection aléatoire d'un nombre donné de lignes dans un fichier CSV.
- **Sauvegarde des logs** : Enregistrement des requêtes dans une base de données PostgreSQL.

<br>

## Technologies utilisées

- **Node.js** : Environnement d'exécution pour le backend.
- **Express.js** : Framework utilisé pour créer l'API.
- **TypeScript** : Langage pour une meilleure gestion des types et de la robustesse du code.
- **Axios** : Pour le téléchargement de fichiers depuis des URLs externes.
- **PapaParse** : Bibliothèque pour l'analyse et le parsing des fichiers CSV.
- **Yauzl** : Utilisé pour extraire les fichiers CSV des archives ZIP.
- **zlib** : Permet de décompresser les fichiers GZ`.
- **TypeORM** et **PostgreSQL** : Gestion des bases de données et des logs.

<br>

## 0. Prérequis

Avant de commencer, vous aurez besoin de :

1. **Node.js** (version >= 16)
2. **npm** (gestionnaire de paquets)
3. **PostgreSQL** (installé et configuré)
4. **Espace disque suffisant** : (25 Go pour les fichiers)

<br>

## Installation et démarrage

### 1. Cloner le projet

    git clone https://github.com/votre-utilisateur/LiveDMN
    cd ~/LiveDMN

### 2. Installer les dépendances

    npm install typescript

### 3. Compiler le projet TypeScript

    npx tsc

### 4. Démarrer le backend (dans un premier terminal)

    npm run backend

### 5. Démarrer le frontend (dans un second terminal)

    npm run frontend

### 7. Accédez à l'application

    http://localhost:8080/LiveDMN.html

<br><br>

## 1. Arborescence du projet

├── css/<br>
│   └── style.css<br>
│<br>
├── img/<br>
│   ├── favicon.png<br>
│   └── ...<br>
│<br>
├── ts/<br>
│   ├── backend/<br>
│   │   ├── entities/<br>
│   │   │   └── RequestLog.ts<br>
│   │   ├── data-source.ts<br>
│   │   ├── gzFileHandler.ts<br>
│   │   ├── randomiser.ts<br>
│   │   ├── server.ts<br>
│   │   ├── utils.ts<br>
│   │   └── zipFileHandler.ts<br>
│   └── frontend/<br>
│       └── main.ts<br>
│<br>
├── LiveDMN.html<br>
├── package.json<br>
├── package-lock.json<br>
├── tsconfig.json<br>
└── README.md<br>

<br><br>

## 2. Endpoints disponibles

### 1. Télécharger et extraire des fichiers

- **Route** : `GET /download-extract?source=<source>`

#### Paramètres :
| Nom      | Type   | Description                                  |
|----------|--------|----------------------------------------------|
| `source` | String | La source des données à télécharger. 

#### Réponse :  
Un lien de téléchargement pour le fichier CSV extrait.

<br>

### 2. Vérifier la disponibilité d'un fichier

- **Route** : `GET /check-file?source=<source>`

#### Paramètres :
| Nom      | Type   | Description                                  |
|----------|--------|----------------------------------------------|
| `source` | String | La source des données à vérifier.            |

#### Réponse :  
Un objet JSON indiquant si le fichier est disponible dans le dossier `dist`.  

<br>

### 3. Randomiser les données

- **Route** : `POST /randomize-data`

#### Paramètres :
| Nom         | Type   | Description                                                       |
|-------------|--------|-------------------------------------------------------------------|
| `source`    | String | La source du fichier à randomiser (`openfoodfacts`, `job`, ...).  |
| `numValues` | Number | Le nombre de lignes à sélectionner aléatoirement.                 |

#### Exemple de requête :

    {
      "source": "openfoodfacts",
      "numValues": 100
    }

#### Réponse :

    {
      "status": "RANDOMIZED",
      "data": [
        { "Barcode (EAN 13)": "1234567890123", "Country": "France" },
        { "Barcode (EAN 13)": "9876543210987", "Country": "Germany" }
      ]
    }

<br><br>

## 3. Sauvegarde des logs

Les logs des requêtes sont automatiquement enregistrés dans une base de données PostgreSQL. Chaque log inclut les informations suivantes :

- **`source`** : La source du fichier CSV (`openfoodfacts`, `job`, ou `nudger`).
- **`numValues`** : Le nombre de lignes randomisées.
- **`extractedData`** : Les données randomisées au format JSON.
- **`requestTime`** : Date et heure de la requête.

#### Exemple d'enregistrement dans la base de données :

    {
      "source": "openfoodfacts",
      "numValues": 100,
      "extractedData": [
        { "Barcode (EAN 13)": "1234567890123", "Country": "France" },
        { "Barcode (EAN 13)": "9876543210987", "Country": "Germany" }
        ...
      ],
      "requestTime": "2024-12-21T08:00:00Z"
    }

<br><br>

## 4. Accès à la base de données

Vous pouvez accéder à la base de données PostgreSQL utilisée pour enregistrer les logs des requêtes. Voici les étapes pour vous connecter et interroger la base de données :

### Étapes pour accéder à la base de données

1. Ouvrez un terminal.
2. Exécutez la commande suivante pour vous connecter à la base de données

        psql -h localhost -U postgres -d request

3. Lors de la connexion, il vous sera demandé de saisir le mot de passe. Le mot de passe est : password
4. Une fois connecté, vous pouvez exécuter des requêtes SQL. Par exemple :

        SELECT * FROM request_log;

#### Exemple de requête :
| id  | source        | numValues | extractedData                        | requestTime            |
| --- | ------------- | --------- | ------------------------------------ | ---------------------- |
| 1   | openfoodfacts | 100       | `[{"key":"value"}...]`               | 2024-12-21 10:00:00+00 |
| 2   | job           | 50        | `[{"key":"value"}...]`               |                        |

<br><br>

## 4. Test du système



<br><br>

## 5. Limitations et Améliorations

### Limitations

- **Structure fixe des fichiers CSV** :  
  L'approche actuelle repose sur une structure prédéfinie pour chaque fichier CSV. Si cette structure change, le code devra être modifié manuellement pour s'adapter. Cela limite la flexibilité et l'évolutivité du projet.

### Améliorations

- **Flexibilité des fichiers CSV** :  
  Une amélioration majeure serait d'automatiser la détection des colonnes à randomiser. Cela permettrait de supporter une plus grande variété de formats de fichiers CSV sans nécessiter d'intervention manuelle.

<br><br>

## 6. Auteur

Projet développé par Christoph Samuel.

- **Email** : gdtsamuelchrist@gmail.com 
- **GitHub** : https://github.com/tahlisfove
