-- Se ejecuta una sola vez al crear el volumen de PostgreSQL (solo desarrollo local).
CREATE ROLE radar_owner LOGIN PASSWORD 'radar_dev';
CREATE ROLE radar_app LOGIN PASSWORD 'radar_app_dev';
CREATE DATABASE radar_dev OWNER radar_owner;
CREATE DATABASE radar_test OWNER radar_owner;
