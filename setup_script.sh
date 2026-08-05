#!/bin/bash

###
## Ensure that required parameters are passed into the script
###
if [ -n "$1" ]; then
    HOST=$1
else
    echo "[ database ] : Host not passed, set to default value (127.0.0.1)"
    HOST="127.0.0.1"
fi

###
## Specify which database to operate on, if not specified, set default to camic
###
if [ -n "$2" ]; then
    DB_NAME=$2
    echo "[ database ] : Database name set as ${DB_NAME}"
else
    echo "[ database ] : Database name not passed, set to default value (camic)"
    DB_NAME="camic"
fi

###
## Check if the system has required services installed
###
if command -v "mongo" &>/dev/null; then
    MONGO="mongo"
elif command -v "mongosh" &>/dev/null; then
    MONGO="mongosh"
else
    echo "Neither mongo nor mongosh could be found. Please ensure that MongoDB is installed and available in the PATH."
    exit 1
fi

if ! command -v "node" &>/dev/null; then
    echo "Node.js could not be found on path. Please ensure that Node.js is installed and is on PATH."
    exit 1
fi

###
# Check for the existence of required files in the caracal repository
###
echo "Checking for required files..."

if [[ ! -d ../caracal/config ]]; then
    echo "../caracal/config does not exist"
    exit 1
fi

if [[ ! -d ../caracal/jwt_keys ]]; then
    echo "../caracal/jwt_keys does not exist"
    exit 1
fi

if [[ ! -d ../caMicroscope ]]; then
    echo "../caMicroscope does not exist"
    exit 1
fi

echo "Required files exist."

echo "Copying files..."

if [[ ! -d ../config ]]; then 
    mkdir ../config
    cp -r ../caracal/config ../config/
fi

if [[ ! -d ./static ]]; then
    mkdir ./static
    cp ../caracal/config/login.html ./static/login.html
fi

if [[ ! -d ./keys/jwt_keys ]]; then
    cp -r ../caracal/jwt_keys ./keys/
fi

if [[ ! -f ./contentSecurityPolicy.json ]]; then
    cp ../caracal/config/contentSecurityPolicy.json ./contentSecurityPolicy.json
fi

if [[ ! -f ./static/additional_links.json ]]; then
    cp ../caracal/config/additional_links.json ./static/additional_links.json
fi

if [[ ! -d ./camicroscope ]]; then 
    cp -r ../caMicroscope ./camicroscope
fi

echo "Copying files complete!"

###
## Try connecting to MongoDB instance
###
until $MONGO --host "${HOST}" --eval "print(\"Connected!\")" >/dev/null; do
    sleep 2
done
echo "[ database ] : Connection established"

###
## Check if the database exists
###
QUERY="db.getMongo().getDBNames().indexOf(\"${DB_NAME}\")"
if [ $(${MONGO} --host "${HOST}" --eval "${QUERY}" --quiet) -lt 0 ]; then
    echo "[ database ] : Database does not exist"
    exit 1
else
    echo "[ database ] : Database named ${DB_NAME} found"
fi

###
## Ask developer if they wish to seed the database
###
read -p "[ resource ] : Do you wish to initialize the database with indexes and configs? (y/n) : " yn
case $yn in
[Yy]*)
    ###
    ## Download the files from GitHub and save to local directory
    ###
    echo "[ resource ] : Downloading seeding files"

    # Resource targets
    RESOURCE_IDX="https://raw.githubusercontent.com/camicroscope/Distro/master/config/mongo_idx.js"
    RESOURCE_COLLECTION="https://raw.githubusercontent.com/camicroscope/Distro/master/config/mongo_collections.js"
    RESOURCE_DEFAULT_DATA="https://raw.githubusercontent.com/camicroscope/Distro/master/config/default_data.js"

    # Get data from resource targets
    wget -q $RESOURCE_IDX -O .seeder.idx.js
    wget -q $RESOURCE_DEFAULT_DATA -O .seeder.default.js
    wget -q $RESOURCE_COLLECTION -O .seeder.collection.js

    echo "[ resource ] : Clearing old configurations"
    echo "[ resource ] : Seeding collections"
    $MONGO --quiet --host $HOST $DB_NAME .seeder.collection.js
    echo "[ resource ] : Seeding indexes"
    $MONGO --quiet --host $HOST $DB_NAME .seeder.idx.js
    echo "[ resource ] : Seeding configurations"
    $MONGO --quiet --host $HOST $DB_NAME .seeder.default.js

    ###
    ## Ask the user if they want to remove the seeding files
    ###
    read -p "[ resource ] : Do you wish to keep the seeding files generated? (y/n) :" yn
    case $yn in
    [Yy]*) echo "[ resource ] : The seeder files are present in the current directory with the name: .seeder.*.js" ;;
    [Nn]*) rm .seeder.* ;;
    *) echo "[ resource ] : Please answer y/n." ;;
    esac
    ;;
[Nn]*) echo "[ resource ] : Database initialization skipped" ;;
*) echo "[ resource ] : Skipped" ;;
esac

###
## Load the default routes.json file if it does not exist in the file system
###
if [ -f "routes.json" ]; then
    echo "[ routes   ] : routes.json file already exists"
else
    cp routes.json.example routes.json
    echo "[ routes   ] : routes.json file generated from routes.json.example"
fi

if [ -f "keys/key" ] && [ -f "keys/key.pub" ]; then
    echo "[ keys     ] : Public and private keys already exist"
else
    bash ./keys/make_key.sh
    echo "[ keys     ] : Key files generated"
fi

###
## Install the packages if not done already
###
if [ ! -d "node_modules" ]; then
    echo "[ modules  ] : Packages not installed, running: npm install"
    npm install
else
    echo "[ modules  ] : Packages directory already exists. To reinstall, delete the node_modules folder and run npm install"
fi

###
## Initialize the environment variable configs
###
if [ ! -f ".env" ]; then
    echo "[ env      ] : .env file not found"
    cp .env.example .env
else
    echo "[ env      ] : .env file already exists"
fi

echo ""
echo "If you face issues due to permissions and login handlers, setting the DISABLE_SEC to false in the .env file might help."
