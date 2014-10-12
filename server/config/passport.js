var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
		usernameField: 'email',
		passwordField: 'passwd',
		passReqToCallback : true
	},
	function(req, email, password, done){
		users.findOne({ user: email }, function(err, user) {
			if (err) { return done(err); }
			if (!user) {
				return done(null, false, req.flash( 'loginMessage', 'Incorrect username.'));
			}
			if (user.password == generateHash(password)) {
				return done(null, false, req.flash( 'loginMessage', 'Incorrect password.'));
			}
			return done(null, user);
		});
	}
));