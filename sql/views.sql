-- ============================================================================
-- Views SQL - Pipeline de Dados IoT (temperature_readings)
-- ============================================================================
-- Estas views alimentam o dashboard Streamlit (src/dashboard.py) e resumem
-- os dados brutos de leituras de temperatura em formatos prontos para
-- visualizacao e analise.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) avg_temp_por_dispositivo
-- Temperatura media, minima e maxima registrada por dispositivo (sensor
-- interno x externo da sala monitorada), alem da contagem de leituras.
-- Objetivo: comparar rapidamente o comportamento termico de cada sensor.
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS avg_temp_por_dispositivo;
CREATE VIEW avg_temp_por_dispositivo AS
SELECT
    device_id,
    ROUND(AVG(temp), 2)  AS avg_temp,
    MIN(temp)            AS min_temp,
    MAX(temp)            AS max_temp,
    COUNT(*)             AS total_leituras
FROM temperature_readings
GROUP BY device_id
ORDER BY device_id;

-- ----------------------------------------------------------------------------
-- 2) leituras_por_hora
-- Quantidade total de leituras registradas em cada hora do dia (0-23),
-- somando todos os dias do periodo coberto pelo dataset.
-- Objetivo: identificar em quais horarios os sensores mais registraram
-- dados (picos de atividade / frequencia de amostragem).
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS leituras_por_hora;
CREATE VIEW leituras_por_hora AS
SELECT
    EXTRACT(HOUR FROM reading_ts)::INT AS hora,
    COUNT(*)                            AS contagem
FROM temperature_readings
GROUP BY hora
ORDER BY hora;

-- ----------------------------------------------------------------------------
-- 3) temp_max_min_por_dia
-- Temperatura maxima e minima registrada em cada dia do periodo.
-- Objetivo: acompanhar a variacao termica diaria e identificar dias
-- com maior amplitude (diferenca entre temp_max e temp_min).
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS temp_max_min_por_dia;
CREATE VIEW temp_max_min_por_dia AS
SELECT
    reading_ts::DATE      AS data,
    MAX(temp)             AS temp_max,
    MIN(temp)             AS temp_min,
    ROUND(AVG(temp), 2)   AS temp_media
FROM temperature_readings
GROUP BY data
ORDER BY data;

-- ----------------------------------------------------------------------------
-- 4) (bonus) temp_media_por_hora_dispositivo
-- Temperatura media por hora do dia, separada por dispositivo (interno x
-- externo). Objetivo: revelar o ciclo diario de temperatura de cada sensor
-- (ex.: o sensor externo tem um ciclo diario bem mais pronunciado que o
-- interno, com pico de temperatura no inicio da manha).
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS temp_media_por_hora_dispositivo;
CREATE VIEW temp_media_por_hora_dispositivo AS
SELECT
    device_id,
    EXTRACT(HOUR FROM reading_ts)::INT AS hora,
    ROUND(AVG(temp), 2)                 AS avg_temp
FROM temperature_readings
GROUP BY device_id, hora
ORDER BY device_id, hora;
