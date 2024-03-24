#!/bin/bash

# Ensure required params are passed into the script
HOST="${1:-127.0.0.1}"
DB_NAME="${2:-camic}"

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &>/dev/null; then
        echo "$1 could not be found on path. Please ensure that $1 is installed and is on PATH"
        exit 1
    fi
}

# Check for required commands
check_command "mongoshsh"
check_command "node.exe"
check_command "wget"

# Function to check if a directory exists
check_directory() {
    if [ ! -d "$1" ]; then
        echo "$1 does not exist"
        exit 1
    fi
}

# Check for required directories
check_directory "../Distro/config"
check_directory "../Distro/jwt_keys"
check_directory "../caMicroscope"

echo "Required files exist."
echo "Copying files..." 

# Copy required files
mkdir -p ../config
cp -r ../Distro/config/* ../config/

mkdir -p ./static
cp ../Distro/config/login.html ./static/login.html

mkdir -p ./keys/jwt_keys
cp -r ../Distro/jwt_keys/* ./keys/jwt_keys/

cp ../Distro/config/contentSecurityPolicy.json ./contentSecurityPolicy.json
cp ../Distro/config/additional_links.json ./static/additional_links.json

cp -r ../caMicroscope/* ./camicroscope

echo "Copying files complete!"

# Try connecting to mongoDB instance
until mongosh --host "$HOST" --eval "print(\"Connected!\")" >/dev/null; do
    sleep 2
done
echo "[ database ] : connection established"

# Check if database exists
if ! mongosh "$HOST" --eval "db.getmongosh().getDBNames().indexOf(\"$DB_NAME\")" --quiet; then
    echo "[ database ] : $DB_NAME does not exist"
    exit 1
else
    echo "[ database ] : database named $DB_NAME found"
fi

# Ask user if they wish to seed the database
read -p "[ resource ] : Do you wish to initialize the database with indexes and configs? (y/n) : " yn
case $yn in
[Yy]*)
    echo "[ resource ] : downloading seeding files"

    # Resource URLs
    RESOURCE_IDX="https://raw.githubusercontent.com/camicroscope/Distro/master/config/mongo_idx.js"
    RESOURCE_COLLECTION="https://raw.githubusercontent.com/camicroscope/Distro/master/config/mongo_collections.js"
    RESOURCE_DEFAULT_DATA="https://raw.githubusercontent.com/camicroscope/Distro/master/config/default_data.js"

    # Download files
    wget -q "$RESOURCE_IDX" -O .seeder.idx.js
    wget -q "$RESOURCE_DEFAULT_DATA" -O .seeder.default.js
    wget -q "$RESOURCE_COLLECTION" -O .seeder.collection.js

    echo "[ resource ] : clearing old configurations"
    echo "[ resource ] : seeding collections"
    mongosh --quiet --host "$HOST" "$DB_NAME" .seeder.collection.js
    echo "[ resource ] : seeding indexes"
    mongosh --quiet --host "$HOST" "$DB_NAME" .seeder.idx.js
    echo "[ resource ] : seeding configurations"
    mongosh --quiet --host "$HOST" "$DB_NAME" .seeder.default.js

    # Ask the user if they want to remove the seeding files
    read -p "[ resource ] : Do you wish to keep the seeding files generated ? (y/n) :" yn
    case $yn in
    [Yy]*) echo "[ resource ] : The seeder files are present in the current directory with names: .seeder.*.js" ;;
    [Nn]*) rm .seeder.* ;;
    *) echo "[ resource ] : Please answer y/n." ;;
    esac
    ;;
[Nn]*) echo "[ resource ] : database initialization skipped" ;;
*) echo "[ resource ] : skipped" ;;
esac

# Additional setup
if [ ! -f "routes.json" ]; then
    cp routes.json.example routes.json
    echo "[ routes   ] : routes.json file generated from routes.json.example"
fi

if [ ! -f "keys/key" ] && [ ! -f "keys/key.pub" ]; then
    bash ./keys/make_key.sh
    echo "[ keys     ] : public and private keys generated"
fi

if [ ! -d "node_modules" ]; then
    echo "[ modules  ] : packages not installed, running : npm install"
    npm install
else
    echo "[ modules  ] : packages directory already exists. To reinstall, delete the node_modules folder and run npm install"
fi

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "[ env      ] : .env file generated from .env.example"
else
    echo "[ env      ] : .env file already exists"
fi

echo ""
echo "If you face issues due to permissions and login handlers, setting the DISABLE_SEC to false in .env file might help."
