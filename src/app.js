import express from 'express';
import pagesRouter from './routes/pages.js';
import logger from './logger.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/api', pagesRouter);

// Middleware для логирования запросов
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  res.on('finish', () => {
    logger.info(`Request completed: ${req.method} ${req.url} - Status: ${res.statusCode}`);
  });
  next();
});

// Middleware для обработки ошибок
app.use((err, req, res, next) => {
  logger.error(`Error occurred: ${err.message}`);
  res.status(err.status || 500).json({ error: 'Internal Server Error' });
});

export default app;
