var express       = require('express');
var bodyParser    = require('body-parser');
var passport      = require('passport');
var session       = require('express-session');
var LocalStrategy = require('passport-local');
var path          = require('path');
var models        = require('./models');

// Initialze express
var app = express();

// Initialize passport
app.use(session({ secret: "mySecret" }));
app.use(passport.initialize());
app.use(passport.session());

// app.use(path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

/*
=================================================

Passport needs to search for a user when signup form is submitted
and if one exists return an error message saying that user already exists.
If there is no user then create the user and authenticate their session

=================================================
*/

passport.use('local', new LocalStrategy({
	usernameField: 'username',
	passwordField: 'password',
	passReqToCallback: true
},
	function(req, username, password, done) {
		console.log('PASSPORT STRATEGY');
		process.nextTick(function() {
			models.User.find({
				where: {
					username: username
				}
			}).then(function(user, err) {
				if (err) {
					return done(err)
				}

				if (!user) {
					return done(null, false);
				}

				if (password != user.password) {
					return done(null, false);
				}

				if (password == user.password) {
					return done(null, user);
				}
			})
		})
		// done(null, username);
	})
);

passport.serializeUser(function(user, done) {
	// console.log('serializing');
	// console.log(user);
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  // console.log('DEserializing');
	// console.log(user);
	done(null, user);
});

app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname, 'views/index.html'));
});

// sign in page
app.get('/signin', function(req, res) {
	res.sendFile(path.join(__dirname, 'views/signin.html'));
});

// sign up page
app.get('/signup', function(req, res) {
	res.sendFile(path.join(__dirname, 'views/signup.html'));
});

app.get('/auth/success', isAuthenticated, function(req, res) {
	console.log("SUCCESS: ");
	console.log(req.user);
	res.sendFile(path.join(__dirname, 'views/success.html'));
});

app.get('/auth/fail', function(req, res) {
	res.sendFile(path.join(__dirname, 'views/fail.html'));
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

/*=================== POST ROUTES ===================*/
// handle sign up and sign in functionality here
app.post('/auth/signin', passport.authenticate('local', {
	successRedirect: '/auth/success',
	failureRedirect: '/auth/fail'
}));

app.post('/auth/signup', function(req, res) {
	models.User.findOne({
		where: {
			username: req.body.username
		}
	}).then(function(user) {
		console.log('USER: ');
		console.log(user);
		if (!user) {
			models.User.create({
				first_name: req.body.firstName,
				last_name: req.body.lastName,
				email: req.body.email,
				username: req.body.username,
				password: req.body.password
			}).then(function(user) {
				console.log('USER CREATED');
				console.log(user);
				passport.authenticate('local', {
					successRedirect: '/auth/success',
					failureRedirect: '/auth/fail'
				})(req, res)
			})
		} else {
			console.log('User already Exists');
			res.send('User already exists');
		}
	})
});
/*===================================================*/

app.listen(3000, function() {
	console.log('Listening on port 3000');
});

function isAuthenticated(req, res, next) {
	console.log('req.username: ');
	console.log(req.user);
	if (req.user) {
		return next();
	}

	res.redirect('/auth/fail');
}