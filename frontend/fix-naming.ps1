$src = "D:\Slatt1\PROGRAMMING\mymoney\frontend\src"

function ReplaceIn([string]$filePath, $replacements) {
    $content = Get-Content -LiteralPath $filePath -Raw
    $original = $content
    foreach ($r in $replacements) {
        $escaped = [regex]::Escape($r[0])
        $content = $content -replace $escaped, $r[1]
    }
    if ($content -ne $original) {
        Set-Content -LiteralPath $filePath -Value $content -NoNewLine
        return $true
    }
    return $false
}

# edit-mode-button.tsx
ReplaceIn "$src\components\dashboard\categories\edit-mode-button.tsx" @(
    @("isActive`n          ? 'bg-accent text-accent-foreground", "isActive`n          ? 'bg-accent text-accent-foreground")
)

Write-Host "Done"
