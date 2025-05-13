const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

app.get("/jogos", async (req, res) => {
  try {
    const url = "https://tudonumclick.com/futebol/jogos-na-tv/";
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const tabelas = $(".entry-content table");
    let html = "";

    tabelas.each((_, el) => {
      html += $.html(el);
    });

    res.send(html || "<p>Nada encontrado.</p>");
  } catch (error) {
    res.status(500).send("Erro ao buscar dados.");
  }
});

app.get("/", (req, res) => {
  res.send("API funcionando. Acesse <a href='/jogos'>/jogos</a>");
});

module.exports = app;