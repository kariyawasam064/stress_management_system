import  express  from 'express';
import { AddRequest, GetAllMySentRequest, GetAllMyGotRequest, RemovedRequest, AcceptRequest } from '../controller/FriendGroup.js'
const router = express.Router();

router.post('/add', AddRequest);
router.get('/get', GetAllMySentRequest);
router.get('/got/:user_email', GetAllMyGotRequest);
router.delete('/remove/:id', RemovedRequest);
router.put('/update/:id', AcceptRequest);

export default router;