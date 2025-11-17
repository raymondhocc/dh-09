@echo off

REM Cantonese Conversational Bot using Qwen3 - Setup Script (Windows)
REM This script roughly mirrors the behavior of the bash "run2" script.

setlocal ENABLEDELAYEDEXPANSION

REM Load environment variables from .env file if it exists
if exist .env (
  echo Loading environment variables from .env file...
  for /F "usebackq tokens=* delims=" %%A in (".env") do (
    set "line=%%A"
    REM Skip empty lines
    if not "!line!"=="" (
      REM Skip comment lines starting with #
      if not "!line:~0,1!"=="#" (
        REM Apply the line as KEY=VALUE directly
        set "%%A"
      )
    )
  )
  if defined ALICLOUD_API_KEY (
    set "__API_PREFIX=%ALICLOUD_API_KEY:~0,5%"
    echo ALICLOUD_API_KEY is set: %__API_PREFIX%****
  )
) else (
  REM Check if ALICLOUD_API_KEY is set manually
  if not defined ALICLOUD_API_KEY (
    echo WARNING: ALICLOUD_API_KEY environment variable is not set.
    echo You'll need to set your Alibaba Cloud API key to use the Qwen3 API.
    set /P SET_KEY=Would you like to enter your ALICLOUD_API_KEY now? (y/n): 
    if /I "%SET_KEY%"=="y" (
      set /P API_KEY=Enter your ALICLOUD_API_KEY: 
      set "ALICLOUD_API_KEY=%API_KEY%"
      echo ALICLOUD_API_KEY has been temporarily set for this session.
    ) else (
      echo No API key set. The bot will run but won't be able to process queries.
    )
  )
)

REM Check Deno installation
where deno >nul 2>nul
if errorlevel 1 (
  echo ERROR: Deno is not installed or not on PATH.
  echo Please install Deno from https://deno.land/#installation
  pause
  exit /B 1
)

REM Run the application
echo.
echo Starting Cantonese Conversational Bot...
echo Once started, open your browser to http://localhost:8000
echo Press Ctrl+C to stop the server
echo ---------------------------------------------------
echo Starting with DEBUG mode...

deno run --no-check --allow-net --allow-env --allow-read --allow-run voice-bot.ts

endlocal
