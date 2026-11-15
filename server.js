const express = require("express");

const app = express();
const port = 3000;

// Configura o Express para servir os arquivos estáticos da pasta 'public'
app.use(express.static("public"));

app.listen(port, () => {
  console.log(`Server rodando na porta: ${port} - http://localhost:${port}`);
});
