<#
.SYNOPSIS
  Next.js Route Diagnostic Script
  Collects file existence, build output, configs, and git status in one shot.
  Run from the project root:  .\diagnose-routes.ps1
#>

$ErrorActionPreference = 'Continue'
$ProjectRoot = Get-Location

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " NEXT.JS ROUTE DIAGNOSTIC" -ForegroundColor Cyan
Write-Host " Project: $ProjectRoot" -ForegroundColor Cyan
Write-Host " Date:    $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# ---- 1. File existence & paths ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 1. FILE EXISTENCE & PATHS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$TargetFiles = @(
    "app/api/health/route.ts"
    "app/api/cron/verify-integrity/route.ts"
    "app/debug/page.tsx"
)

Write-Host "`nTarget routes:" -ForegroundColor Yellow
foreach ($f in $TargetFiles) {
    $FullPath = Join-Path $ProjectRoot $f
    if (Test-Path $FullPath) {
        Write-Host "  [OK]   $f" -ForegroundColor Green
        Write-Host "         -> $FullPath" -ForegroundColor DarkGray
    } else {
        Write-Host "  [MISS] $f" -ForegroundColor Red
        Write-Host "         -> $FullPath" -ForegroundColor Red
    }
}

# ---- 2. First 30 lines of each target file ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 2. FILE CONTENTS (first 30 lines)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($f in $TargetFiles) {
    $FullPath = Join-Path $ProjectRoot $f
    if (Test-Path $FullPath) {
        Write-Host "`n--- $f ---" -ForegroundColor Yellow
        Get-Content $FullPath -TotalCount 30 | ForEach-Object { Write-Host $_ }
    } else {
        Write-Host "`n--- $f --- [FILE NOT FOUND]" -ForegroundColor Red
    }
}

# ---- 3. All API route files (discovery) ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 3. ALL API ROUTE FILES (recursive)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$AllApiRoutes = Get-ChildItem -Path (Join-Path $ProjectRoot "app/api") -Recurse -Filter "route.ts" -ErrorAction SilentlyContinue
if ($AllApiRoutes) {
    $AllApiRoutes | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "  [NONE FOUND]" -ForegroundColor Red
}

# ---- 4. All page files in app/ (excluding node_modules) ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 4. ALL PAGE FILES (page.tsx in app/)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$AllPages = Get-ChildItem -Path (Join-Path $ProjectRoot "app") -Recurse -Filter "page.tsx" -ErrorAction SilentlyContinue
if ($AllPages) {
    $AllPages | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "  [NONE FOUND]" -ForegroundColor Red
}

# ---- 5. next.config.js ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 5. next.config.js" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$NextConfig = Join-Path $ProjectRoot "next.config.js"
if (Test-Path $NextConfig) {
    Write-Host "`n--- Full contents ---" -ForegroundColor Yellow
    Get-Content $NextConfig | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "  [FILE NOT FOUND]" -ForegroundColor Red
}

# Also check for next.config.mjs or next.config.ts
foreach ($alt in @("next.config.mjs", "next.config.ts")) {
    $AltPath = Join-Path $ProjectRoot $alt
    if (Test-Path $AltPath) {
        Write-Host "`n--- $alt found ---" -ForegroundColor Yellow
        Get-Content $AltPath | ForEach-Object { Write-Host $_ }
    }
}

# ---- 6. tsconfig.json ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 6. tsconfig.json" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$TsConfig = Join-Path $ProjectRoot "tsconfig.json"
if (Test-Path $TsConfig) {
    Write-Host "`n--- Full contents ---" -ForegroundColor Yellow
    Get-Content $TsConfig | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "  [FILE NOT FOUND]" -ForegroundColor Red
}

# ---- 7. .vercelignore ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 7. .vercelignore" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$VercelIgnore = Join-Path $ProjectRoot ".vercelignore"
if (Test-Path $VercelIgnore) {
    Write-Host "`n--- Contents ---" -ForegroundColor Yellow
    Get-Content $VercelIgnore | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "  [NO .vercelignore — good]" -ForegroundColor Green
}

# ---- 8. vercel.json ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 8. vercel.json" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$VercelJson = Join-Path $ProjectRoot "vercel.json"
if (Test-Path $VercelJson) {
    Write-Host "`n--- Full contents ---" -ForegroundColor Yellow
    Get-Content $VercelJson | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "  [NO vercel.json]" -ForegroundColor Yellow
}

# ---- 9. .gitignore (check for app/api or app/debug exclusions) ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 9. .gitignore (checking for route exclusions)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$GitIgnore = Join-Path $ProjectRoot ".gitignore"
if (Test-Path $GitIgnore) {
    $GitIgnoreContent = Get-Content $GitIgnore
    $SuspiciousLines = $GitIgnoreContent | Where-Object { $_ -match 'app/api|app/debug|\.next|build|out' }
    if ($SuspiciousLines) {
        Write-Host "  [SUSPICIOUS] Lines that might affect routes:" -ForegroundColor Yellow
        $SuspiciousLines | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
    } else {
        Write-Host "  [OK] No app/api or app/debug exclusions found" -ForegroundColor Green
    }
    Write-Host "`n--- Full .gitignore ---" -ForegroundColor Yellow
    $GitIgnoreContent | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "  [NO .gitignore]" -ForegroundColor Yellow
}

# ---- 10. package.json (scripts + dependencies) ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 10. package.json — build script & dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$Pkg = Join-Path $ProjectRoot "package.json"
if (Test-Path $Pkg) {
    $PkgJson = Get-Content $Pkg | ConvertFrom-Json
    Write-Host "`nScripts:" -ForegroundColor Yellow
    $PkgJson.scripts | Format-List | Out-String | ForEach-Object { Write-Host $_ }

    Write-Host "`nKey dependencies:" -ForegroundColor Yellow
    Write-Host "  next:          $($PkgJson.dependencies.next)"
    if ($PkgJson.dependencies.PSObject.Properties.Name -contains '@supabase/ssr') {
        Write-Host "  @supabase/ssr: $($PkgJson.dependencies.'@supabase/ssr')"
    }
    if ($PkgJson.dependencies.PSObject.Properties.Name -contains '@supabase/supabase-js') {
        Write-Host "  @supabase/supabase-js: $($PkgJson.dependencies.'@supabase/supabase-js')"
    }
    Write-Host "  react:         $($PkgJson.dependencies.react)"
    Write-Host "  react-dom:     $($PkgJson.dependencies.'react-dom')"
}

# ---- 11. Git status ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 11. GIT STATUS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

try {
    $GitStatus = git status --short 2>$null
    if ($GitStatus) {
        Write-Host "`nUncommitted changes:" -ForegroundColor Yellow
        $GitStatus | ForEach-Object { Write-Host "  $_" }
        
        # Specifically check if target files are uncommitted
        foreach ($f in $TargetFiles) {
            $Match = $GitStatus | Where-Object { $_ -match [Regex]::Escape($f) }
            if ($Match) {
                Write-Host "  *** $f is NOT committed! ***" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "`nWorking tree is clean (no uncommitted changes)" -ForegroundColor Green
    }

    # Show recent commits for target files
    foreach ($f in $TargetFiles) {
        $Log = git log --oneline -1 -- $f 2>$null
        if ($Log) {
            Write-Host "`nLast commit touching $f : $Log" -ForegroundColor DarkGray
        } else {
            Write-Host "`n$f : never committed" -ForegroundColor Red
        }
    }

    # Check current branch and ahead/behind
    $Branch = git rev-parse --abbrev-ref HEAD 2>$null
    $AheadBehind = git rev-list --left-right --count origin/$Branch...HEAD 2>$null
    if ($AheadBehind) {
        $Parts = $AheadBehind -split '\s+'
        Write-Host "`nBranch: $Branch (ahead $($Parts[0]), behind $($Parts[1]) of origin/$Branch)" -ForegroundColor Cyan
    } else {
        Write-Host "`nBranch: $Branch" -ForegroundColor Cyan
    }

} catch {
    Write-Host "  [ERROR] Could not get git status: $_" -ForegroundColor Red
}

# ---- 12. Local build output ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 12. LOCAL BUILD — Route Table" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running 'next build' — this will take 30-60 seconds..." -ForegroundColor Yellow

# We capture the full output to a temp file and then show relevant sections
$BuildOutput = Join-Path $env:TEMP "next-build-output.txt"
try {
    # Run build, capture stdout and stderr
    npx next build 2>&1 | Tee-Object -FilePath $BuildOutput | Out-Host
} catch {
    Write-Host "  [BUILD FAILED]" -ForegroundColor Red
}

if (Test-Path $BuildOutput) {
    $BuildContent = Get-Content $BuildOutput -Raw
    
    Write-Host "`n`n--- Route Table (lines containing '/api/' or '/debug') ---" -ForegroundColor Magenta
    $RouteLines = $BuildContent | Select-String -Pattern '(Route \(app\)|/api/|/debug|λ|○|ƒ)' -SimpleMatch
    if ($RouteLines) {
        $RouteLines | ForEach-Object { Write-Host "  $($_.Line)" }
    } else {
        Write-Host "  [NO MATCHING LINES FOUND]" -ForegroundColor Red
    }

    Write-Host "`n`n--- Error/Warning lines ---" -ForegroundColor Magenta
    $ErrorLines = $BuildContent | Select-String -Pattern '(error|Error|ERROR|warning|Warning|WARNING|Module not found|Cannot find module|Failed to compile)' 
    if ($ErrorLines) {
        $ErrorLines | ForEach-Object { Write-Host "  ERR: $($_.Line)" -ForegroundColor Red }
    } else {
        Write-Host "  [NO ERRORS/WARNINGS]" -ForegroundColor Green
    }

    Write-Host "`n`n--- Full Route (app) section ---" -ForegroundColor Magenta
    $InRouteSection = $false
    foreach ($line in ($BuildContent -split "`r`n|`n")) {
        if ($line -match '^Route \(app\)') {
            $InRouteSection = $true
        }
        if ($InRouteSection) {
            Write-Host "  $line"
            if ($line -match '^$' -and $InRouteSection) {
                # End of route section when we hit a blank line after routes
                # Actually, end on next section header
                $InRouteSection = $false
            }
        }
    }

    # Check build artifacts
    Write-Host "`n`n--- Build artifacts check ---" -ForegroundColor Yellow
    $ArtifactPaths = @(
        ".next/server/app/api/health/route.js"
        ".next/server/app/api/cron/verify-integrity/route.js"
        ".next/server/app/debug/page.js"
    )
    foreach ($art in $ArtifactPaths) {
        $ArtPath = Join-Path $ProjectRoot $art
        if (Test-Path $ArtPath) {
            Write-Host "  [OK]   $art" -ForegroundColor Green
        } elseif (Test-Path ($ArtPath -replace '\.js$', '.mjs')) {
            Write-Host "  [OK]   $($art -replace '\.js$', '.mjs')" -ForegroundColor Green
        } else {
            Write-Host "  [MISS] $art" -ForegroundColor Red
        }
    }
}

# ---- 13. Check for src/ directory conflict ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 13. CHECK FOR src/ DIRECTORY CONFLICT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$SrcApp = Join-Path $ProjectRoot "src/app"
if (Test-Path $SrcApp) {
    Write-Host "  [ALERT] src/app/ EXISTS — Next.js may prefer this over app/!" -ForegroundColor Red
    $SrcApi = Get-ChildItem -Path (Join-Path $ProjectRoot "src/app/api") -Recurse -Filter "route.ts" -ErrorAction SilentlyContinue
    if ($SrcApi) {
        Write-Host "  Routes in src/app/api:" -ForegroundColor Red
        $SrcApi | ForEach-Object { Write-Host "    $_" -ForegroundColor Red }
    }
} else {
    Write-Host "  [OK] No src/ directory — no conflict" -ForegroundColor Green
}

# ---- 14. Check for middleware ----
Write-Host "`n`n========================================" -ForegroundColor Cyan
Write-Host " 14. CHECK FOR MIDDLEWARE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$MiddlewarePaths = @(
    "middleware.ts",
    "src/middleware.ts",
    "app/middleware.ts"
)
$FoundMiddleware = $false
foreach ($mw in $MiddlewarePaths) {
    $MwPath = Join-Path $ProjectRoot $mw
    if (Test-Path $MwPath) {
        Write-Host "  [FOUND] $mw" -ForegroundColor Yellow
        $FoundMiddleware = $true
        Write-Host "  --- First 20 lines ---" -ForegroundColor Yellow
        Get-Content $MwPath -TotalCount 20 | ForEach-Object { Write-Host "    $_" }
    }
}
if (-not $FoundMiddleware) {
    Write-Host "  [OK] No middleware.ts found" -ForegroundColor Green
}

# ---- 15. Summary ----
Write-Host "`n`n============================================================" -ForegroundColor Cyan
Write-Host " SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$Issues = @()

# Check each target file exists
foreach ($f in $TargetFiles) {
    if (-not (Test-Path (Join-Path $ProjectRoot $f))) {
        $Issues += "[CRITICAL] $f does not exist on disk"
    }
}

# Check for src/ conflict
if (Test-Path $SrcApp) {
    $Issues += "[CRITICAL] src/app/ exists — Next.js may use it instead of app/"
}

# Check build artifacts
foreach ($art in $ArtifactPaths) {
    if (-not (Test-Path (Join-Path $ProjectRoot $art))) {
        $Issues += "[BUILD] $art was not generated by build"
    }
}

# Check if files are committed
try {
    foreach ($f in $TargetFiles) {
        $Log = git log --oneline -1 -- $f 2>$null
        if (-not $Log) {
            $Issues += "[GIT] $f has never been committed"
        }
    }
} catch {}

if ($Issues.Count -eq 0) {
    Write-Host "`nNo obvious issues detected — the problem is likely in Vercel's configuration." -ForegroundColor Yellow
    Write-Host "  Check: Dashboard → Settings → General → Framework Preset = Next.js" -ForegroundColor Yellow
    Write-Host "  Check: Dashboard → Settings → General → Output Directory = blank" -ForegroundColor Yellow
    Write-Host "  Check: Previous deployment logs for any build errors" -ForegroundColor Yellow
} else {
    Write-Host "`n$($Issues.Count) issue(s) found:" -ForegroundColor Red
    $Issues | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " DIAGNOSTIC COMPLETE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
