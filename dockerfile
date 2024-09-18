# Используем официальный образ Node.js в качестве базового
FROM node:20

# Создаем директорию для приложения
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./
COPY node_modules ./node_modules
COPY . .

# Вывести список всех модулей для проверки
RUN ls -la node_modules

# Открываем порт 5000
EXPOSE 5000

# Запускаем приложение
CMD [ "node", "bin/www.js" ]
