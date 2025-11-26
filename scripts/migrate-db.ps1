# Database migration script for Windows PowerShell
# Migrates local database to remote database

Write-Host "Database Migration Script" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
Write-Host ""

# Check if required environment variables are set
if (-not $env:LOCAL_DB_URL) {
    Write-Host "Error: LOCAL_DB_URL environment variable is not set" -ForegroundColor Red
    Write-Host "Example: postgresql://user:password@localhost:5432/dbname" -ForegroundColor Yellow
    exit 1
}

if (-not $env:REMOTE_DB_URL) {
    Write-Host "Error: REMOTE_DB_URL environment variable is not set" -ForegroundColor Red
    Write-Host "Example: postgresql://user:password@remote-host:5432/dbname" -ForegroundColor Yellow
    exit 1
}

# Create temporary backup file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tempBackup = "$env:TEMP\cortexex_migration_$timestamp.sql"

Write-Host "Step 1: Creating backup from local database..." -ForegroundColor Yellow
& pg_dump $env:LOCAL_DB_URL | Out-File -FilePath $tempBackup -Encoding utf8

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to create backup from local database" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Backup created successfully" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Restoring backup to remote database..." -ForegroundColor Yellow
Write-Host "Warning: This will overwrite existing data in the remote database!" -ForegroundColor Yellow
$confirm = Read-Host "Do you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Migration cancelled" -ForegroundColor Yellow
    Remove-Item $tempBackup -ErrorAction SilentlyContinue
    exit 0
}

Get-Content $tempBackup | & psql $env:REMOTE_DB_URL

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to restore backup to remote database" -ForegroundColor Red
    Remove-Item $tempBackup -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "✓ Migration completed successfully" -ForegroundColor Green
Write-Host ""

# Clean up
Remove-Item $tempBackup -ErrorAction SilentlyContinue
Write-Host "Migration finished!" -ForegroundColor Green

