import express from 'express';
import { SheetsController } from '../controllers/SheetsController';

const router = express.Router();
const sheetsController = new SheetsController();

// Import data from Google Sheets
router.post('/import', sheetsController.importFromSheets);

// Get available sheets
router.get('/available', sheetsController.getAvailableSheets);

// Validate sheet data
router.post('/validate', sheetsController.validateSheetData);

export default router;
