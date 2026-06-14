$ErrorActionPreference = 'Stop'

$BundledNode = 'C:\Users\Crist\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
if (Test-Path -LiteralPath $BundledNode) {
    & $BundledNode scripts\build.mjs
}
else {
    node scripts\build.mjs
}
