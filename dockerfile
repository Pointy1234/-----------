# Используем официальный образ Node.js в качестве базового
FROM node:20

# Создаем директорию для приложения
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем все остальные файлы в рабочую директорию
COPY . .

# Создаем папку temp
RUN mkdir temp

# Открываем порт 5000
EXPOSE 5000

# Запускаем приложение
CMD [ "node", "bin/www.js" ]
