# Базовый образ Node.js
FROM node:20-alpine

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем оставшуюся часть приложения
COPY . .

# Указываем, что приложение слушает на порте 5000
ENV PORT 5000

# Указываем команду для запуска приложения
CMD ["npm", "start"]

# Открываем порт
EXPOSE 5000
