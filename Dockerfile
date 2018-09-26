FROM daocloud.io/node:8.4.0-onbuild
COPY package*.json ./
RUN npm install
RUN echo "Asia/Shanghai" > /etc/timezone
RUN dpkg-reconfigure -f noninteractive tzdata
COPY . .
EXPOSE 3001
CMD [ "npm", "start", "$value1", "$value2", "$value3", "$value4"]