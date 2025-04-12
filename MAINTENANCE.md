# For workshop facilitators

## Deploying

This is deployed to meminator.honeydemo.io in the SA Demo k8s cluster.
The yaml for this is in the honeycombio/demo repo (private).

To deploy,

- log in to Docker as o11yday user
- update the IMAGE_VERSION in .env
- update the HONEYCOMB_API_KEY to an ingest key for demo/meminator environment - this gets built into the web image
- run `scripts/publish-honeydemo.sh`
- check that something was indeed pushed to Dockerhub
- log in to AWS
- go to the demo repo, meminator directory
- run the update script there.

## Structure of the Application

Check `docker-compose.yaml` to see the different services.

Most of them are available in multiple languages.

### web

The frontend is static files in `services/web/static`

The `services/web` directory also contains a Dockerfile and config for nginx to serve these. The nginx config also directs anything to /backend toward the backend-for-frontend service.

This one is not multi-language. Sorry, the browser runs JS.

### backend-for-frontend

this one receives /createPicture (which the client sends as /backend/createPicture; nginx strips the prefix)
and it calls out to the other services.

### image-picker

the images are in my (devrel sandbox's) S3 bucket, 'random-pictures'.
They really could be anywhere. The service has a hard-coded list.

### phrase-picker

Easiest one. hard-coded list of phrases.

### meminator

This one will always be in a Docker container, because it has 'imagemagick' installed, and a font, and a jpg library.

It downloads the image to the local filesystem, then runs imagemagick to overlay the text, then returns the result (as binary image data).

It throws files in /tmp, which it never cleans out.

## Publishing images to attempt to make Advanced Instrumentation loading faster

(I don't think this really works)

To get new versions of the containers on Dockerhub for caching, log in appropriately.

Be logged in to Docker as [o11yday](https://hub.docker.com/u/o11yday). This is in 1Password somewhere.

Run `scripts/publish.sh`
