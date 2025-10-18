import { Request, Response } from 'express';
import { google } from 'googleapis';
import { Assessment } from '../models/Assessment';
import { User } from '../models/User';
import { config } from '../config/environment';

export class SheetsController {
  private sheets: any;

  constructor() {
    this.initializeSheets();
  }

  private async initializeSheets() {
    try {
      // For now, we'll use API key authentication
      // In production, you might want to use OAuth2 or service account
      if (config.googleSheetsClientId && config.googleSheetsClientSecret) {
        const auth = new google.auth.OAuth2(
          config.googleSheetsClientId,
          config.googleSheetsClientSecret,
          config.googleSheetsRedirectUri
        );
        
        this.sheets = google.sheets({ version: 'v4', auth });
      } else {
        // Fallback to API key if OAuth not configured
        const auth = new google.auth.GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        
        this.sheets = google.sheets({ version: 'v4', auth });
      }
    } catch (error) {
      console.error('Error initializing Google Sheets API:', error);
    }
  }

  // Import data from Google Sheets
  importFromSheets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { spreadsheetId, range, sheetName } = req.body;

      if (!spreadsheetId) {
        res.status(400).json({ error: 'Spreadsheet ID is required' });
        return;
      }

      // Determine the range to read
      const sheetRange = range || (sheetName ? `${sheetName}!A:Z` : 'A:Z');

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetRange,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        res.status(400).json({ error: 'No data found in the specified range' });
        return;
      }

      // Parse the data (assuming first row is headers)
      const headers = rows[0];
      const dataRows = rows.slice(1);

      // Map headers to expected fields
      const fieldMapping = this.createFieldMapping(headers);
      
      const importResults = {
        totalRows: dataRows.length,
        importedUsers: 0,
        importedAssessments: 0,
        errors: [] as string[]
      };

      // Process each row
      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = dataRows[i];
          const rowData = this.mapRowToObject(headers, row, fieldMapping);

          // Create or find user
          const user = await this.createOrFindUser(rowData);
          if (user) importResults.importedUsers++;

          // Create assessment if user exists and has assessment data
          if (user && this.hasAssessmentData(rowData)) {
            await this.createAssessment((user._id as unknown as string), rowData);
            importResults.importedAssessments++;
          }
        } catch (error) {
          importResults.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      res.json({
        message: 'Import completed',
        results: importResults
      });
    } catch (error) {
      console.error('Error importing from Google Sheets:', error);
      res.status(500).json({ error: 'Failed to import data from Google Sheets' });
    }
  };

  // Get available sheets in a spreadsheet
  getAvailableSheets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { spreadsheetId } = req.query;

      if (!spreadsheetId) {
        res.status(400).json({ error: 'Spreadsheet ID is required' });
        return;
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId as string,
      });

      const sheets = response.data.sheets?.map((sheet: any) => ({
        title: sheet.properties?.title,
        sheetId: sheet.properties?.sheetId,
        rowCount: sheet.properties?.gridProperties?.rowCount,
        columnCount: sheet.properties?.gridProperties?.columnCount,
      }));

      res.json({ sheets });
    } catch (error) {
      console.error('Error fetching available sheets:', error);
      res.status(500).json({ error: 'Failed to fetch available sheets' });
    }
  };

  // Validate sheet data before import
  validateSheetData = async (req: Request, res: Response): Promise<void> => {
    try {
      const { spreadsheetId, range } = req.body;

      if (!spreadsheetId) {
        res.status(400).json({ error: 'Spreadsheet ID is required' });
        return;
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: range || 'A:Z',
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        res.status(400).json({ error: 'No data found in the specified range' });
        return;
      }

      const headers = rows[0];
      const dataRows = rows.slice(1);

      const validation = {
        totalRows: dataRows.length,
        headers: headers,
        requiredFields: ['email', 'name'],
        missingFields: [] as string[],
        sampleData: dataRows.slice(0, 3), // First 3 rows as sample
        recommendations: [] as string[]
      };

      // Check for required fields
      const requiredFields = ['email', 'name'];
      requiredFields.forEach(field => {
        if (!headers.some((h: string) => h.toLowerCase().includes(field.toLowerCase()))) {
          validation.missingFields.push(field);
        }
      });

      // Add recommendations
      if (validation.missingFields.length > 0) {
        validation.recommendations.push(`Missing required fields: ${validation.missingFields.join(', ')}`);
      }

      if (!headers.some((h: string) => h.toLowerCase().includes('role'))) {
        validation.recommendations.push('Consider adding a "role" column for better assessment generation');
      }

      res.json(validation);
    } catch (error) {
      console.error('Error validating sheet data:', error);
      res.status(500).json({ error: 'Failed to validate sheet data' });
    }
  };

  private createFieldMapping(headers: string[]) {
    const mapping: { [key: string]: string } = {};
    
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      
      if (lowerHeader.includes('email')) mapping.email = header;
      else if (lowerHeader.includes('name')) mapping.name = header;
      else if (lowerHeader.includes('role')) mapping.role = header;
      else if (lowerHeader.includes('department')) mapping.department = header;
      else if (lowerHeader.includes('goal')) mapping.businessGoal = header;
      else if (lowerHeader.includes('career')) mapping.careerGoal = header;
    });

    return mapping;
  }

  private mapRowToObject(headers: string[], row: string[], mapping: { [key: string]: string }) {
    const obj: { [key: string]: any } = {};
    
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });

    // Map to expected field names
    const mapped: { [key: string]: any } = {};
    Object.entries(mapping).forEach(([expectedField, headerField]) => {
      mapped[expectedField] = obj[headerField];
    });

    return mapped;
  }

  private async createOrFindUser(userData: any) {
    if (!userData.email) return null;

    let user = await User.findOne({ email: userData.email });
    
    if (!user) {
      user = new User({
        email: userData.email,
        name: userData.name || 'Unknown',
        department: userData.department,
        role: userData.role
      });
      await user.save();
    }

    return user;
  }

  private hasAssessmentData(userData: any) {
    return userData.businessGoal || userData.careerGoal || userData.role;
  }

  private async createAssessment(userId: string, userData: any) {
    const assessment = new Assessment({
      userId,
      language: 'English',
      role: userData.role || 'Unknown Role',
      careerGoal: userData.careerGoal || 'Professional development and growth',
      businessGoal: userData.businessGoal || 'Improve team productivity and project delivery',
      keyResults: '', // Will be generated later
      businessSkills: [],
      careerSkills: [],
      status: 'draft'
    });

    await assessment.save();
    return assessment;
  }
}
