module.exports = function(app, passport){
	var mongojs		= require('mongojs');
	var db			= mongojs('rssque:***REMOVED***@***REMOVED***:3932/rssque',['feeds']);
	var users	    = mongojs('rssque:***REMOVED***@***REMOVED***:3932/rssque',['users']).users;
	var items       = mongojs('rssque:***REMOVED***@***REMOVED***:3932/rssque',['items']).items;

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
				successRedirect: '/reader',
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
				successRedirect : '/reader', // redirect to the secure reader section
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
    app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect : '/reader', failureRedirect : '/' }));
    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));
    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback', passport.authorize('facebook', { successRedirect : '/profile', failureRedirect : '/' }));
        
    // =====================================
    // TWITTER ROUTES ======================
    // =====================================
    // route for twitter authentication and login
    app.get('/auth/twitter', passport.authenticate('twitter'));
    
    app.get('/auth/twitter/callback', passport.authenticate('twitter', { successRedirect : '/reader', failureRedirect : '/' }));
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
    app.get('/auth/google/callback', passport.authenticate('google', { successRedirect : '/reader', failureRedirect : '/' }));
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
		users.findOne({_id: mongojs.ObjectId(req.user._id)},{userfeeds:1},function(err, data){
            if(err){
                console.log("Error");
                res.json([]);
            } else {
                res.json(data.userfeeds);
            }
		});
	});
	
    app.get('/api/feed/getItems/:feedid', function(req,res){
        db.feeds.findOne({_id: mongojs.ObjectId(req.params.feedid)}, function(err,data){
            if(err){
                res.send('error');
            } else {
                if(data.items){
                    //console.log(data.items);
                    res.send(data.items);
                } else {
                    var foundItems = [];
                    res.send(foundItems);
                }
            }
        });
    });
    
    app.get('/api/user/getReadItems/:feedid', function(req,res){
        console.log(req.user._id);
        users.findOne({_id: mongojs.ObjectId(req.user._id)},{userfeeds: { $elemMatch: {feed: mongojs.ObjectId(req.params.feedid)}}}, function(err,data){
            if(err){
                res.send('error');
            } else {
                if(data){
                    res.send(data);
                } else {
                    var foundItems = [];
                    res.send(foundItems);
                }
            }
        });
    });
	
    app.get('/api/item/:itemid', function(req,res){
        items.findOne({linkhash: req.params.itemid}, function(err,data){
            if(err){
                res.send('error');
            } else {
                if(data){
                    if(data.content){
                        res.send(data.content);
                    } else {
                        res.send("Item content is not available.");
                    }
                } else {
                    res.send("Item content is not available.");
                }
            }
        });
    });
	
    app.get('/api/feed/getTitle/:feedid', function(req,res){
        //console.log(req.user._id);
        db.feeds.findOne({_id: mongojs.ObjectId(req.params.feedid)}, function(err,data){
            if(err){
                res.send('error');
            } else {
                if(data.title){
                    users.update(
                        {
                            _id: mongojs.ObjectId(req.user._id),
                            "userfeeds": {
                                $elemMatch: {
                                    "feed": mongojs.ObjectId(req.params.feedid)
                                }
                            }
                        }, 
                        {
                            $set: { "userfeeds.$.title": data.title}
                        },
                        function(usertitleerr,usertitleUpdated){
                            if(usertitleerr){
                                console.log("While setting the feed title automatically, user find error occured");
                            } else {
                                //do nothing, it is done
                                console.log(usertitleUpdated);
                            }
                        }
                    );
                    
                    res.set({'content-type': 'application/json; charset=utf-8'}).send(data.title);
                } else {
                    res.send('No Feed Title');
                }
            }
        });
    });
	
	app.get('/api/user/getCurFeed', function(req,res){
	    var selector = {};
	    selector['_id'] = req.user._id;
		users.find(selector,function(err, data){
		    if(err){
		        res.send('error');
		    } else {
		        if(data[0]){
		            res.send(data[0].curFeed);
		        } else {
		            res.send("0");
		        }
		    }
		});
	});
	
	app.put('/api/user/setCurFeed', function(req, res){
	   users.update(
	       { _id: req.user._id },
	       { $set: { curFeed: req.body.feedID } },
            function(err, userUpdated){
                if(err){
                    res.json('error: \'couldn\'t set current feed\'');
                } else {
                    res.json('feedID:'+req.body.feedID);
                }
            }
	   );
	});
	
	app.put('/api/user/itemChangeState', function(req, res){
	    //console.log(req.body.feed);
	    //console.log(req.user._id);
	    //console.log(req.body.item);
	    //console.log(req.body.state);
	    
        if(req.body.state === 'read'){
            users.update(
                {
                    _id: req.user._id,
                    "userfeeds": {
                        $elemMatch: {
                            "feed": mongojs.ObjectId(req.body.feed)
                        }
                    }
                    
                }, 
                        { $addToSet: { "userfeeds.$.readitems" : req.body.item } 
                },
                function(err, userUpdated){
                    if(err){
                        res.json("Failed to mark read");
                    } else {
                        res.json("Marked read");
                    }
                }
            );
        } else if(req.body.state === 'unread'){
            users.update(
                {
                    _id: req.user._id,
                    "userfeeds": {
                        $elemMatch: {
                            "feed": mongojs.ObjectId(req.body.feed)
                        }
                    }
                    
                }, 
                        { $pull: { "userfeeds.$.readitems" : req.body.item } 
                },
                function(err, userUpdated){
                    if(err){
                        res.json("Failed to mark unread");
                    } else {
                        res.json("Marked unread");
                    }
                }
            );
        } else {
            res.send("State is not defined well");
        }

	   /*users.update(
	       { _id: req.user._id },
	       { $set: { curFeed: req.body.feedID } },
            function(err, userUpdated){
                if(err){
                    res.json('error: \'couldn\'t set current feed\'');
                } else {
                    res.json('feedID:'+req.body.feedID);
                }
            }
	   );*/
	});
	
	/*
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
	*/
};

function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}