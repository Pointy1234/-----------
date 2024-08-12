import { createServer } from '../src/server.js';

const port = process.env.PORT || 5000;

createServer().listen(port, () => {
  console.log(`Server running on port ${port}`);
});
