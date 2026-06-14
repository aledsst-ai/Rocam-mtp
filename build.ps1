$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$sections = @(
    @{name='header'; file='header/header.html'},
    @{name='dashboard'; file='dashboard/dashboard.html'},
    @{name='sobre'; file='sobre/sobre.html'},
    @{name='membros-ao-vivo'; file='membros-ao-vivo/membros-ao-vivo.html'},
    @{name='hierarquia'; file='hierarquia/hierarquia.html'},
    @{name='galeria'; file='galeria/galeria.html'},
    @{name='viaturas'; file='viaturas/viaturas.html'},
    @{name='apreensoes'; file='apreensoes/apreensoes.html'},
    @{name='footer'; file='footer/footer.html'}
)

$utf8NoBom = New-Object System.Text.UTF8Encoding $false

$combined = ""
foreach ($s in $sections) {
    $path = Join-Path $root "sections\$($s.file)"
    if (Test-Path $path) {
        $content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
        $combined += $content.TrimEnd() + "`r`n`r`n"
        Write-Host "  + $($s.file)"
    } else {
        Write-Host "  ! MISSING: $($s.file)"
    }
}

$indexPath = Join-Path $root "index.html"
$index = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)

$startMarker = '<div id="app">'
$endMarker = '<div id="app-end"></div>'

$startIdx = $index.IndexOf($startMarker)
$endIdx = $index.IndexOf($endMarker, $startIdx + $startMarker.Length)

if ($startIdx -ge 0 -and $endIdx -gt $startIdx) {
    $before = $index.Substring(0, $startIdx + $startMarker.Length)
    $after  = $index.Substring($endIdx)
    $result = $before + "`r`n" + $combined.TrimEnd() + "`r`n" + $after
    [System.IO.File]::WriteAllText($indexPath, $result, [System.Text.Encoding]::UTF8)
    Write-Host "`nDone! index.html rebuilt with $($sections.Count) sections."
} else {
    Write-Host "`nERROR: Could not find '<div id=`"app`">' in index.html"
}
