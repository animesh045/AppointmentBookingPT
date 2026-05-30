# ==============================================================================
# ANANYA ENTERPRISES - MULTI-SERVICE CLOUD RUN DEPLOYER
# ==============================================================================
#
# This script deploys the Next.js unified workspace to Google Cloud Run
# as three dedicated separate services, injecting real environment credentials.
#
# Prerequisite: Make sure you have Google Cloud SDK installed and are logged in:
#   gcloud auth login
#   gcloud config set project appoint-2a29c
#
# ==============================================================================

$ProjectID = "appoint-2a29c"
$Region = "asia-south1"

# Shared Secret Keys
$EnvVars = @(
  "NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCC3jf8zvRJwbg1ZJ7DxsN1QqPFRcKgMkk",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=appoint-2a29c.firebaseapp.com",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID=appoint-2a29c",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=appoint-2a29c.firebasestorage.app",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=263825956101",
  "NEXT_PUBLIC_FIREBASE_APP_ID=1:263825956101:web:9cb10b304c900876ae2b6c",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-Q024RKMTVX",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_SvfkNrP3Iv8T5b",
  "RAZORPAY_KEY_SECRET=KNCKoizwfiLnKXSh6IdMGJWU"
) -join ","

Clear-Host
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         ANANYA ENTERPRISES - MULTI-PORTAL DEPLOYMENT SUITE           " -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Target GCP Project: $ProjectID" -ForegroundColor Yellow
Write-Host "Target Region     : $Region" -ForegroundColor Yellow
Write-Host ""

Write-Host "1) Deploy [Patient / Consumer Portal] -> Service: ananya-consumer" -ForegroundColor White
Write-Host "2) Deploy [Doctor Clinic Portal]    -> Service: ananya-doctor" -ForegroundColor White
Write-Host "3) Deploy [Administrator Panel]     -> Service: ananya-admin" -ForegroundColor White
Write-Host "4) Deploy All Services" -ForegroundColor White
Write-Host "5) Exit" -ForegroundColor Red
Write-Host ""

$Choice = Read-Host "Select deployment target [1-5]"

function Deploy-Service ($ServiceName, $AppRole) {
  Write-Host ""
  Write-Host "----------------------------------------------------------------------" -ForegroundColor Magenta
  Write-Host "Deploying Service: $ServiceName (Role: $AppRole)" -ForegroundColor Cyan
  Write-Host "----------------------------------------------------------------------" -ForegroundColor Magenta
  
  # Concatenate environment variables with specific App Role
  $FullEnvVars = "$EnvVars,NEXT_PUBLIC_APP_ROLE=$AppRole"
  
  # Execute gcloud run deploy
  gcloud run deploy $ServiceName `
    --source . `
    --project $ProjectID `
    --region $Region `
    --allow-unauthenticated `
    --set-env-vars $FullEnvVars
    
  if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Service '$ServiceName' deployed successfully!" -ForegroundColor Green
  } else {
    Write-Host "`n✗ Deployment of '$ServiceName' failed." -ForegroundColor Red
  }
}

switch ($Choice) {
  "1" {
    Deploy-Service "ananya-consumer" "consumer"
  }
  "2" {
    Deploy-Service "ananya-doctor" "doctor"
  }
  "3" {
    Deploy-Service "ananya-admin" "admin"
  }
  "4" {
    Deploy-Service "ananya-consumer" "consumer"
    Deploy-Service "ananya-doctor" "doctor"
    Deploy-Service "ananya-admin" "admin"
    Write-Host "`n★ All services deployed successfully!" -ForegroundColor Green
  }
  "5" {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    Exit
  }
  Default {
    Write-Host "Invalid selection." -ForegroundColor Red
  }
}
