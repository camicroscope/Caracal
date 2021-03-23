#!/usr/bin/env bash

# to generate keys only in the /keys directory.
PWD="$(dirname "$0")"

openssl req -subj '/CN=www.camicroscope.com/O=caMicroscope Local Instance Key./C=US' -x509 -nodes -newkey rsa:2048 -keyout $PWD/key -out $PWD/key.pub
