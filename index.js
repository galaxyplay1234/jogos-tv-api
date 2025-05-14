const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const app = express();

const cache = {
  data: null,
  timestamp: 0,
};

app.get("/jogos", async (req, res) => {
  const agora = Date.now();

  // Se o cache for recente (menos de 15 minutos), retorna ele
  if (cache.data && agora - cache.timestamp < 15 * 60 * 1000) {
    return res.send(cache.data);
  }

  try {
    const url = "https://tudonumclick.com/futebol/jogos-na-tv/";
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
      }
    });

    const $ = cheerio.load(data);
    const content = $(".entry-content");

    let html = "";

    content.children("h3, table").each((_, el) => {
      const tag = $(el)[0].tagName;
      if (tag === "h3") {
        const dataTexto = $(el).text().trim();
        html += `<h3 style="margin-top:40px; color:#2c3e50;">${dataTexto}</h3>`;
      }

      if (tag === "table") {
        // Ajustar horários do Brasil (GMT-4) se necessário no conteúdo da tabela
        let tabela = $(el).html();
        tabela = tabela.replace(/(\d{2}):(\d{2})/g, (match, h, m) => {
          const date = new Date();
          date.setUTCHours(parseInt(h), parseInt(m));
          date.setUTCHours(date.getUTCHours() - 4); // Ajuste para GMT-4
          const horas = date.getHours().toString().padStart(2, '0');
          const minutos = date.getMinutes().toString().padStart(2, '0');
          return `${horas}:${minutos}`;
        });

        html += `<table>${tabela}</table>`;
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

          h3 {
            margin-top: 40px;
            margin-bottom: 10px;
            font-size: 20px;
            color: #2c3e50;
            border-bottom: 2px solid #ccc;
            padding-bottom: 5px;
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

    // Salva no cache
    cache.data = styledHtml;
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