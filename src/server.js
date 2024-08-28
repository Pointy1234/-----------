import app from './app.js';
import http from 'http';
import logger from './logger.js';

const server = http.createServer(app);
const port = process.env.PORT || 5000;

server.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

server.on('error', (err) => {
  logger.error(`Server error: ${err.message}`);
});

export { server };
