@echo off
title JARVIS Live - Google Gemini Asistente
color 09
echo =========================================================
echo       INICIANDO JARVIS (SISTEMA GEMINI TIEMPO REAL)
echo =========================================================
echo.
cd /d "%~dp0apps\gemini_live"
python main.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Se detuvo el asistente.
    pause
)
