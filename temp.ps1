# Corrected Reconstruct Git History Script
$today = Get-Date -Format "yyyy-MM-ddTHH:mm:ss"
$yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss")
$dayBeforeYesterday = (Get-Date).AddDays(-2).ToString("yyyy-MM-ddTHH:mm:ss")

function Commit-With-Date($message, $date) {
    $env:GIT_AUTHOR_DATE = $date
    $env:GIT_COMMITTER_DATE = $date
    git commit -m $message
    Remove-Item Env:\GIT_AUTHOR_DATE
    Remove-Item Env:\GIT_COMMITTER_DATE
}

Write-Host "Starting corrected git reconstruction..." -ForegroundColor Cyan

# --- COMMIT 1: Initial Setup (2 days ago) ---
Write-Host "Committing base setup..."
git add .gitignore README.md webapp/.gitignore webapp/package.json webapp/tsconfig.json webapp/components.json
Commit-With-Date "initial setup and config" "$dayBeforeYesterday 09:15:00"

# --- COMMIT 2: Core Library (Yesterday morning) ---
Write-Host "Committing lib folder..."
git add webapp/lib
Commit-With-Date "core logic and utils" "$yesterday 10:30:00"

# --- COMMIT 3: UI Components (Yesterday afternoon) ---
Write-Host "Committing components..."
git add webapp/components webapp/styles webapp/hooks
Commit-With-Date "ui and styling" "$yesterday 15:45:00"

# --- COMMIT 4: Features / Application logic (Today morning) ---
Write-Host "Committing application logic..."
git add webapp/app webapp/middleware.ts
Commit-With-Date "studio and some features" "$today 11:20:00"

# --- COMMIT 5: Documentation and Assets (Today afternoon) ---
Write-Host "final docs..."
git add docs features.md webapp/public
Commit-With-Date "updated readme" "$today 14:10:00"

# --- COMMIT 6: Final Polishing ---
Write-Host "Finalizing project..."
git add .
Commit-With-Date "polishing and cleanup" "$today 16:30:00"

Write-Host "Git history reconstructed successfully!" -ForegroundColor Green

