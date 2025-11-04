# Lista backup
Get-ChildItem "\\GE055GE052SRV01\C$\inetpub\wwwroot" -Filter "GestioneCamerate.backup.*"

# Ripristina ultimo backup
$lastBackup = Get-ChildItem "\\GE055GE052SRV01\C$\inetpub\wwwroot" -Filter "GestioneCamerate.backup.*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

Remove-Item "\\GE055GE052SRV01\C$\inetpub\wwwroot\GestioneCamerate" -Recurse -Force
Copy-Item $lastBackup.FullName "\\GE055GE052SRV01\C$\inetpub\wwwroot\GestioneCamerate" -Recurse

Restart-Website -Name "GestioneCamerate" -ComputerName GE055GE052SRV01