import express from 'express';
import { 
  AddNewTransaction, 
  GetAllIncomeByEmail, 
  MonthlySummaryCal, 
  DeleteIncome,
  MonthlyIncomeCategory,
  WeeklyExpenseCategory,
  analyzeFinances ,
  YearlyBalanceSummary 
} from '../controller/AddIncome.js';

const router = express.Router();

router.post('/add', AddNewTransaction);
router.get('/all/:email', GetAllIncomeByEmail);
router.get('/monthly/:email', MonthlySummaryCal);
router.get('/weekly-category/:email', WeeklyExpenseCategory);   
router.get('/monthly-income/:email', MonthlyIncomeCategory);
router.delete('/remove/:id', DeleteIncome);
router.get('/analyze/:email', analyzeFinances);
router.get('/monthly-balance/:email', YearlyBalanceSummary);


export default router;
