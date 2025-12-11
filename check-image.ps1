Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("d:\VS Code\Fluentoria\public\logo.png")
Write-Output "Width: $($img.Width)px"
Write-Output "Height: $($img.Height)px"
Write-Output "Format: $($img.RawFormat.ToString())"
$img.Dispose()
