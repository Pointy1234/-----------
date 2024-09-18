# Stage 1: Build Stage
FROM node:20 AS builder

# Создаем рабочую директорию для сборки
WORKDIR /usr/src/app

# Копируем все файлы, включая локально установленные зависимости
COPY . .

# Stage 2: Production Stage
FROM node:20-slim

# Создаем рабочую директорию для приложения
WORKDIR /usr/src/app

# Копируем все файлы из стадии сборки
COPY --from=builder /usr/src/app ./

# Открываем порт 5000
EXPOSE 5000

# Запускаем приложение
CMD [ "node", "bin/www.js" ]