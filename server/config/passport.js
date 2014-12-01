//source http://scotch.io/tutorials/javascript/easy-node-authentication-linking-all-accounts-together
var LocalStrategy 	    = require('passport-local').Strategy;
var FacebookStrategy 	= require('passport-facebook').Strategy;
var TwitterStrategy 	= require('passport-twitter').Strategy;
var GoogleStrategy      = require('passport-google-oauth').OAuth2Strategy;

var mongojs 		    = require('mongojs');
//var users	    		= mongojs('rssque',['users']).users;
var users	            = mongojs('rssque:***REMOVED***@***REMOVED***:3932/rssque',['users']).users;

var configAuth          = require('./auth');

module.exports = function(passport){
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
		users.findOne({ _id:mongojs.ObjectId(id) }, function(err, user) {
			if(err)
				done(err);
			
			done(err, user);
		});
	});
	
	passport.use('local-signup', new LocalStrategy({
			// by default, local strategy uses username and password, we will override with email
			usernameField : 'email',
			passwordField : 'passwd',
			passReqToCallback : true // allows us to pass back the entire request to the callback
		},
		function(req, email, password, done) {
			// asynchronous
			// User.findOne wont fire unless data is sent back
			process.nextTick(function() {
			    if(!req.user){
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
    						users.insert({user: email, pass: passHash }, function(err, userInserted){
    							if(err)
    								return done(err);
    							if(userInserted)
    								return done(null, userInserted, req.flash('signupMessage', 'You have succesfully registered'));
    						});
    					}
    				});
			    } else {
			        var user = req.user;
			        var passHash = generateHash(password);
                    users.update(
                        { _id: user._id },
                        { 
                            $set: {
                                user: email,
                                pass: passHash
                            }
                        }, function(err, userUpdated){
                            if(err){
                                return done(err);
                            }
                            if(userUpdated){
                                return done(null, user, req.flash('signupMessage','You have succesfully connected your local account.'));
                            }
                        }
                    );
			    }
			});
		}
	));
	
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
	
	passport.use(
        new FacebookStrategy(
            {
                clientID            : configAuth.facebookAuth.clientID,
                clientSecret        : configAuth.facebookAuth.clientSecret,
                callbackURL         : configAuth.facebookAuth.callbackURL,
                passReqToCallback   : true
            },
        	function(req, token, refreshToken, profile, done){
                process.nextTick(function(){
                    if(!req.user){
                        users.findOne({ 'facebook.id' : profile.id}, function(err, user){
                            if(err){
                                return done(err);
                            }
                            if(user){
                                return done(null, user);
                            } else {
                                users.insert(
                                    {
                                        facebook:{
                                            id      : profile.id,
                                            token   : token,
                                            name    : profile.name.givenName + ' ' + profile.name.familyName,
                                            email   : profile.emails[0].value
                                        }
                                    },
                                    function(err, userInserted){
                                        if(err){
                                            return done(err);
                                        }
                                        if(userInserted){
                                            return done(null, userInserted, req.flash('signupMessage','You have succesfully registered.'));
                                        }
                                    }
                                );
                            }
                        });
                    } else {
                        var user = req.user;
                        users.update(
                            { _id: user._id },
                            { 
                                $set: {
                                    facebook:{
                                        id      : profile.id,
                                        token   : token,
                                        name    : profile.name.givenName + ' ' + profile.name.familyName,
                                        email   : profile.emails[0].value
                                    }
                                }
                            }, function(err, userUpdated){
                                if(err){
                                    return done(err);
                                }
                                if(userUpdated){
                                    return done(null, user, req.flash('signupMessage','You have succesfully connected your facebook account.'));
                                }
                            }
                        );
                    }
                });
            }
        )
	);
	
	passport.use(
        new TwitterStrategy(
            {
                consumerKey         : configAuth.twitterAuth.consumerKey,
                consumerSecret      : configAuth.twitterAuth.consumerSecret,
                callbackURL         : configAuth.twitterAuth.callbackURL,
                passReqToCallback   : true
            },
        	function(req, token, tokenSecret, profile, done){
                process.nextTick(function(){
                    if(!req.user){
                        users.findOne({ 'twitter.id' : profile.id}, function(err, user){
                            if(err){
                                return done(err);
                            }
                            if(user){
                                return done(null, user);
                            } else {
                                users.insert(
                                    {
                                        twitter:{
                                            id          : profile.id,
                                            token       : token,
                                            username    : profile.username,
                                            displayName : profile.displayName
                                        }
                                    },
                                    function(err, userInserted){
                                        if(err){
                                            return done(err);
                                        }
                                        if(userInserted){
                                            return done(null, userInserted, req.flash('signupMessage','You have succesfully registered.'));
                                        }
                                    }
                                );
                            }
                        });
                    } else {
                        var user = req.user;
                        users.update(
                            { _id: user._id },
                            { 
                                $set: {
                                    twitter:{
                                        id          : profile.id,
                                        token       : token,
                                        username    : profile.username,
                                        displayName : profile.displayName
                                    }
                                }
                            }, function(err, userUpdated){
                                if(err){
                                    return done(err);
                                }
                                if(userUpdated){
                                    return done(null, user, req.flash('signupMessage','You have succesfully connected your twitter account.'));
                                }
                            }
                        );
                    }
                });
            }
        )
	);
	
	passport.use(
        new GoogleStrategy(
            {
                clientID     : configAuth.googleAuth.clientID,
                clientSecret  : configAuth.googleAuth.clientSecret,
                callbackURL     : configAuth.googleAuth.callbackURL,
                passReqToCallback   : true
            },
        	function(req, token, refreshToken, profile, done){
                process.nextTick(function(){
                    if(!req.user){
                        users.findOne({ 'google.id' : profile.id}, function(err, user){
                            if(err){
                                return done(err);
                            }
                            if(user){
                                if(!user.google.token || !user.google.name || !user.google.email){
                                    users.update(
                                        { _id: user._id },
                                        { 
                                            $set: {
                                                google:{
                                                    id      : profile.id,
                                                    token   : token,
                                                    name    : profile.displayName,
                                                    email   : profile.emails[0].value
                                                }
                                            }
                                        }, function(err, userUpdated){
                                            if(err){
                                                return done(err);
                                            }
                                            if(userUpdated){
                                                return done(null, user);
                                            }
                                        }
                                    );
                                    
                                }
                                return done(null, user);
                            } else {
                                users.insert(
                                    {
                                        google:{
                                            id      : profile.id,
                                            token   : token,
                                            name    : profile.displayName,
                                            email   : profile.emails[0].value
                                        }
                                    },
                                    function(err, userInserted){
                                        if(err){
                                            return done(err);
                                        }
                                        if(userInserted){
                                            return done(null, userInserted, req.flash('signupMessage','You have succesfully registered.'));
                                        }
                                    }
                                );
                            }
                        });
                    } else {
                        var user = req.user;
                        users.update(
                            { _id: user._id },
                            { 
                                $set: {
                                    google:{
                                        id      : profile.id,
                                        token   : token,
                                        name    : profile.displayName,
                                        email   : profile.emails[0].value
                                    }
                                }
                            }, function(err, userUpdated){
                                if(err){
                                    return done(err);
                                }
                                if(userUpdated){
                                    return done(null, user, req.flash('signupMessage','You have succesfully connected your google account.'));
                                }
                            }
                        );
                    }
                });
            }
        )
	);
};