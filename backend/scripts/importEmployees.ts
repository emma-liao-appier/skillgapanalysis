import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { connectDatabase } from '../src/config/database';
import { User } from '../src/models/User';

interface EmployeeData {
  Location: string;
  Name: string;
  Division: string;
  Department: string;
  Function: string;
  'Career Ladder': string;
  'Functional Specific Title': string;
  'Line Manager': string;
  'Job Level': string;
  'Company Entry Date': string;
  Email: string;
  'Market HRBP': string;
  'Functional Lead': string;
  'Market HRBP Email': string;
  'Functional Lead Email': string;
  'Line Manager Email': string;
}

async function importEmployeeData() {
  try {
    console.log('🔄 Starting employee data import...');
    
    // Connect to database
    await connectDatabase();
    
    const csvPath = path.join(__dirname, '../../g-sheet/cleaned_all_emp_20251015.csv');
    const employees: EmployeeData[] = [];
    
    // Read CSV file
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: EmployeeData) => {
          employees.push(row);
        })
        .on('end', () => {
          console.log(`📊 Read ${employees.length} employee records`);
          resolve();
        })
        .on('error', reject);
    });
    
    let imported = 0;
    let updated = 0;
    let errors = 0;
    
    // Process each employee
    for (const emp of employees) {
      try {
        if (!emp.Email || !emp.Name) {
          console.log(`⚠️  Skipping record with missing email or name: ${emp.Name || 'Unknown'}`);
          continue;
        }
        
        const userData = {
          email: emp.Email.toLowerCase().trim(),
          name: emp.Name.trim(),
          role: emp['Functional Specific Title']?.trim() || 'Unknown Role',
          department: emp.Department?.trim() || 'Unknown Department',
          division: emp.Division?.trim() || 'Unknown Division',
          location: emp.Location?.trim() || 'Unknown Location',
          jobLevel: emp['Job Level']?.trim() || 'Unknown Level',
          careerLadder: emp['Career Ladder']?.trim() || 'Unknown Ladder',
          lineManager: emp['Line Manager']?.trim() || 'Unknown Manager',
          lineManagerEmail: emp['Line Manager Email']?.trim() || '',
          functionalLead: emp['Functional Lead']?.trim() || 'Unknown Lead',
          functionalLeadEmail: emp['Functional Lead Email']?.trim() || '',
          companyEntryDate: emp['Company Entry Date']?.trim() || '',
          isEmployee: true // Mark as employee from imported data
        };
        
        // Check if user exists
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          // Update existing user
          await User.findByIdAndUpdate(existingUser._id, userData);
          updated++;
          console.log(`✅ Updated: ${userData.name} (${userData.email})`);
        } else {
          // Create new user
          await User.create(userData);
          imported++;
          console.log(`➕ Created: ${userData.name} (${userData.email})`);
        }
        
      } catch (error) {
        errors++;
        console.error(`❌ Error processing ${emp.Name}:`, error);
      }
    }
    
    console.log('\n📈 Import Summary:');
    console.log(`✅ Imported: ${imported} new users`);
    console.log(`🔄 Updated: ${updated} existing users`);
    console.log(`❌ Errors: ${errors} failed records`);
    console.log(`📊 Total processed: ${imported + updated + errors} records`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importEmployeeData();
