"""
ETL - Pipeline de Dados IoT (leituras de temperatura)
------------------------------------------------------
Le o CSV do dataset Kaggle "Temperature Readings: IoT Devices", limpa e
padroniza os dados, e carrega tudo em uma tabela PostgreSQL usando SQLAlchemy.

Uso:
    python src/etl.py

Variaveis de ambiente (ou edite os defaults abaixo):
    DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, CSV_PATH
"""

import os
import sys
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()  # le variaveis do arquivo .env, se existir (veja .env.example)

# ---------------------------------------------------------------------------
# Configuracao
# ---------------------------------------------------------------------------
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5433")
DB_NAME = os.getenv("DB_NAME", "iot_temperature")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "iot_pass123")
CSV_PATH = os.getenv("CSV_PATH", os.path.join(os.path.dirname(__file__), "..", "data", "IOT-temp.csv"))

DATABASE_URL = f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"


def extract(csv_path: str) -> pd.DataFrame:
    """Le o CSV bruto do dataset Kaggle."""
    print(f"[EXTRACT] Lendo {csv_path} ...")
    df = pd.read_csv(csv_path)
    print(f"[EXTRACT] {len(df)} linhas lidas.")
    return df


def transform(df: pd.DataFrame) -> pd.DataFrame:
    """Limpa e padroniza as colunas do dataset."""
    print("[TRANSFORM] Limpando e padronizando dados...")

    df = df.rename(columns={
        "room_id/id": "room_id",
        "noted_date": "reading_ts",
        "out/in": "location",
    })

    # remove duplicatas exatas (o dataset original tem 1 linha duplicada)
    before = len(df)
    df = df.drop_duplicates(subset=["id"], keep="first")
    print(f"[TRANSFORM] Removidas {before - len(df)} linhas duplicadas.")

    # o CSV usa formato dia/mes/ano hora:minuto (ex.: 08-12-2018 09:30)
    df["reading_ts"] = pd.to_datetime(df["reading_ts"], format="%d-%m-%Y %H:%M")

    df["temp"] = pd.to_numeric(df["temp"], errors="coerce")
    df = df.dropna(subset=["temp", "reading_ts"])

    df["location"] = df["location"].str.strip().str.title()  # "In" / "Out"

    # O dataset so tem uma sala ("Room Admin"), entao usamos a leitura
    # indoor/outdoor como "dispositivo" (device_id) para fins de agrupamento -
    # e o unico eixo de comparacao real disponivel nos dados.
    df["device_id"] = "Room Admin - " + df["location"]

    df = df[["id", "room_id", "device_id", "location", "reading_ts", "temp"]]

    print(f"[TRANSFORM] {len(df)} linhas apos limpeza.")
    return df


def load(df: pd.DataFrame, engine) -> None:
    """Cria a tabela (se necessario) e insere os dados no PostgreSQL."""
    print("[LOAD] Conectando ao PostgreSQL e gravando dados...")

    create_table_sql = """
    CREATE TABLE IF NOT EXISTS temperature_readings (
        id           TEXT PRIMARY KEY,
        room_id      TEXT NOT NULL,
        device_id    TEXT NOT NULL,
        location     TEXT NOT NULL,
        reading_ts   TIMESTAMP NOT NULL,
        temp         NUMERIC(5,2) NOT NULL
    );
    """
    with engine.begin() as conn:
        conn.execute(text(create_table_sql))
        conn.execute(text("TRUNCATE TABLE temperature_readings;"))

    df.to_sql("temperature_readings", engine, if_exists="append", index=False, chunksize=5000, method="multi")
    print(f"[LOAD] {len(df)} linhas inseridas na tabela 'temperature_readings'.")


def create_views(engine, sql_path: str) -> None:
    """Executa o arquivo sql/views.sql para (re)criar as views de analise."""
    print(f"[VIEWS] Aplicando views a partir de {sql_path} ...")
    with open(sql_path, "r", encoding="utf-8") as f:
        views_sql = f.read()

    with engine.begin() as conn:
        for statement in views_sql.split(";"):
            statement = statement.strip()
            if statement:
                conn.execute(text(statement))
    print("[VIEWS] Views criadas/atualizadas com sucesso.")


def main():
    if not os.path.exists(CSV_PATH):
        print(f"ERRO: CSV nao encontrado em {CSV_PATH}")
        print("Baixe o dataset no Kaggle (Temperature Readings: IoT Devices) e salve em data/IOT-temp.csv")
        sys.exit(1)

    engine = create_engine(DATABASE_URL)

    df = extract(CSV_PATH)
    df = transform(df)
    load(df, engine)

    views_path = os.path.join(os.path.dirname(__file__), "..", "sql", "views.sql")
    create_views(engine, views_path)

    print("\n[OK] Pipeline concluido com sucesso!")


if __name__ == "__main__":
    main()
