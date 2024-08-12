const port = process.env.PORT || 3000;
const app = require('../index.js');

app.listen(port, () => console.log(`Server running at http://localhost:${port}/`));