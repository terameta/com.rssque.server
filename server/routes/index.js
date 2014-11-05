module.exports = function(app, passport){
	var mongojs		= require('mongojs');
	var db			= mongojs('rssque',['feeds']);
	var users	    = mongojs('rssque',['users']).users;

	/* GET home page. */
	app.get('/', function(req, res) {
		if(req.isAuthenticated()){
			res.render('index', { isOurUser : 1 });
		}else{
			res.render('index', { isOurUser : 0 });
		}
		
	});

	app.get('/reader', isLoggedIn, function(req, res) {
		res.render('reader', {
			user : req.user // get the user out of session and pass to template
		});
	});
	
	app.get('/signin', function(req, res) {
		res.render('signin', { message: req.flash('loginMessage') });
	});
	
	app.post('/signin', passport.authenticate(
		'local', 
			{ 
				successRedirect: '/profile',
				failureRedirect: '/signin',
				failureFlash: true 
			}
		)
	);
	
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup', { message: req.flash('signupMessage') });
	});
	
	app.post('/signup', passport.authenticate(
		'local-signup', 
			{
				successRedirect : '/profile', // redirect to the secure profile section
				failureRedirect : '/signup', // redirect back to the signup page if there is an error
				failureFlash : true // allow flash messages
			}
		)
	);
	
	app.get('/connect/local', function(req, res) { res.render('connect-local', { message: req.flash('loginMessage') });    });
    app.post('/connect/local', passport.authenticate('local-signup', { successRedirect : '/profile', failureRedirect : '/connect/local',  failureFlash : true }));
	
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile', {
			user : req.user,  // get the user out of session and pass to template
			message : req.flash('signupMessage')
		});
	});
	
	// =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect : '/profile', failureRedirect : '/' }));
    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));
    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback', passport.authorize('facebook', { successRedirect : '/profile', failureRedirect : '/' }));
        
    // =====================================
    // TWITTER ROUTES ======================
    // =====================================
    // route for twitter authentication and login
    app.get('/auth/twitter', passport.authenticate('twitter'));
    
    app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect : '/profile', failureRedirect : '/' }));
    // send to twitter to do the authentication
    app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));
    // handle the callback after twitter has authorized the user
    app.get('/connect/twitter/callback', passport.authorize('twitter', { successRedirect : '/profile', failureRedirect : '/' }));
    
    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback', passport.authenticate('google', { successRedirect : '/profile', failureRedirect : '/' }));
    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

    // the callback after google has authorized the user
    app.get('/connect/google/callback', passport.authorize('google', { successRedirect : '/profile', failureRedirect : '/' }));
    
    // =====================================
    // UNLINK ROUTES =======================
    // =====================================
    
    
    app.get('/unlink/local', function(req, res) {
        var user = req.user;
        users.update(
            { _id: user._id },
            { $unset: { user:"", pass:""} }, function(err, userUpdated){
                if(err){
                    res.redirect('/profile');
                }
                if(userUpdated){
                    res.redirect('/profile');
                }
            }
        );
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', function(req, res) {
        var user = req.user;
        users.update(
            { _id: user._id },
            { $unset: { facebook:""} }, function(err, userUpdated){
                if(err){
                    res.redirect('/profile');
                }
                if(userUpdated){
                    res.redirect('/profile');
                }
            }
        );
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', function(req, res) {
        var user = req.user;
        users.update(
            { _id: user._id },
            { $unset: { twitter:""} }, function(err, userUpdated){
                if(err){
                    res.redirect('/profile');
                }
                if(userUpdated){
                    res.redirect('/profile');
                }
            }
        );
    });

    // google ---------------------------------
    app.get('/unlink/google', function(req, res) {
        var user = req.user;
        users.update(
            { _id: user._id },
            { $unset: { google:""} }, function(err, userUpdated){
                if(err){
                    res.redirect('/profile');
                }
                if(userUpdated){
                    res.redirect('/profile');
                }
            }
        );
    });
    
    // =====================================
    // OTHER ROUTES ========================
    // =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	
	app.get('/api/feeds', function(req,res){
		db.feeds.find(function(err, data){
			res.json(data);
		});
	});

	app.post('/api/feeds', function(req, res) {
		db.feeds.insert(req.body, function(err, data) {
			res.json(data);
		});
	});

	app.put('/api/feeds', function(req, res) {
		db.feeds.update({
			_id: mongojs.ObjectId(req.body._id)
		}, {
			isCompleted: req.body.isCompleted,
			feed: req.body.feed
		}, {}, function(err, data) {
			res.json(data);
		});
	});

	app.delete('/api/feeds/:_id', function(req, res) {
		db.feeds.remove({
			_id: mongojs.ObjectId(req.params._id)
		}, '', function(err, data) {
			res.json(data);
		});
	});
};

function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}