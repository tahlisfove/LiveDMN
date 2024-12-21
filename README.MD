LiveDMN

Pour ce projet, nous avons principalement tenté d'utiliser le projet LiveDMN, mais nous n'avons pas réussi à le déboguer suffisamment pour le faire fonctionner et l'utiliser correctement. Nous avons donc décidé de repartir de zéro en nous inspirant de ce projet.

LiveDMN est un projet backend permettant de gérer des données provenant de fichiers CSV compressés (ZIP ou GZ). L'utilisateur peut télécharger des fichiers depuis plusieurs sources (pour cet exemple nous avons openfoodfacts, nudger et job_it), les extraire, puis randomiser les lignes de ces fichiers CSV. Les résultats sont ensuite stockés dans un fichier JSON et les logs des requêtes sont enregistrés dans une base de données SQLite pour un suivi.

Le projet a été développé pricipalement en TypeScript et utilise plusieurs bibliothèques pour la gestion des fichiers, la décompression, l'analyse CSV et la gestion de base de données.




Fonctionnalités

    Téléchargement de fichiers CSV compressés : Le système supporte les formats .zip et .gz.
    Extraction de données : Les fichiers ZIP ou GZ sont extraits pour obtenir un fichier CSV.
    Randomisation des données : Une fonctionnalité permet de choisir aléatoirement un nombre spécifique de lignes d'un fichier CSV.
    Sauvegarde des logs : Chaque requête est enregistrée dans une base de données SQLite, incluant les données extraites et le nombre de valeurs récupérées.
    
    
    
    
    
Technologies utilisées

    Node.js : Environnement d'exécution pour le backend.
    Express.js : Framework utilisé pour créer l'API.
    TypeScript : Langage utilisé pour développer le projet, permettant une meilleure gestion des types.
    Axios : Utilisé pour télécharger les fichiers depuis des URLs externes.
    PapaParse : Bibliothèque pour analyser et parser les fichiers CSV.
    Yauzl : Utilisé pour extraire des fichiers CSV des archives ZIP.
    zlib : Permet de décompresser les fichiers .gz.
    TypeORM et SQLite : Utilisés pour gérer la base de données et enregistrer les logs des requêtes.
    
    
    
    
    Installation
Prérequis

    Node.js (version >= 16)
    npm (gestionnaire de paquets)
    ( les données sont telechargé dans le dossier utilisant de gros fichiers il faut prevoir environ 25Go d'espace libre)
    

    
    
    
Démarrage du projet

Installez les dépendances nécessaires :

    npm install typescript

Compilez le code TypeScript :

    npx tsc

Démarrez le serveur backend avec la commande :

    npm run backend

Ensuite, pour l'interface utilisateur (si applicable), démarrez le frontend avec :

    npm run frontend

Accédez à l'application via http://localhost:8080/.

Routes API
1. Télécharger et extraire des fichiers

GET /download-extract?source=<source>

    Paramètres :
        source : La source des données à télécharger. Les options disponibles sont :
            openfoodfacts
            nudger
            job
    Réponse : Un lien de téléchargement pour le fichier CSV extrait.

2. Vérifier la disponibilité d'un fichier

GET /check-file?source=<source>

    Paramètres :
        source : La source des données à vérifier.
    Réponse : Retourne un objet JSON avec la clé available indiquant si le fichier est disponible dans le dossier dist.

3. Randomiser les données

POST /randomize-data

    Paramètres (dans le corps de la requête) :
        source : La source des données à randomiser (par exemple openfoodfacts, job, nudger).
        numValues : Le nombre de lignes à randomiser et à retourner.
    Réponse : Un objet JSON contenant les données randomisées.

Exemple de corps de la requête :

{
  "source": "openfoodfacts",
  "numValues": 100
}

Exemple de réponse pour la randomisation des données :

{
  "status": "RANDOMIZED",
  "data": [
    { "Barcode (EAN 13)": "1234567890123", "Country": "France" },
    { "Barcode (EAN 13)": "9876543210987", "Country": "Germany" },
    ...
  ]
}


Randomisation des données

La fonctionnalité de randomisation des données permet de sélectionner un certain nombre de lignes d'un fichier CSV téléchargé et extrait. Cependant, le choix des données à randomiser est défini en dur dans le code en raison des différences de structure des fichiers CSV pour chaque source de données.
Choix des données en fonction de la source

Pour chaque source (fichier CSV), les colonnes des données à randomiser ont été choisies spécifiquement pour correspondre à la structure du fichier CSV. Voici comment les données sont extraites pour chaque source :

    OpenFoodFacts :
        Barcode (EAN 13) : Le code-barres des produits (colonne code).
        Country : Le pays d'origine du produit (colonne countries_en).

    Job :
        Job Title : Le titre du poste (colonne job_title).
        Salary (USD) : Le salaire associé au poste (colonne salary_in_usd).

    Nudger :
        GTIN : Le numéro global d'article commercial (colonne gtin).
        Country : Le pays d'origine du produit (colonne gs1_country).

Log des requêtes

Les logs des requêtes sont automatiquement sauvegardés dans la base de données SQLite. Chaque log contient :

    source : La source du fichier CSV (par exemple openfoodfacts).
    numValues : Le nombre de lignes randomisées.
    extractedData : Les données extraites et randomisées sous format JSON.
    requestTime : L'heure et la date de la requête.

Exemple d'une entrée dans la base de données :

{
  "source": "openfoodfacts",
  "numValues": 100,
  "extractedData": "[{...}, {...}, ...]",
  "requestTime": "2024-12-20T15:30:00Z"
}

Base de données

Le projet utilise SQLite pour stocker les logs des requêtes effectuées. Lors du démarrage du serveur, la base de données est automatiquement initialisée, et les logs des requêtes sont sauvegardés à chaque appel API de randomisation des données.


Limitations et Améliorations
Limitations

L'approche actuelle nécessite une structure fixe pour chaque fichier CSV. Si cette structure change, le code devra être modifié manuellement pour s'adapter. Cela limite la flexibilité du projet.
Améliorations

    Flexibilité des fichiers CSV : Automatiser la détection des colonnes à randomiser pour supporter des formats de fichiers CSV variés.
    Refactorisation Backend : Séparer le fichier principal en modules plus petits pour améliorer la maintenabilité.
    Migration Frontend vers TypeScript : Compléter la migration vers TypeScript pour une meilleure cohérence et robustesse du code.
