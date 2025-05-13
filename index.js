const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();

let cache = {
  timestamp: 0,
  html: ""
};

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos em ms

function formatarDataHoje() {
  const hoje = new Date();
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  return `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
}

app.get("/jogos", async (req, res) => {
  try {
    const agora = Date.now();

    if (cache.html && agora - cache.timestamp < CACHE_DURATION) {
      return res.send(cache.html); // Serve do cache
    }

    const url = "https://tudonumclick.com/futebol/jogos-na-tv/";
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
      }
    });

    const $ = cheerio.load(data);
    const body = $("body");

    const dataHoje = formatarDataHoje().toLowerCase();
    let html = "";

    body.find("h3, table").each((_, el) => {
      const tag = $(el)[0].tagName;
      const texto = $(el).text().trim();

      if (tag === "h3") {
        const textoLower = texto.toLowerCase();

        const ehData = /\d{1,2}( de)? (janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)( de)? \d{4}/.test(textoLower)
                     || /\d{2}\/\d{2}\/\d{4}/.test(textoLower);

        if (ehData) {
          const destaque = textoLower.includes(dataHoje) ? "atual" : "";
          html += `<h3 class="data ${destaque}">${texto}</h3>`;
        }
      }

      if (tag === "table") {
        html += $.html(el);
      }
    });

    if (!html) {
      return res.send("<p>Nenhum conteúdo encontrado.</p>");
    }

    const styledHtml = `
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <title>Jogos na TV</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            background-color: #f0f2f5;
            color: #333;
          }

          h2 {
            text-align: center;
            margin-bottom: 30px;
            color: #2c3e50;
          }

          h3.data {
            margin-top: 40px;
            font-size: 20px;
            border-bottom: 2px solid #ccc;
            padding-bottom: 5px;
          }

          h3.atual {
            background-color: #dff0d8;
            padding: 10px;
            border-radius: 5px;
            color: #2e7d32;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0 40px 0;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            table-layout: fixed;
          }

          th, td {
            padding: 12px 16px;
            text-align: center;
            vertical-align: middle;
            border: 1px solid #eaeaea;
            word-wrap: break-word;
          }

          th {
            background-color: #2980b9;
            color: white;
            font-weight: 600;
            font-size: 16px;
          }

          tr:nth-child(even) {
            background-color: #f9f9f9;
          }

          tr:hover {
            background-color: #eef6ff;
          }
        </style>
      </head>
      <body>
        <h2>Jogos na TV - Atualizado automaticamente</h2>
        ${html}
      </body>
      </html>
    `;

    cache.html = styledHtml;
    cache.timestamp = agora;

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