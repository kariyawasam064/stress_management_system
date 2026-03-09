import  express  from 'express';
import {UserRegistration, Signin, getAllUsers } from '../controller/User.js'
const router = express.Router();

router.post('/Signup', UserRegistration);
router.post('/Signin',Signin);
router.get('/all',getAllUsers);

export default router;