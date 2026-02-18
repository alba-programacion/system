const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/test', (req, res) => {
  res.send('Backend funcionando 🚀');
});

module.exports = app;
