# Script para actualizar imports de useAuth
$files = @(
    "apps/web/src/screens/brand/BrandEditorScreen.tsx",
    "apps/web/src/screens/events/DateLiveScreen.tsx",
    "apps/web/src/screens/app/Profile.tsx",
    "apps/web/src/screens/profile/UserProfileLiveModern.tsx",
    "apps/web/src/screens/events/DateLiveScreenModern.tsx",
    "apps/web/src/screens/profile/ProfileCard.tsx",
    "apps/web/src/screens/profile/UserProfileEditor.tsx",
    "apps/web/src/screens/events/SocialLiveScreen.tsx",
    "apps/web/src/screens/events/OrganizerPublicScreen.tsx",
    "apps/web/src/screens/academy/AcademyEditScreen.tsx",
    "apps/web/src/screens/events/EventPublicScreen.tsx",
    "apps/web/src/screens/profile/UserProfileLive.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $newContent = $content -replace "from `"\.\./hooks/useAuth`"", "from `"@/contexts/AuthProvider`"" `
                                -replace "from `'\.\./hooks/useAuth`'", "from `'@/contexts/AuthProvider`'" `
                                -replace 'from `"\.\.\.\./hooks/useAuth`"', 'from `"@/contexts/AuthProvider`"' `
                                -replace "from `'\.\.\.\./hooks/useAuth`'", "from `'@/contexts/AuthProvider`'"
        
        if ($newContent -ne $content) {
            Set-Content $file -Value $newContent -NoNewline
            Write-Host "Updated: $file"
        }
    }
}

