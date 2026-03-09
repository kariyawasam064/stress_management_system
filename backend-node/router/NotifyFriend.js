import  express  from 'express';
import { AddNotifyFriends } from '../controller/NotifyFriend.js'
const router = express.Router();

router.post('/add', AddNotifyFriends);
// router.get('/get/:user_email', GetMyTimetabel);

export default router;