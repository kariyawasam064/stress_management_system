import  express  from 'express';
import { AddDateBook, GetDatesByEmail } from '../controller/DatesBook.js'
const router = express.Router();

router.post('/add', AddDateBook);
router.get('/get/:email', GetDatesByEmail);

export default router;