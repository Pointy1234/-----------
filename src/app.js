import express from 'express';
import pagesRouter from './routes/pages.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use('/api', pagesRouter);

export default app;
