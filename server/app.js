

var express 		= require('express');
var path 			= require('path');

var passport		= require('passport');
var LocalStrategy	= require('passport-local').Strategy;
var flash 	 		= require('connect-flash');
var bcrypt   		= require('bcrypt-nodejs');

var logger			= require('morgan');
var cookieParser	= require('cookie-parser');
var bodyParser		= require('body-parser');
var session 		= require('express-session');

var mongojs 		= require('mongojs');
var db				= mongojs('rssque',['feeds']);
var users			= mongojs('rssque',['users']).users;


var routes = require('./routes/index');

var app = express();

//view engine setup
app.set('views', path.join(__dirname,'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(cookieParser());

//required for passport
app.use(session({ secret: '***REMOVED***'}));

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

passport.use('local-signup', new LocalStrategy(
	{
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'email',
		passwordField : 'passwd',
		passReqToCallback : true // allows us to pass back the entire request to the callback
	},
	function(req, email, password, done) {
		// asynchronous
		// User.findOne wont fire unless data is sent back
		process.nextTick(function() {
			// find a user whose email is the same as the forms email
			// we are checking to see if the user trying to login already exists
			
			users.findOne({ 'user' :  email }, function(err, user) {
				// if there are any errors, return the error
				if (err)
					return done(err);
				// check to see if theres already a user with that email
				if (user) {
					return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
				} else {
					// if there is no user with that email	
					// create the user
					var passHash = generateHash(password);
					console.log(passHash);
					users.insert({user: email, pass: passHash }, function(err, userInserted){
						if(err)
							return done(err);
						if(userInserted)
							return done(null, userInserted, req.flash('signupMessage', 'You have succesfully registered'));
					});
					
					
					//return done(null, true, req.flash('signupMessage', 'You have succesfully registered'));
					
					/*var newUser            = new User();

					// set the user's local credentials
					newUser.local.email    = email;
					newUser.local.password = newUser.generateHash(password);

					// save the user
					newUser.save(function(err) {
						if (err)
							throw err;
						return done(null, newUser);
					});
					*/
				}
			});    
		});
	}
));

generateHash = function(password){
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}


app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(express.static(path.join(__dirname, '../client')));
 
//routes
//this is the old setup 
//app.use('/', routes);
//here comes the new one
require('./routes/index.js')(app,passport);


app.set('port', process.env.PORT || 3000);
 
var server = app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + server.address().port);
});

module.exports = app;