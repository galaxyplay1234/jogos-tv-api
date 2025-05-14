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
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(data);
    const body = $("body");

    const blocos = [];
    let dataAtual = "";

    body.find("h3, table").each((_, el) => {
      const tag = $(el)[0].tagName;

      if (tag === "h3") {
        const texto = $(el).text().trim();
        const dataExtraida = texto.match(/\d{2}\/\d{2}\/\d{4}/);
        if (dataExtraida) {
          dataAtual = dataExtraida[0];
          console.log("Data encontrada:", dataAtual);
        }
      }

      if (tag === "table" && dataAtual) {
        $(el)
          .find("tr")
          .each((i, row) => {
            if (i === 0) return;

            const cols = $(row).find("td");
            if (cols.length < 2) return;

            const horaOriginal = $(cols[0]).text().trim();
            if (!horaOriginal || !dataAtual) return;

            const datetime = dayjs.utc(`${dataAtual} ${horaOriginal}`, "DD/MM/YYYY HH:mm");
            if (!datetime.isValid()) {
              console.log("Data inválida:", dataAtual, horaOriginal);
              return;
            }

            const timeInBR = datetime.tz("America/Sao_Paulo");
            const novaData = timeInBR.format("DD/MM/YYYY");
            const novaHora = timeInBR.format("HH:mm");

            $(cols[0]).text(novaHora);

            blocos.push({ data: novaData, row: $.html(row) });
          });
      }
    });

    if (blocos.length === 0) {
      return res.send("<p>Nenhum jogo encontrado.</p>");
    }

    // Agrupar por data
    const jogosPorData = {};
    blocos.forEach(({ data, row }) => {
      if (!jogosPorData[data]) jogosPorData[data] = [];
      jogosPorData[data].push(row);
    });

    let htmlFinal = "";
    for (const data of Object.keys(jogosPorData)) {
      htmlFinal += `<h3>${data}</h3><table><thead><tr><th>Hora</th><th>Evento</th><th>Canal</th></tr></thead><tbody>`;
      htmlFinal += jogosPorData[data].join("");
      htmlFinal += "</tbody></table>";
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
            margin: 20px 0;
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
        ${htmlFinal}
      </body>
      </html>
    `;

    res.send(styledHtml);
  } catch (error) {
    console.error("Erro ao buscar dados:", error.message);
    res.status(500).send("Erro ao buscar dados.");
  }
});

app.get("/", (req, res) => {
  res.send("API funcionando. Acesse <a href='/jogos'>/jogos</a>");
});

module.exports = app;