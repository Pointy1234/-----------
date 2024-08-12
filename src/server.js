import app from './app.js';
import http from 'http';

// Создайте HTTP-сервер
const server = http.createServer(app);
const port = process.env.PORT || 5000;

// Запустите сервер
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export { server };
