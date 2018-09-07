FROM daocloud.io/node:8.4.0-onbuild
COPY package*.json ./
RUN npm install -g cnpm --registry=https://registry.npm.taobao.org
RUN cnpm install
COPY . .
EXPOSE 3001
CMD [ "npm", "start", "$value1", "$value2", "$value3"]