import express from 'express';
import pagesRouter from './routes/pages.js';

const app = express();

// Включите парсер тела запроса для JSON
app.use(express.json());

// Подключение маршрутов
app.use('/pages', pagesRouter);

export default app;
