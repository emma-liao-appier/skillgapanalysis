import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { connectDatabase } from '../src/config/database';
import { User } from '../src/models/User';

interface OkrData {
  Email: string;
  'Q4 okr': string;
}

async function importOkrData() {
  try {
    console.log('🔄 Starting OKR data import...');
    
    // Connect to database
    await connectDatabase();
    
    const csvPath = path.join(__dirname, '../../g-sheet/cleaned_all_emp_20251015 - Q4_okr.csv');
    const okrRecords: OkrData[] = [];
    
    // Read CSV file
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: OkrData) => {
          okrRecords.push(row);
        })
        .on('end', () => {
          console.log(`📊 Read ${okrRecords.length} OKR records`);
          resolve();
        })
        .on('error', reject);
    });
    
    let updated = 0;
    let notFound = 0;
    let errors = 0;
    
    // Process each OKR record
    for (const record of okrRecords) {
      try {
        if (!record.Email || !record['Q4 okr']) {
          console.log(`⚠️  Skipping record with missing email or OKR: ${record.Email || 'Unknown'}`);
          continue;
        }
        
        const email = record.Email.toLowerCase().trim();
        const q4Okr = record['Q4 okr'].trim();
        
        // Find user by email
        const user = await User.findOne({ email });
        
        if (user) {
          // Update user with OKR data
          await User.findByIdAndUpdate(user._id, { q4Okr });
          updated++;
          console.log(`✅ Updated OKR for: ${user.name} (${email})`);
        } else {
          notFound++;
          console.log(`⚠️  User not found for email: ${email}`);
        }
        
      } catch (error) {
        errors++;
        console.error(`❌ Error processing ${record.Email}:`, error);
      }
    }
    
    console.log('\n📈 OKR Import Summary:');
    console.log(`✅ Updated: ${updated} users with OKR data`);
    console.log(`⚠️  Not found: ${notFound} users not in database`);
    console.log(`❌ Errors: ${errors} failed records`);
    console.log(`📊 Total processed: ${updated + notFound + errors} records`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 OKR import failed:', error);
    process.exit(1);
  }
}

// Run the import
importOkrData();
