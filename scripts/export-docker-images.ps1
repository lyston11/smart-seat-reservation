param(
    [string] $BackendImage = "smart-seat-backend:local",
    [string] $FrontendImage = "smart-seat-frontend:local",
    [string] $OutputDir = "deploy/artifacts",
    [string] $ArchiveName = "smart-seat-images-local.tar"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-DockerImageExists {
    param([string] $ImageName)

    docker image inspect $ImageName *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker image '$ImageName' was not found. Build it before exporting."
    }
}

Assert-DockerImageExists -ImageName $BackendImage
Assert-DockerImageExists -ImageName $FrontendImage

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$archivePath = Join-Path $OutputDir $ArchiveName

docker save --output $archivePath $BackendImage $FrontendImage
if ($LASTEXITCODE -ne 0) {
    throw "docker save failed."
}

$resolvedArchive = Resolve-Path $archivePath
Write-Host "Exported Docker images to $resolvedArchive"
Write-Host "Upload it to /srv/projects/smart-seat-reservation/ on the server."
Write-Host "Then from /srv/projects/smart-seat-reservation/source run: scripts/load-docker-images.sh ../$ArchiveName --up"
