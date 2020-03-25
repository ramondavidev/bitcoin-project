const User = require('../models/user');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

/* Render the register page */
router.get('/register', (req, res, next) => {
  res.render('users/register');
});

/* Register the user */
router.post('/register',  async (req, res, next) => {
	try{
	  const user = await User.register(new User(req.body), req.body.password);
	  res.redirect('/login');	
	}catch(err){
		deleteProfileImage(req);
		const { username, email } = req.body;
		let error = err.message;
		if (error.includes('duplicate') && error.includes('index: email_1 dup key')) {
			error = 'A user with the given email is already registered';
		}
		req.flash("error", error);
		res.render('register', { title: 'Register', username, email, error });
	}
});

/* Render the login page*/
router.get('/login', (req, res, next) => {
  if (req.isAuthenticated()) return res.redirect('/');
	if (req.query.returnTo) req.session.redirectTo = req.headers.referer;
	res.render('users/login', { title: 'Login' });
});


/* Login the user */
router.post('/login', async (req, res, next) =>{
		const { username, email, password } = req.body;
		const { user, error } = await User.authenticate()(username, password);
		if (!user && error){
      console.log(error);
      return next(error);
    } 
		req.login(user, function(err) {
			if (err)
        return next(err);
			const redirectUrl = req.session.redirectTo || '/';
      delete req.session.redirectTo;
      const token = jwt.sign({
        username: user.username,
        email: user.email,
        id: user._id
	  }, 'secretkey',
	  { 
		  expiresIn: '1hr'
	  }
	  );
	  user.token = token;
	  user.save();
	  console.log(req.headers);
      return res.status(200).json({
        message: "Auth successful",
        token: token
      });
			//res.redirect(redirectUrl);
		});
	});

  //logout the user
router.get('/logout', (req, res, next) => {
  req.logout();
  res.redirect('/');
});

module.exports = router;
