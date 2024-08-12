ARG NODE_VERSION=8.10
FROM node:${NODE_VERSION}
ARG NODE_ENV=production
ENV PORT=3000 NODE_ENV=${NODE_ENV}
# Создаем директорию для приложения
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package.json /usr/src/app/

# Устанавливаем зависимости
RUN npm install

# Копируем все остальные файлы в рабочую директорию
COPY . /usr/src/app
# Создаем папку temp
RUN mkdir temp

# Открываем порт 5000
EXPOSE 5000

# Запускаем приложение
CMD [ "node", "bin/www.js" ]
