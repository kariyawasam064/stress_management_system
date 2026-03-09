import  express  from 'express';
import { AddTimeTable, GetMyTimetabel } from '../controller/SavedTimetable.js'
const router = express.Router();

router.post('/add', AddTimeTable);
router.get('/get/:user_email', GetMyTimetabel);

export default router;