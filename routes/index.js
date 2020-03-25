const express = require('express');
const router = express.Router();
const {
	checkAuth
} = require('../middleware')

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index');
});

router.get('/deposit', checkAuth, (req, res, next) => {
  res.render('deposit');
});

module.exports = router;
