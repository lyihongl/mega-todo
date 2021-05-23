FROM node:14.16.1

WORKDIR /app

COPY ["waitforit.sh", "package.json", "yarn.lock", "tsconfig.json", "./"]
RUN chmod u+x waitforit.sh
RUN yarn install
RUN ls
COPY ./src ./src
RUN ls
RUN yarn tsc 

EXPOSE 4000