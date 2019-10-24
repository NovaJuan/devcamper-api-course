const express = require('express');
const {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    updateDetails,
    updatePassword,
    logOut
} = require('../controllers/auth');

const router = express.Router();

const {
    protect
} = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe)
router.get('/logout', protect, logOut)
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;