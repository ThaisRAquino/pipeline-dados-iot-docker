# -*- coding: utf-8 -*-
"""Gera docs/Documentacao_Pipeline_IoT.pdf (parte teorica do entregavel)."""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, HRFlowable
)

BASE = os.path.dirname(__file__)
SHOTS = os.path.join(BASE, "screenshots")
OUT = os.path.join(BASE, "Documentacao_Pipeline_IoT.pdf")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TituloCapa", fontSize=22, leading=28, alignment=TA_CENTER, spaceAfter=10, fontName="Helvetica-Bold"))
styles.add(ParagraphStyle(name="SubtituloCapa", fontSize=13, leading=18, alignment=TA_CENTER, textColor=colors.HexColor("#444444"), spaceAfter=6))
styles.add(ParagraphStyle(name="H1", parent=styles["Heading1"], fontSize=16, spaceBefore=14, spaceAfter=8, textColor=colors.HexColor("#1a3d5c")))
styles.add(ParagraphStyle(name="H2", parent=styles["Heading2"], fontSize=13, spaceBefore=10, spaceAfter=6, textColor=colors.HexColor("#1a3d5c")))
styles.add(ParagraphStyle(name="Corpo", parent=styles["Normal"], fontSize=10.5, leading=15, spaceAfter=8, alignment=4))
styles.add(ParagraphStyle(name="Legenda", parent=styles["Normal"], fontSize=9, leading=12, alignment=TA_CENTER, textColor=colors.HexColor("#666666"), spaceAfter=14))
styles.add(ParagraphStyle(name="Codigo", parent=styles["Normal"], fontName="Courier", fontSize=8.5, leading=11, backColor=colors.HexColor("#f4f4f4"), borderPadding=6, spaceAfter=10))

story = []

# ---------------------------------------------------------------------------
# Capa
# ---------------------------------------------------------------------------
story.append(Spacer(1, 5 * cm))
story.append(Paragraph("Pipeline de Dados com IoT e Docker", styles["TituloCapa"]))
story.append(Paragraph("Processamento, armazenamento e visualização de leituras de temperatura de dispositivos IoT", styles["SubtituloCapa"]))
story.append(Spacer(1, 1 * cm))
story.append(HRFlowable(width="60%", thickness=1, color=colors.HexColor("#1a3d5c"), spaceAfter=14, hAlign="CENTER"))
story.append(Paragraph("Disciplina: Disruptive Architectures — IoT, Big Data e IA", styles["SubtituloCapa"]))
story.append(Paragraph("Autora: Thais Ribeiro de Aquino", styles["SubtituloCapa"]))
story.append(Paragraph("Curso: Análise e Desenvolvimento de Sistemas — UniFECAF", styles["SubtituloCapa"]))
story.append(PageBreak())

# ---------------------------------------------------------------------------
# 1. Contextualizacao
# ---------------------------------------------------------------------------
story.append(Paragraph("1. Contextualização do projeto", styles["H1"]))
story.append(Paragraph(
    "Dispositivos IoT (Internet of Things) geram grandes volumes de dados em tempo real — "
    "temperatura, umidade, presença, consumo de energia — que precisam ser coletados, "
    "armazenados e analisados de forma estruturada para gerar valor. Este projeto propõe um "
    "pipeline de dados completo, do arquivo bruto ao dashboard interativo, para leituras de "
    "temperatura coletadas por sensores IoT.", styles["Corpo"]))
story.append(Paragraph(
    "O conjunto de dados utilizado é o <b>Temperature Readings: IoT Devices</b>, disponível "
    "publicamente no Kaggle, contendo 97.606 leituras de temperatura (em °C) de um sensor "
    "instalado em uma sala, classificadas como internas (\"In\") ou externas (\"Out\"), "
    "coletadas entre julho e dezembro de 2018.", styles["Corpo"]))
story.append(Paragraph(
    "O objetivo é construir um pipeline que: (1) processe o CSV bruto em Python; (2) armazene "
    "os dados de forma estruturada em um banco de dados relacional PostgreSQL, executado em "
    "um container Docker; (3) disponibilize views SQL que resumam os dados para análise; e "
    "(4) exiba essas análises em um dashboard interativo construído com Streamlit e Plotly, "
    "permitindo interpretar rapidamente o comportamento térmico do ambiente monitorado.", styles["Corpo"]))

# ---------------------------------------------------------------------------
# 2. Passos realizados
# ---------------------------------------------------------------------------
story.append(Paragraph("2. Descrição dos passos realizados", styles["H1"]))

passos = [
    ("2.1 Configuração do ambiente",
     "Instalação do Python 3, Docker e criação de um ambiente virtual Python "
     "(<font face='Courier'>venv</font>). Instalação das dependências do projeto via "
     "<font face='Courier'>pip install -r requirements.txt</font> "
     "(pandas, psycopg2-binary, SQLAlchemy, streamlit, plotly)."),
    ("2.2 Criação do container PostgreSQL",
     "O banco de dados PostgreSQL 16 é executado em um container Docker, definido em "
     "<font face='Courier'>docker-compose.yml</font> (equivalente ao comando "
     "<font face='Courier'>docker run --name postgres-iot -e POSTGRES_PASSWORD=... -p 5432:5432 -d postgres</font> "
     "pedido no enunciado), expondo a porta 5432 e persistindo os dados em um volume Docker."),
    ("2.3 Desenvolvimento do ETL em Python",
     "O script <font face='Courier'>src/etl.py</font> implementa as três etapas clássicas de "
     "um pipeline de dados: <b>Extract</b> (leitura do CSV com pandas), <b>Transform</b> "
     "(renomeação de colunas, remoção de 1 linha duplicada, conversão de datas e criação da "
     "coluna <font face='Courier'>device_id</font>) e <b>Load</b> (criação da tabela "
     "<font face='Courier'>temperature_readings</font> e inserção dos 97.605 registros "
     "válidos via SQLAlchemy)."),
    ("2.4 Criação das views SQL",
     "Após a carga dos dados, o próprio script executa o arquivo "
     "<font face='Courier'>sql/views.sql</font>, que cria quatro views de análise "
     "(detalhadas na seção 3) diretamente no banco PostgreSQL."),
    ("2.5 Construção do dashboard",
     "O dashboard interativo (<font face='Courier'>src/dashboard.py</font>) usa Streamlit "
     "para a interface web e Plotly para os gráficos, lendo os dados diretamente das views "
     "SQL via SQLAlchemy/pandas (<font face='Courier'>pd.read_sql</font>)."),
]

for titulo, texto in passos:
    story.append(Paragraph(titulo, styles["H2"]))
    story.append(Paragraph(texto, styles["Corpo"]))

# ---------------------------------------------------------------------------
# 3. Views SQL
# ---------------------------------------------------------------------------
story.append(PageBreak())
story.append(Paragraph("3. Explicação detalhada das views SQL", styles["H1"]))
story.append(Paragraph(
    "Foram criadas quatro views (três obrigatórias mais uma bônus), todas construídas sobre "
    "a tabela <font face='Courier'>temperature_readings</font>:", styles["Corpo"]))

views_info = [
    ("avg_temp_por_dispositivo",
     "Agrupa as leituras por dispositivo (sensor interno x externo) e calcula temperatura "
     "média, mínima, máxima e o total de leituras de cada um. Permite comparar rapidamente "
     "o comportamento térmico de cada sensor."),
    ("leituras_por_hora",
     "Extrai a hora do dia (0–23) de cada leitura e conta quantas leituras ocorreram em cada "
     "hora, somando todos os dias do período. Revela em quais horários há mais atividade de "
     "amostragem dos sensores."),
    ("temp_max_min_por_dia",
     "Agrupa as leituras por dia e calcula a temperatura máxima, mínima e média daquele dia. "
     "Permite acompanhar a variação térmica diária ao longo de todo o período coletado."),
    ("temp_media_por_hora_dispositivo (bônus)",
     "Combina as duas dimensões anteriores: temperatura média por hora do dia, separada por "
     "dispositivo. Evidencia o ciclo diário de aquecimento/resfriamento de cada sensor."),
]

for nome, explicacao in views_info:
    story.append(Paragraph(nome, styles["H2"]))
    story.append(Paragraph(explicacao, styles["Corpo"]))

story.append(Paragraph("Trecho de exemplo (view completa em sql/views.sql):", styles["Corpo"]))
story.append(Paragraph(
    "CREATE VIEW avg_temp_por_dispositivo AS<br/>"
    "SELECT device_id, ROUND(AVG(temp),2) AS avg_temp, MIN(temp) AS min_temp,<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;MAX(temp) AS max_temp, COUNT(*) AS total_leituras<br/>"
    "FROM temperature_readings<br/>"
    "GROUP BY device_id;", styles["Codigo"]))

# ---------------------------------------------------------------------------
# 4. Prints do dashboard
# ---------------------------------------------------------------------------
story.append(PageBreak())
story.append(Paragraph("4. Visualizações geradas no dashboard", styles["H1"]))
story.append(Paragraph(
    "As imagens abaixo foram capturadas a partir da execução real do dashboard "
    "(<font face='Courier'>streamlit run src/dashboard.py</font>), já conectado ao "
    "PostgreSQL com os dados carregados pelo pipeline.", styles["Corpo"]))

shots = [
    ("02_media_por_dispositivo.png", "Gráfico 1 — Média de temperatura por dispositivo (interno x externo)."),
    ("03_leituras_por_hora.png", "Gráfico 2 — Contagem de leituras por hora do dia."),
    ("04_temp_max_min_por_dia.png", "Gráfico 3 — Temperaturas máximas e mínimas por dia."),
    ("05_ciclo_diario_dispositivo.png", "Gráfico 4 (bônus) — Ciclo diário de temperatura por dispositivo."),
]

from PIL import Image as PILImage

IMG_WIDTH = 15.5 * cm
for filename, legenda in shots:
    path = os.path.join(SHOTS, filename)
    iw, ih = PILImage.open(path).size
    img_height = IMG_WIDTH * (ih / iw)
    story.append(Image(path, width=IMG_WIDTH, height=img_height))
    story.append(Paragraph(legenda, styles["Legenda"]))

# ---------------------------------------------------------------------------
# 5. Insights
# ---------------------------------------------------------------------------
story.append(PageBreak())
story.append(Paragraph("5. Principais insights obtidos", styles["H1"]))

insights = [
    "O sensor externo (\"Out\") registra, em média, cerca de 5,9 °C a mais que o sensor "
    "interno (\"In\") — 36,3 °C contra 30,4 °C — coerente com um ambiente interno "
    "climatizado/protegido em relação à variação externa.",
    "A amplitude térmica do sensor externo é bem maior (24 °C a 51 °C, 27 °C de amplitude) "
    "do que a do sensor interno (21 °C a 41 °C, 20 °C de amplitude): o ambiente interno "
    "amortece picos de calor.",
    "O ciclo diário do sensor externo é muito mais pronunciado: a temperatura média sobe de "
    "cerca de 35 °C de madrugada para quase 40 °C entre 5h e 8h, enquanto o sensor interno "
    "oscila pouco (29 °C a 31 °C) ao longo de todo o dia.",
    "A frequência de leituras não é uniforme: há um pico claro por volta das 14h, com mais "
    "de 7.200 leituras somadas no período — mais que o dobro da média das demais horas.",
    "A partir de meados de setembro de 2018, as temperaturas máximas diárias sobem "
    "visivelmente (de cerca de 35 °C para 45–50 °C), indicando uma provável mudança sazonal "
    "ou de posicionamento do sensor externo.",
]
story.append(ListFlowable(
    [ListItem(Paragraph(t, styles["Corpo"])) for t in insights],
    bulletType="bullet", start="•", leftIndent=14,
))

story.append(Paragraph("Sugestões de uso prático em um ambiente real", styles["H2"]))
sugestoes = [
    "Disparar alertas automáticos quando a temperatura interna ultrapassar uma faixa segura "
    "(por exemplo, acima de 32–35 °C), indicando possível falha de climatização.",
    "Usar a comparação interno x externo para otimizar climatização e consumo de energia "
    "(ex.: pré-resfriar o ambiente antes dos horários de pico de temperatura externa).",
    "Detectar anomalias de sensor (leituras muito fora do padrão histórico por hora/dia) "
    "como indício de defeito de hardware.",
    "Estender o pipeline para múltiplos dispositivos e salas reais, já que a estrutura de "
    "device_id no banco de dados já suporta esse cenário sem alterações no modelo.",
]
story.append(ListFlowable(
    [ListItem(Paragraph(t, styles["Corpo"])) for t in sugestoes],
    bulletType="bullet", start="•", leftIndent=14,
))

story.append(Spacer(1, 1 * cm))
story.append(Paragraph(
    "Repositório do projeto (código-fonte completo, views SQL, Docker e README): "
    "<font color='#1a5c8f'>&lt;URL_DO_SEU_REPOSITORIO_NO_GITHUB&gt;</font>", styles["Corpo"]))

doc = SimpleDocTemplate(
    OUT, pagesize=A4,
    leftMargin=2.2 * cm, rightMargin=2.2 * cm, topMargin=2 * cm, bottomMargin=2 * cm,
    title="Pipeline de Dados com IoT e Docker",
    author="Thais Ribeiro de Aquino",
)
doc.build(story)
print("PDF gerado em", OUT)
