#!/bin/bash

###
## ensure that required params are passed into script
###
if [ -n "$1" ]; then
    HOST=$1
else
    echo "[ database ] : name not passed, set to default value (127.0.0.1)"
    HOST="127.0.0.1"
fi

###
## specify which database to operate on, if not specified, set default to camic
###
if [ -n "$2" ]; then
    DB_NAME=$2
    echo "[ database ] : name set as ${DB_NAME}"
else
    echo "[ database ] : name not passed, set to default value (camic)"
    DB_NAME="camic"
fi

###
## check if the system has required services installed
###
if ! command -v "mongo" &>/dev/null; then
    echo "mongo could not be found on path. Please ensure that mongo is installed and is on PATH"
    exit
fi

if ! command -v "node" &>/dev/null; then
    echo "node could not be found on path. Please ensure that node is installed and is on PATH"
    exit
fi

###
## try connecting to mongodb instance
###
until mongo --host "${HOST}" --eval "print(\"Connected!\")" >/dev/null; do
    sleep 2
done
echo "[ database ] : connection established"

###
## check if database exists
###
QUERY="db.getMongo().getDBNames().indexOf(\"${DB_NAME}\")"
COMMAND="mongo ${HOST} --eval '${QUERY}' --quiet"
if [ $(mongo ${HOST} --eval ${QUERY} --quiet) -lt 0 ]; then
    echo "[ database ] : does not exist"
    exit 1
else
    echo "[ database ] : database named ${DB_NAME} found"
fi

###
## ask developer if they wish to seed the database
###
read -p "[ resource ] : Do you wish to initialize the database with indexes and configs? (y/n) : " yn
case $yn in
[Yy]*)
    ###
    ## Download the files from github and save to local directory
    ###
    echo "[ resource ] : downloading seeding files"

    # resource targets
    RESOURCE_IDX="https://raw.githubusercontent.com/camicroscope/Distro/master/config/mongo_idx.js"
    RESOURCE_COLLECTION="https://raw.githubusercontent.com/camicroscope/Distro/master/config/mongo_collections.js"
    RESOURCE_DEFAULT_DATA="https://raw.githubusercontent.com/camicroscope/Distro/master/config/default_data.js"

    # get data from resource targets
    wget -q RESOURCE_IDX -O .seeder.idx.js
    wget -q RESOURCE_DEFAULT_DATA -O .seeder.default.js
    wget -q RESOURCE_COLLECTION -O .seeder.collection.js

    echo "[ resource ] : clearing old configurations"
    echo "[ resource ] : seeding collections"
    mongo --quiet --host $HOST $DB_NAME .seeder.collection.js
    echo "[ resource ] : seeding indexes"
    mongo --quiet --host $HOST $DB_NAME .seeder.idx.js
    echo "[ resource ] : seeding configurations"
    mongo --quiet --host $HOST $DB_NAME .seeder.default.js

    ###
    ## ask the user if they want to remove the seeding files
    ###
    read -p "[ resource ] : Do you wish to keep the seeding files generated ? (y/n) :" yn
    case $yn in
    [Yy]*) echo "[ resource ] : The seeder files are present in current directory with name : .seeder.*.js" ;;
    [Nn]*) rm .seeder.* ;;
    *) echo "[ resource ] : Please answer y/n." ;;
    esac
    ;;
    ### seeder file cleanup ends here

[Nn]*) echo "[ resource ] : database initialization skipped" ;;
*) echo "[ resource ] : skipped" ;;
esac
### seeder prompt ends here

###
## load the default routes.json file if it does not exist in the file system
###
if [ -f "routes.json" ]; then
    echo "[ routes   ] : routes.json file already exists"
else
    cp routes.json.example routes.json
    echo "[ routes   ] : routes.json file generated from routes.json.example"
fi

if [ -f "keys/key" ] && [ -f "keys/key.pub" ]; then
    echo "[ keys     ] : public and private keys already exist"
else
    bash ./keys/make_key.sh
    echo "[ routes   ] : routes.json file generated from routes.json.example"
fi

###
## install the packages if not done already
###
if [ ! -d "node_modules" ]; then
    echo "[ modules  ] : packages not installed, running : npm install"
    npm install
else
    echo "[ modules  ] : packages directory already exist, to reinstall, delete the node_modules folder and run npm install"
fi

###
## initialize the environment variable configs
###
if [ ! -f ".env" ]; then
    echo "[ env      ] : .env file not found"
    cp .env.example .env
else
    echo "[ env      ] : .env file already exists"
fi

echo ""
echo "If you face issues due to permissions and login handlers, setting the DISABLE_SEC to false in .env file might help."
