const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

app.get("/jogos", async (req, res) => {
  try {
    const url = "https://tudonumclick.com/futebol/jogos-na-tv/";
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
      }
    });

    const $ = cheerio.load(data);
    const tabelas = $("table");

    let html = "";

    tabelas.each((_, el) => {
      html += $.html(el);
    });

    if (!html) {
      return res.send("<p>Nenhuma tabela encontrada na página.</p>");
    }

    // CSS embutido na resposta
    const styledHtml = `
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <title>Jogos na TV</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: #f5f5f5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
          }
          th, td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: center;
          }
          th {
            background-color: #f8f8f8;
            color: #333;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #f1f1f1;
          }
        </style>
      </head>
      <body>
        <h2>Jogos na TV - Atualizado automaticamente</h2>
        ${html}
      </body>
      </html>
    `;

    res.send(styledHtml);
  } catch (error) {
    console.error("Erro:", error.message);
    res.status(500).send("Erro ao buscar dados.");
  }
});

app.get("/", (req, res) => {
  res.send("API funcionando. Acesse <a href='/jogos'>/jogos</a>");
});

module.exports = app;