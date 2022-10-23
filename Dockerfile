# Use latest node version 8.x
FROM node:16.14.2-alpine


# create app directory in container
RUN mkdir -p /app

# set /app directory as default working directory
WORKDIR /app

# only copy package.json initially so that `RUN yarn` layer is recreated only
# if there are changes in package.json
ADD package.json  /app/

# --pure-lockfile: Don’t generate a yarn.lock lockfile
RUN yarn install

RUN yarn add pm2 global

# copy all file from current dir to /app in container
COPY . /app/

# expose port 4040
EXPOSE 8000

# cmd to start service
CMD [ "pm2-runtime", "index.js" ]
