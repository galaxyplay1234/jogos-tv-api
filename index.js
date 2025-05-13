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

    // Vamos tentar capturar qualquer tabela da página, sem depender de .entry-content
    const tabelas = $("table");
    let html = "";

    tabelas.each((_, el) => {
      html += $.html(el);
    });

    if (!html) {
      return res.send("<p>Nenhuma tabela encontrada na página.</p>");
    }

    res.send(html);
  } catch (error) {
    console.error("Erro:", error.message);
    res.status(500).send("Erro ao buscar dados.");
  }
});

app.get("/", (req, res) => {
  res.send("API funcionando. Acesse <a href='/jogos'>/jogos</a>");
});

module.exports = app;