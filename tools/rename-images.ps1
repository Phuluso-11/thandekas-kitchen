# rename-images.ps1 - gives every image a descriptive, keyword-rich file name (Part 3 SEO).
# Run once from the project root:
#   powershell -ExecutionPolicy Bypass -File tools\rename-images.ps1
# It uses "git mv" so Git records a rename and keeps the file history.

$folder = "images/gallery"
$renames = @(
    @("cake-1", "two-tier-floral-celebration-cake-johannesburg"),
    @("cake-2", "chocolate-birthday-cake-johannesburg"),
    @("pastries-1", "fresh-croissants-pastries-display"),
    @("catering-1", "corporate-catering-pastry-platters-johannesburg"),
    @("bread-1", "artisan-bread-loaves-cooling-rack"),
    @("event-1", "wedding-dessert-table-catering"),
    @("hero-bakery", "artisan-bakery-bread-pastries-counter"),
    @("founder-thandeka", "thandeka-mokoena-founder-baker")
)

foreach ($pair in $renames) {
    foreach ($suffix in @("", "-800")) {
        $old = "$folder/$($pair[0])$suffix.jpg"
        $new = "$folder/$($pair[1])$suffix.jpg"
        if (Test-Path $old) {
            git mv $old $new
            Write-Host "Renamed $old -> $new"
        } else {
            Write-Host "Skipped (not found): $old"
        }
    }
}
