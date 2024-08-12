# Используйте официальный Node.js образ в качестве базового
FROM node:20

# Установите рабочую директорию
WORKDIR /app

# Копируйте package.json и package-lock.json
COPY package*.json ./

# Установите зависимости
RUN npm install
# Копируйте все файлы в рабочую директорию
COPY . /usr/src/app

# Откройте порт, который будет использовать приложение
EXPOSE 3000

# Запустите приложение
CMD ["npm", "start"]
