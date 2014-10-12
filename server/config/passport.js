var LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport){
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
		console.log(id);
		users.findOne({ _id:mongojs.ObjectId(id) }, function(err, user) {
			if(err)
				done(err);
				
			console.log(user._id);
			done(err, user);
		});
		/*findById(id, function (err, user) {
			done(err, user);
		});
		*/
	});
}


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