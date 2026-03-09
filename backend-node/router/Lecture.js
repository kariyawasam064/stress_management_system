import  express  from 'express';
import { AddLecture, GetLecturesByEmail, createBulkLec } from '../controller/Lecture.js'
const router = express.Router();

router.post('/add', AddLecture);
router.post('/bulk', createBulkLec);
router.get('/get/:user_email', GetLecturesByEmail);

export default router;