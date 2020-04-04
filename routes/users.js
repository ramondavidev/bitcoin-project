const User = require('../models/user');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

/* Render the register page */
router.get('/register', (req, res, next) => {
  res.render('users/register');
});

/* Register the user */
router.post('/register',  async (req, res, next) => {
	try{
	  const user = await User.register(new User(req.body), req.body.password);
	  res.redirect('/users/login');	
	}catch(err){
		const { username, email } = req.body;
		let error = err.message;
		if (error.includes('duplicate') && error.includes('index: email_1 dup key')) {
			error = 'A user with the given email is already registered';
		}
		res.render('/users/register', { title: 'Register', username, email, error });
	}
});

/* Render the login page*/
router.get('/login', (req, res, next) => {
	if (req.isAuthenticated()) return res.redirect('/');
	res.render('users/login', { title: 'Login' });	 
});


/* Login the user */
router.post('/login', async (req, res, next) =>{
	try{
		const { username, email, password } = req.body;
		const { user, error } = await User.authenticate()(username, password);
		if (!user && error){
    		console.log(error);
			return next(error);
    	} 
		req.login(user, function(err) {
			if (err) return next(err);
			const token = jwt.sign({
    			username: user.username,
    			email: user.email,
    			id: user._id
  			}, process.env.JWT_KEY,
  			{ 
	  			expiresIn: '1hr'
  			}
  			);
  			user.token = token;
  			user.save();
  			console.log(req.headers);
			return res.redirect('/');
		});
	}catch(err){
		console.log(err);
		res.redirect('/');
	}
});

  //logout the user
router.get('/logout', (req, res, next) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
