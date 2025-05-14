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

    const jogosPorData = {};
    let dataAtual = "";

    body.find("h3, table").each((_, el) => {
      const tag = $(el)[0].tagName;

      if (tag === "h3") {
        dataAtual = $(el).text().trim();
        jogosPorData[dataAtual] = "";
      }

      if (tag === "table" && dataAtual) {
        const table = $(el).clone();

        // Ajuste de horário para GMT-4
        table.find("td").each((_, cell) => {
          const texto = $(cell).text().trim();
          const match = texto.match(/^(\d{1,2}):(\d{2})$/);

          if (match) {
            let hour = (parseInt(match[1]) - 4 + 24) % 24;
            let minute = parseInt(match[2]);
            const newTime = `${hour}:${minute < 10 ? "0" : ""}${minute}`;
            $(cell).text(newTime);
          }
        });

        jogosPorData[dataAtual] += $.html(table);
      }
    });

    if (Object.keys(jogosPorData).length === 0) {
      return res.send("<p>Nenhum conteúdo encontrado.</p>");
    }

    let menu = '';
    let conteudo = '';
    let primeira = true;

    for (const [data, tablesHtml] of Object.entries(jogosPorData)) {
      const id = data.replace(/\s+/g, '-').toLowerCase();
      menu += `<li onclick="mostrarTab('${id}')" class="${primeira ? 'ativo' : ''}">${data}</li>`;
      conteudo += `
        <div class="tab-content" id="tab-${id}" style="display:${primeira ? 'block' : 'none'};">
          <h3>${data}</h3>
          ${tablesHtml}
        </div>`;
      primeira = false;
    }

    const styledHtml = `
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <title>Jogos na TV</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', sans-serif;
            margin: 0;
            background: #f0f2f5;
            display: flex;
            min-height: 100vh;
          }

          .menu-lateral {
            width: 200px;
            background: #2c3e50;
            color: white;
            padding: 20px 0;
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
          }

          .menu-lateral ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .menu-lateral li {
            padding: 12px 20px;
            cursor: pointer;
            transition: background 0.3s;
          }

          .menu-lateral li:hover,
          .menu-lateral li.ativo {
            background: #34495e;
          }

          .conteudo {
            flex: 1;
            padding: 20px;
          }

          .tab-content {
            display: none;
          }

          h3 {
            font-size: 20px;
            color: #2c3e50;
            margin-top: 0;
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

          td a {
            text-decoration: none;
            color: #27ae60;
            font-weight: bold;
            font-size: 10px;
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

          @media screen and (max-width: 768px) {
            .menu-lateral {
              display: none;
            }
            .conteudo {
              padding: 10px;
            }
            th, td {
              font-size: 14px;
            }
          }
        </style>
        <script>
          function mostrarTab(id) {
            document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.menu-lateral li').forEach(el => el.classList.remove('ativo'));
            document.getElementById('tab-' + id).style.display = 'block';
            event.target.classList.add('ativo');
          }
        </script>
      </head>
      <body>
        <div class="menu-lateral">
          <ul>${menu}</ul>
        </div>
        <div class="conteudo">
          <h2>Jogos na TV - Atualizado automaticamente</h2>
          ${conteudo}
        </div>
      </body>
      </html>
    `;

    res.send(styledHtml);
  } catch (error) {
    console.error("Erro:", error.message);
    res.status(500).send("Erro ao buscar dados.");
  }
});