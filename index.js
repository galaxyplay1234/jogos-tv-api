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
    const body = $("body");

    let html = "";

    body.find("h3, table").each((_, el) => {
      const tag = $(el)[0].tagName;
      const text = $(el).text().trim();

      if (tag === "h3") {
        html += `<h3 style="margin-top:40px; color:#2c3e50;">${text}</h3>`;
      }

      if (tag === "table") {
        const table = $(el).clone();

        table.find("td").each((_, cell) => {
          const text = $(cell).text().trim();
          const match = text.match(/^(\d{1,2}):(\d{2})$/);

          if (match) {
            let hour = parseInt(match[1]);
            let minute = parseInt(match[2]);

            // Converte o horário para GMT-4
            hour = (hour - 4 + 24) % 24;

            const newTime = `${hour}:${minute < 10 ? '0' : ''}${minute}`; // Ajusta a hora com 2 dígitos se necessário
            $(cell).text(newTime); // Substitui o texto da célula com o horário ajustado
          }
        });

        html += $.html(table);
      }
    });

    if (!html) {
      return res.send("<p>Nenhum conteúdo <h3> ou <table> encontrado.</p>");
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