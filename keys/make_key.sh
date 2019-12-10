openssl req -subj '/CN=www.camicroscope.com/O=caMicroscope Local Instance Key./C=US' -x509 -nodes -newkey rsa:2048 -keyout key -out key.pub
