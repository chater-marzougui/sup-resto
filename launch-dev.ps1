Write-Host "Starting development environment..." -ForegroundColor Green
Write-Host ""

# Run tasks using VS Code's task system
Write-Host "Terminal 1: Git Pull + Admin (Ctrl+Shift+P -> Tasks: Run Task -> 'Git Pull then Admin')" -ForegroundColor Cyan
Write-Host "Terminal 2: Backend (Ctrl+Shift+P -> Tasks: Run Task -> 'Start Backend')" -ForegroundColor Cyan
Write-Host "Terminal 3: DB Reset + Studio (Ctrl+Shift+P -> Tasks: Run Task -> 'DB Reset and Studio')" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or run these commands manually in separate VS Code terminals:" -ForegroundColor Yellow
Write-Host "1. git pull && npm run admin" -ForegroundColor White
Write-Host "2. npm run backend" -ForegroundColor White
Write-Host "3. npm run db:reset:seed && npm run db:studio" -ForegroundColor White
