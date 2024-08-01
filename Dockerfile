FROM node:22-slim

WORKDIR /app

RUN apt-get -y update

RUN apt-get -y install ca-certificates gnupg curl debian-keyring debian-archive-keyring apt-transport-https wget build-essential make gcc g++ python3 libpq-dev

RUN install -m 0755 -d /etc/apt/keyrings
RUN curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
RUN chmod a+r /etc/apt/keyrings/docker.asc
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian bookworm stable" | tee /etc/apt/sources.list.d/docker.list

RUN apt-get -y update


RUN apt-get -y install docker-ce-cli

RUN curl -sSL https://nixpacks.com/install.sh | bash

RUN npm install -g pnpm

COPY . .

RUN find . -name 'node_modules' -type d -prune -print -exec rm -rf '{}' \;

RUN pnpm install

RUN pnpm run build

EXPOSE 3000
EXPOSE 4000

ARG CHIEF_VERSION
ENV CHIEF_VERSION=$CHIEF_VERSION

CMD /app/scripts/wait-for-it.sh chief_postgres:5432 --timeout=120 -- pnpm run start