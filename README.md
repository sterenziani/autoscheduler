# AutoScheduler
El buscador automático de cronogramas.

# Guía de instalación
## Clonar el repositorio
Descargue el repositorio y acceda al directorio raíz del mismo a través de una terminal.
`git clone git@bitbucket.org:itba/pf-2022-auto-scheduler-cuatrimestral.git`

## Configurar variables de entorno
Cree los siguientes archivos y configure las variables de entorno para cada servicio:
> */.env.mongo*

    MONGO_INITDB_ROOT_USERNAME={{mongo_user}}
    MONGO_INITDB_ROOT_PASSWORD={{mongo_password}}
> */.env.neo4j*

    NEO4J_AUTH={{neo4j_user}}/{{neo4j_password}}
    NEO4J_PLUGINS=["apoc"]
>  *back/.env*

    ## Port where API listens
    PORT=8080

    # Authentication Related
    AUTH_TOKEN_KEY="-----BEGIN RSA PRIVATE KEY-----{{private_key}}-----END RSA PRIVATE KEY-----"
    AUTH_TOKEN_PUB_KEY="-----BEGIN PUBLIC KEY-----{{public_key}}-----END PUBLIC KEY-----"
    AUTH_TOKEN_EXPIRE_TIME='365d'


    # Email Authentication Related
    COMPANY_EMAIL={{email_address}}
    COMPANY_EMAIL_PASS={{email_app_password}}
    FRONT_URL='http://localhost:8080'
    EMAIL_VERIFICATION_ADDRESS='administrator@autoscheduler.com'

    #Neo4J Authentication
    MONGO_USER={{mongo_user}}
    MONGO_PASSWORD={{mongo_password}}
    NEO4J_USER={{neo4j_user}}
    NEO4J_PASSWORD={{neo4j_password}}
    MONGO_HOST=localhost
    MONGO_PORT=27017
    NEO4J_HOST=localhost
    NEO4J_PORT=7687


    #General Algorithm Parameters
    ALGORITHM=AUTO | COURSE_GREEDY | TIME_GREEDY | GENETIC
    ALGORITHM_AUTO_MODE_MAX_COMBINATIONS_THRESHOLD=100000000        # Amount to switch from COURSE_GREEDY to TIME_GREEDY

    ALGORITHM_MAX_SCHEDULES_TO_PROCESS=500000000                    # Break condition
    ALGORITHM_MAX_MS_DEADLINE_TO_PROCESS=2500                       # Break condition
    ALGORITHM_MAX_AMOUNT_TO_RETURN=25                               # Returns up to these many schedules after execution

    # Multipliers from Schedule Score formula
    ALGORITHM_SCORE_P1_MULT=10
    ALGORITHM_SCORE_P2_MULT=1.25
    ALGORITHM_SCORE_P3_MULT=3.5
    ALGORITHM_SCORE_P4_MULT=1

    # COURSE_GREEDY (Base / Pruning) Algorithm Parameters
    ALGORITHM_GREEDY_PRUNING=true                                    # Enables pruning on base algorithm
    ALGORITHM_SHUFFLE_COURSES=false                                  # Shuffles order of courses before running algorithm
    ALGORITHM_SHUFFLE_FIXED_INDEXES=3                                # If shuffling, keep the first N courses in their position
    ALGORITHM_TARGET_HOUR_EXCEED_RATE_LIMIT=1.25                     # Break condition if schedule exceeds (target hours * this)
    ALGORITHM_MIN_AMOUNT_OF_SCHEDULES_TO_PRUNE_BY_AVG=10             # Requirement to prune a branch
    ALGORITHM_MIN_AMOUNT_OF_PROCESSED_COURSES_TO_PRUNE_BY_AVG=5      # Requirement to prune a branch
    ALGORITHM_MIN_HOURS_TO_PRUNE_BY_AVG=3                            # Requirement to prune a branch

    # TIME_GREEDY Algorithm Parameters
    ALGORITHM_GREEDY_STEP_PICK=5

    # GENETIC Algorithm Parameters
    ALGORITHM_BEST_PICKED_FROM_EACH_GENERATION=10
    ALGORITHM_GENETIC_GENERATION_SIZE=50
    ALGORITHM_GENERATIONS=2500

> Dentro de *compose.yaml* (Lineas 26-27)

    API_URL='http://localhost:3000/api'                             # Host and port where API is running
    VERIFICATION_EMAIL='administrator@autoscheduler.com'            # Verification email to display on University sign-up page

## Iniciar contenedores
Desde la raíz del repositorio, ejecute `docker compose up`

## Crear cuenta de administrador
Para crear una cuenta con permisos de administrador, debe crear manualmente un usuario en Mongo con el rol `ADMIN`, siguiendo el formato de documento de otros usuarios ya registrados.

# Tip
Para popular la base de datos de Neo4J con datos parciales del ITBA, puede utilizar el archivo `neo4j.dump` disponible en la carpeta `utils` o modificar los IDs en el script `setup-db` y ejecutarlo para realizar llamados a la API para popular la base de datos paso por paso.