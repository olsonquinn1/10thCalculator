@echo off

set HTML_FILE=10thCalculator.html
set PORT=8000

start python -m http.server %PORT%

timeout /t 2 >nul

cmd /c start http://localhost:%PORT%/%HTML_FILE%

exit