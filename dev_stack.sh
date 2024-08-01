export $(grep -v '^#' .env | xargs) 

envsubst < docker-compose.dev.yml | docker stack deploy -c - --detach=false chief

unset $(grep -v '^#' .env | sed -E 's/(.*)=.*/\1/' | xargs)