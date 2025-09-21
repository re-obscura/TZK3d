@echo off
echo.
echo ===================================
echo  Starting Python HTTP Server
echo ===================================
echo.
echo  Access the application at:
echo  http://localhost:8000
echo.
echo  Press CTRL+C to stop the server.
echo.

:: Проверяем, доступен ли python. Если нет, пытаемся запустить из магазина Windows.
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found in PATH. Trying to launch via 'py'.
    py --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo 'py' command also not found. Please install Python.
        pause
        exit /b
    ) else (
        py -m http.server
    )
) else (
    python -m http.server
)