import mongoose from 'mongoose';
import { Assessment } from '../src/models/Assessment';
import { connectDatabase } from '../src/config/database';
import { config } from '../src/config/environment';

/**
 * 資料庫遷移腳本：為現有的 Assessment 文件添加缺失的欄位
 */
async function migrateAssessmentSchema() {
  try {
    console.log('🔄 開始 Assessment Schema 遷移...');
    console.log(`📊 資料庫 URI: ${config.mongodbUri}`);
    
    // 檢查是否需要認證
    if (config.mongodbUri.includes('mongodb+srv://') || config.mongodbUri.includes('@')) {
      console.log('⚠️  檢測到雲端 MongoDB 連接，請確保您的資料庫認證資訊正確');
      console.log('💡 如果遇到認證錯誤，請檢查您的 .env 檔案中的 MONGODB_URI');
    }
    
    // 連接資料庫
    await connectDatabase();
    
    // 獲取所有現有的 Assessment 文件
    const assessments = await Assessment.find({});
    console.log(`📊 找到 ${assessments.length} 個 Assessment 文件需要遷移`);
    
    let migratedCount = 0;
    
    for (const assessment of assessments) {
      let needsUpdate = false;
      const updates: any = {};
      
      // 添加缺失的 period 欄位
      if (!assessment.period) {
        updates.period = '2025Q4';
        needsUpdate = true;
      }
      
      // 添加缺失的 nextStepsOther 欄位
      if (assessment.nextStepsOther === undefined) {
        updates.nextStepsOther = '';
        needsUpdate = true;
      }
      
      // 添加缺失的 finalThoughts 欄位
      if (assessment.finalThoughts === undefined) {
        updates.finalThoughts = '';
        needsUpdate = true;
      }
      
      // 添加缺失的 analytics 欄位
      if (assessment.readinessBusiness === undefined) {
        updates.readinessBusiness = 0;
        needsUpdate = true;
      }
      
      if (assessment.readinessCareer === undefined) {
        updates.readinessCareer = 0;
        needsUpdate = true;
      }
      
      if (assessment.alignmentScore === undefined) {
        updates.alignmentScore = 0;
        needsUpdate = true;
      }
      
      if (assessment.talentType === undefined) {
        updates.talentType = '';
        needsUpdate = true;
      }
      
      if (assessment.focusAreas === undefined) {
        updates.focusAreas = [];
        needsUpdate = true;
      }
      
      if (assessment.categoryAverages === undefined) {
        updates.categoryAverages = {};
        needsUpdate = true;
      }
      
      // 添加缺失的 legacy 欄位
      if (assessment.peerFeedback === undefined) {
        updates.peerFeedback = '';
        needsUpdate = true;
      }
      
      if (assessment.careerIntro === undefined) {
        updates.careerIntro = '';
        needsUpdate = true;
      }
      
      if (assessment.careerFeedback === undefined) {
        updates.careerFeedback = '';
        needsUpdate = true;
      }
      
      if (assessment.summary === undefined) {
        updates.summary = null;
        needsUpdate = true;
      }
      
      // 如果需要更新，則執行更新
      if (needsUpdate) {
        await Assessment.findByIdAndUpdate(assessment._id, updates);
        migratedCount++;
        console.log(`✅ 已遷移 Assessment: ${assessment._id}`);
      }
    }
    
    console.log(`🎉 遷移完成！共遷移了 ${migratedCount} 個文件`);
    
    // 驗證遷移結果
    console.log('\n📋 驗證遷移結果...');
    const sampleAssessment = await Assessment.findOne({});
    if (sampleAssessment) {
      console.log('✅ 範例文件欄位檢查:');
      console.log(`- period: ${sampleAssessment.period || '❌ 缺失'}`);
      console.log(`- nextStepsOther: ${sampleAssessment.nextStepsOther !== undefined ? '✅' : '❌ 缺失'}`);
      console.log(`- finalThoughts: ${sampleAssessment.finalThoughts !== undefined ? '✅' : '❌ 缺失'}`);
      console.log(`- readinessBusiness: ${sampleAssessment.readinessBusiness !== undefined ? '✅' : '❌ 缺失'}`);
      console.log(`- readinessCareer: ${sampleAssessment.readinessCareer !== undefined ? '✅' : '❌ 缺失'}`);
      console.log(`- alignmentScore: ${sampleAssessment.alignmentScore !== undefined ? '✅' : '❌ 缺失'}`);
      console.log(`- talentType: ${sampleAssessment.talentType !== undefined ? '✅' : '❌ 缺失'}`);
      console.log(`- focusAreas: ${sampleAssessment.focusAreas !== undefined ? '✅' : '❌ 缺失'}`);
      console.log(`- categoryAverages: ${sampleAssessment.categoryAverages !== undefined ? '✅' : '❌ 缺失'}`);
      console.log(`- peerFeedback: ${sampleAssessment.peerFeedback !== undefined ? '✅' : '❌ 缺失'}`);
      console.log(`- careerIntro: ${sampleAssessment.careerIntro !== undefined ? '✅' : '❌ 缺失'}`);
      console.log(`- careerFeedback: ${sampleAssessment.careerFeedback !== undefined ? '✅' : '❌ 缺失'}`);
      console.log(`- summary: ${sampleAssessment.summary !== undefined ? '✅' : '❌ 缺失'}`);
    }
    
  } catch (error) {
    console.error('❌ 遷移過程中發生錯誤:', error);
  } finally {
    // 關閉資料庫連接
    await mongoose.connection.close();
    console.log('🔌 資料庫連接已關閉');
    process.exit(0);
  }
}

// 執行遷移
if (require.main === module) {
  migrateAssessmentSchema();
}

export { migrateAssessmentSchema };
