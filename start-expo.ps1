# Expo Start Script with Multiple Options
# Run this with: .\start-expo.ps1

Write-Host "==================================" -ForegroundColor Green
Write-Host "  Expo Start Options" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "1. LAN Mode (Recommended - Most Stable)" -ForegroundColor Cyan
Write-Host "2. Tunnel Mode (Ngrok)" -ForegroundColor Yellow
Write-Host "3. Localhost Mode" -ForegroundColor Magenta
Write-Host "4. Android Emulator" -ForegroundColor Blue
Write-Host "5. Clear Cache + LAN" -ForegroundColor Red
Write-Host ""

$choice = Read-Host "Select option (1-5)"

switch ($choice) {
    "1" {
        Write-Host "Starting in LAN mode..." -ForegroundColor Green
        npx expo start --lan
    }
    "2" {
        Write-Host "Starting with Tunnel (ngrok)..." -ForegroundColor Yellow
        npx expo start --tunnel
    }
    "3" {
        Write-Host "Starting in Localhost mode..." -ForegroundColor Magenta
        npx expo start --localhost
    }
    "4" {
        Write-Host "Starting Android Emulator..." -ForegroundColor Blue
        npx expo start --android
    }
    "5" {
        Write-Host "Clearing cache and starting in LAN mode..." -ForegroundColor Red
        npx expo start --clear --lan
    }
    default {
        Write-Host "Invalid option. Starting in LAN mode by default..." -ForegroundColor Yellow
        npx expo start --lan
    }
}
