"""
Dashboard de Temperaturas IoT
------------------------------
Dashboard interativo em Streamlit que le as views SQL do banco PostgreSQL
(criadas por sql/views.sql) e exibe visualizacoes com Plotly.

Uso:
    streamlit run src/dashboard.py
"""

import os
import pandas as pd
import plotly.express as px
import streamlit as st
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()  # le variaveis do arquivo .env, se existir (veja .env.example)

# ---------------------------------------------------------------------------
# Configuracao da pagina e conexao com o banco
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Dashboard de Temperaturas IoT", layout="wide")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "iot_temperature")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "iot_pass123")

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)


@st.cache_data(ttl=60)
def load_data(view_name: str) -> pd.DataFrame:
    return pd.read_sql(f"SELECT * FROM {view_name}", engine)


# ---------------------------------------------------------------------------
# Titulo e metricas gerais
# ---------------------------------------------------------------------------
st.title("🌡️ Dashboard de Temperaturas IoT")
st.caption(
    "Fonte: dataset Kaggle *Temperature Readings: IoT Devices* — "
    "leituras de temperatura de sensores interno/externo de uma sala, "
    "processadas via pipeline Python + PostgreSQL."
)

df_avg = load_data("avg_temp_por_dispositivo")
df_dia = load_data("temp_max_min_por_dia")

col1, col2, col3, col4 = st.columns(4)
col1.metric("Total de leituras", f"{int(df_avg['total_leituras'].sum()):,}".replace(",", "."))
col2.metric("Dispositivos monitorados", f"{df_avg.shape[0]}")
col3.metric("Temp. media geral", f"{df_avg['avg_temp'].mean():.1f} °C")
col4.metric("Periodo coberto", f"{df_dia['data'].min()} a {df_dia['data'].max()}")

st.divider()

# ---------------------------------------------------------------------------
# Grafico 1: Media de temperatura por dispositivo
# ---------------------------------------------------------------------------
st.header("Média de Temperatura por Dispositivo")
df_avg_temp = load_data("avg_temp_por_dispositivo")
fig1 = px.bar(
    df_avg_temp, x="device_id", y="avg_temp",
    labels={"device_id": "Dispositivo", "avg_temp": "Temperatura media (°C)"},
    color="device_id", text="avg_temp",
)
fig1.update_traces(texttemplate="%{text:.1f} °C", textposition="outside")
fig1.update_layout(showlegend=False)
st.plotly_chart(fig1, use_container_width=True)

# ---------------------------------------------------------------------------
# Grafico 2: Contagem de leituras por hora
# ---------------------------------------------------------------------------
st.header("Leituras por Hora do Dia")
df_leituras_hora = load_data("leituras_por_hora")
fig2 = px.line(
    df_leituras_hora, x="hora", y="contagem", markers=True,
    labels={"hora": "Hora do dia", "contagem": "Quantidade de leituras"},
)
st.plotly_chart(fig2, use_container_width=True)

# ---------------------------------------------------------------------------
# Grafico 3: Temperaturas maximas e minimas por dia
# ---------------------------------------------------------------------------
st.header("Temperaturas Máximas e Mínimas por Dia")
df_temp_max_min = load_data("temp_max_min_por_dia")
fig3 = px.line(
    df_temp_max_min, x="data", y=["temp_max", "temp_min"],
    labels={"data": "Data", "value": "Temperatura (°C)", "variable": "Métrica"},
)
st.plotly_chart(fig3, use_container_width=True)

# ---------------------------------------------------------------------------
# Grafico 4 (bonus): Media por hora, separado por dispositivo
# ---------------------------------------------------------------------------
st.header("Ciclo Diário de Temperatura por Dispositivo")
df_hora_disp = load_data("temp_media_por_hora_dispositivo")
fig4 = px.line(
    df_hora_disp, x="hora", y="avg_temp", color="device_id", markers=True,
    labels={"hora": "Hora do dia", "avg_temp": "Temperatura media (°C)", "device_id": "Dispositivo"},
)
st.plotly_chart(fig4, use_container_width=True)

st.divider()
st.caption("Pipeline de Dados com IoT e Docker — Disruptive Architectures: IoT, Big Data e IA")
