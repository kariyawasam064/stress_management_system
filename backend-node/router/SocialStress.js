import  express  from 'express';
import { AddSocialStress, GetMyLastValues, getVideosByStress } from '../controller/SocialStress.js'
const router = express.Router();

router.post('/add', AddSocialStress);
router.get('/get/:user_email', GetMyLastValues);
router.get("/videos/:user_email", getVideosByStress);

export default router;