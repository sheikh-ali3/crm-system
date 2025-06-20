$LocalDb = "crm"
$DumpDir = ".\dump"
$MongoURI = $env:MONGO_ATLAS_URI  # Must be set in your environment

Write-Host "🔄 Dumping local MongoDB database..."
mongodump --db $LocalDb --out $DumpDir

Write-Host "🚀 Restoring to MongoDB Atlas..."
mongorestore --uri $MongoURI "$DumpDir\$LocalDb"

Write-Host "✅ Migration complete!"
