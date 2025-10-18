import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { connectDatabase } from '../src/config/database';
import { Skill, SkillCategory, SkillType } from '../src/models/Skill';

interface SkillCatalogueData {
  ID: string;
  category: string;
  skill: string;
  skill_description: string;
  skill_benefit: string;
  division: string;
  department: string;
}

// 映射類別名稱到枚舉
const categoryMapping: { [key: string]: SkillCategory } = {
  'Problem Solving & Critical thinking': SkillCategory.ProblemSolving,
  'Communication & Teamwork': SkillCategory.Communication,
  'Leadership – Leading Self': SkillCategory.Leadership,
  'Leadership – Leading Others': SkillCategory.Leadership,
  'Leadership – Leading Business': SkillCategory.Leadership,
  'AI Capability': SkillCategory.AICapability
};

async function importSkillCatalogue() {
  try {
    console.log('🔄 Starting skill catalogue import...');
    
    // Connect to database
    await connectDatabase();
    
    const csvPath = path.join(__dirname, '../../g-sheet/Skill_catalogue_to be reviewed - skill for SGA.csv');
    const skillRecords: SkillCatalogueData[] = [];
    
    // Read CSV file
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row: SkillCatalogueData) => {
          skillRecords.push(row);
        })
        .on('end', () => {
          console.log(`📊 Read ${skillRecords.length} skill records`);
          resolve();
        })
        .on('error', reject);
    });
    
    let imported = 0;
    let updated = 0;
    let errors = 0;
    
    // Process each skill record
    for (const record of skillRecords) {
      try {
        if (!record.skill || !record.category) {
          console.log(`⚠️  Skipping record with missing skill or category: ${record.skill || 'Unknown'}`);
          continue;
        }
        
        // 生成唯一技能ID
        const skillId = `skill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 映射類別
        const category = categoryMapping[record.category] || SkillCategory.Functional;
        
        const skillData = {
          skillId,
          name: record.skill.trim(),
          description: record.skill_description?.trim() || record.skill.trim(),
          skillBenefit: record.skill_benefit?.trim() || 'General skill benefit',
          category,
          type: SkillType.General, // 所有目錄技能都是通用技能
          division: record.division?.trim() || 'General',
          department: record.department?.trim() || 'General',
          isActive: true
        };
        
        // Check if skill already exists (by name and category)
        const existingSkill = await Skill.findOne({ 
          name: skillData.name,
          category: skillData.category
        });
        
        if (existingSkill) {
          // Update existing skill
          await Skill.findByIdAndUpdate(existingSkill._id, skillData);
          updated++;
          console.log(`✅ Updated: ${skillData.name} (${skillData.category})`);
        } else {
          // Create new skill
          await Skill.create(skillData);
          imported++;
          console.log(`➕ Created: ${skillData.name} (${skillData.category})`);
        }
        
      } catch (error) {
        errors++;
        console.error(`❌ Error processing ${record.skill}:`, error);
      }
    }
    
    console.log('\n📈 Skill Catalogue Import Summary:');
    console.log(`✅ Imported: ${imported} new skills`);
    console.log(`🔄 Updated: ${updated} existing skills`);
    console.log(`❌ Errors: ${errors} failed records`);
    console.log(`📊 Total processed: ${imported + updated + errors} records`);
    
    // 顯示統計信息
    const categoryStats = await Skill.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Skills by Category:');
    categoryStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} skills`);
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Skill catalogue import failed:', error);
    process.exit(1);
  }
}

// Run the import
importSkillCatalogue();
