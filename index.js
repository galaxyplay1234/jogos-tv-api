const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

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

    const blocos = [];
    let dataAtual = null;

    body.find("h3, table").each((_, el) => {
      const tag = $(el)[0].tagName;

      if (tag === "h3") {
        dataAtual = $(el).text().trim();
      }

      if (tag === "table" && dataAtual) {
        const rows = $(el).find("tr");
        rows.each((i, row) => {
          const cols = $(row).find("td");
          if (cols.length > 0) {
            let hora = $(cols[0]).text().trim();
            const timeInUTC = dayjs.utc(`${dataAtual} ${hora}`, "DD/MM/YYYY HH:mm");
            const timeInBR = timeInUTC.tz("America/Sao_Paulo");
            const novaData = timeInBR.format("DD/MM/YYYY");
            const novaHora = timeInBR.format("HH:mm");

            // Substitui a hora antiga pela nova
            $(cols[0]).text(novaHora);

            blocos.push({ data: novaData, row: $.html(row) });
          } else {
            blocos.push({ data: dataAtual, row: $.html(row) });
          }
        });
      }
    });

    if (blocos.length === 0) {
      return res.send("<p>Nenhum jogo encontrado.</p>");
    }

    // Agrupar por data
    const agrupado = {};
    for (const bloco of blocos) {
      if (!agrupado[bloco.data]) agrupado[bloco.data] = [];
      agrupado[bloco.data].push(bloco.row);
    }

    // Gerar HTML
    let html = "";
    for (const data of Object.keys(agrupado).sort((a, b) => {
      const d1 = dayjs(a, "DD/MM/YYYY");
      const d2 = dayjs(b, "DD/MM/YYYY");
      return d1.isAfter(d2) ? 1 : -1;
    })) {
      html += `<h3>${data}</h3>`;
      html += `<table><tbody>${agrupado[data].join("")}</tbody></table>`;
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