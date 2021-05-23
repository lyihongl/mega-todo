FROM node:14.16.1

WORKDIR /app

COPY ["package.json", "package-lock.json", "tsconfig.json", "./"]
RUN npm install
RUN ls
COPY ./src ./src
COPY ./public ./public
RUN npm install -g serve
RUN npm run build

EXPOSE 3000

RUN ls
CMD ["serve", "-s", "./build",  "-l", "3000"]