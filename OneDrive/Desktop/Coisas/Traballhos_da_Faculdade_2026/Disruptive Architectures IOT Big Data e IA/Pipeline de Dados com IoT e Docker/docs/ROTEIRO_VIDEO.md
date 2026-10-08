# Roteiro do Vídeo Pitch (até 4 minutos)

Guia prático para gravar o vídeo pedido no enunciado. Grave a tela (dashboard
rodando) com sua voz por cima, ou você aparecendo em uma cantinho da tela —
qualquer um dos dois formatos funciona. O importante é cobrir os 4 pontos
que o enunciado pede, dentro do tempo.

Sugestão de ferramenta de gravação: o gravador de tela nativo do Windows
(Xbox Game Bar — `Win + G`), OBS Studio, ou Loom (grava e já gera link).

---

## Antes de gravar

1. Deixe o Docker rodando e o banco já populado:
   ```bash
   docker compose up -d
   python src/etl.py
   ```
2. Suba o dashboard e deixe a aba do navegador já aberta em
   `http://localhost:8501`, pronta para aparecer na gravação:
   ```bash
   streamlit run src/dashboard.py
   ```
3. Tenha também abertos, em outras abas/janelas (para alternar rapidamente):
   - O repositório no GitHub
   - O arquivo `src/etl.py` e `sql/views.sql` no editor de código
   - Um terminal com o comando `docker ps` pronto para rodar

---

## Roteiro cronometrado (~4 min)

### 1) Propósito e construção do pipeline — ~60s
Fale olhando para a câmera ou narrando, sem tela ainda (ou com o README aberto):

> "Este projeto é um pipeline de dados para leituras de temperatura de
> dispositivos IoT. Usei o dataset público do Kaggle 'Temperature Readings:
> IoT Devices', com quase 98 mil leituras de um sensor instalado numa sala,
> marcadas como interna ou externa.
>
> O pipeline tem 4 etapas: primeiro um script Python lê e limpa o CSV;
> depois os dados são carregados em um banco PostgreSQL rodando em um
> container Docker; em seguida, views SQL resumem esses dados; e por fim um
> dashboard interativo em Streamlit exibe tudo isso visualmente."

### 2) Tecnologias utilizadas — ~30s
Mostre rapidamente a estrutura de pastas do projeto (VS Code ou explorador
de arquivos) ou o README no GitHub:

> "As tecnologias usadas foram: Python com pandas para o processamento,
> SQLAlchemy para conectar ao banco, Docker e Docker Compose para rodar o
> PostgreSQL de forma isolada e reprodutível, e Streamlit com Plotly para o
> dashboard interativo."

### 3) Como os dados foram processados e visualizados — ~90s
Aqui é o momento técnico. Mostre na tela, nessa ordem:

- **Terminal**: rode (ou mostre já rodado) `docker ps` para provar que o
  container `postgres-iot` está no ar.
- **`src/etl.py`**: role rapidamente pelo código e explique em 1-2 frases:
  "o script extrai o CSV, limpa duplicatas e datas, e insere tudo numa
  tabela `temperature_readings` no Postgres."
- **`sql/views.sql`**: mostre as views e explique rapidamente cada uma:
  - `avg_temp_por_dispositivo`: média/mín/máx por sensor
  - `leituras_por_hora`: quantidade de leituras por hora do dia
  - `temp_max_min_por_dia`: variação térmica diária
  - (bônus) `temp_media_por_hora_dispositivo`: ciclo diário por sensor

### 4) Demonstração funcional do dashboard e conclusões — ~90s
Troque para a aba do navegador com o dashboard rodando:

- Mostre as métricas do topo (total de leituras, dispositivos, período).
- Passe por cada gráfico, comentando o que ele mostra:
  - "Aqui vemos que o sensor externo é, em média, quase 6°C mais quente que
    o interno — o que faz sentido, já que o ambiente interno é protegido."
  - "Neste gráfico dá pra ver que há um pico de leituras por volta das 14h."
  - "E aqui, a partir de meados de setembro, a temperatura máxima externa
    sobe bastante — pode indicar uma mudança sazonal."
- Feche com uma conclusão curta:

> "Esse pipeline mostra como dados de sensores IoT podem ser coletados,
> armazenados de forma estruturada e transformados em insights visuais
> rapidamente. Em um cenário real, isso poderia virar um sistema de alerta
> para falhas de climatização ou para otimizar o consumo de energia."

---

## Depois de gravar

1. Suba o vídeo no YouTube (público ou não listado) ou em outra rede social.
2. Confira se o link abre em uma aba anônima antes de entregar.
3. Cole o link do vídeo no README (seção que preferir) e/ou no PDF, e no
   local de entrega da disciplina.
