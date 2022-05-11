module.exports = function(app, passport){
	var mongojs		= require('mongojs');
	var db			= mongojs('***REMOVED***',['feeds']);
	var users	    = mongojs('***REMOVED***',['users']).users;
	var items       = mongojs('***REMOVED***',['items']).items;
	var read        = require('read-art');
	var feedParser 	= require('feedparser');
	var feedRequest	= require('request');

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
	    //console.log(req.user._id);
		users.findOne({_id: mongojs.ObjectId(req.user._id)},{userfeeds:1},function(err, data){
            if(err){
                console.log("Error");
                res.json([]);
            } else {
                res.json(data.userfeeds);
            }
		});
	});
	
    app.get('/api/feed/getItems/:feedid/:skip', function(req,res){
        items.find({feed: mongojs.ObjectId(req.params.feedid)}, {content:0}).sort({date:-1, _id:1}).skip(parseInt(req.params.skip)).limit(50, function(err,data){
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
    
    app.get('/api/user/getReadItems/:feedid', function(req,res){
        var foundItems = [];
        if(req){
            if(req.user){
                if(req.user._id){
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
                } else {
                    res.send(foundItems);
                }
            } else {
                res.send(foundItems);
            }
        } else {
            res.send(foundItems);
        }
    });
	
    app.get('/api/item/:feedid/:itemid', function(req,res){
        items.findOne({feed: mongojs.ObjectId(req.params.feedid), linkhash: req.params.itemid}, function(err,data){
            if(err){
                res.send('error');
            } else {
                if(data){
                    if(data.link){
                        read(
                            data.link,
                            {
                                agent: true
                            },
                            function(err, article, options){
                                if(err){
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
                                } else {
                                    res.send(article.content);
                                }
                            }
                        );
                        /*
                        read(
                        	data.link, 
                        	{
                        		preprocess: function(source, response, content_type, callback) {
                        			//console.log(content_type);
                        			//console.log(content_type.mimeType);
                        			if(content_type.mimeType != 'text/html'){
                        				return callback(new Error('wrong content type'));
                        			}
                        			//console.log(source.length);
                        			if (source.length > 10240000) {
                        				return callback(new Error('too big'));
                        			}
                        			
                        			callback(null, source);
                        	}},
                        	function(err, article, meta) {
                        		if(err){
                        			//console.log(err);
                        			
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
                        			
                        		} else {
                        			res.send(article.content);
                        			article.close();
                        		}
                        		
                            	// Main Article
                            	//console.log(article.content);
                            	//res.send(article.content);
                            	// Title
                            	//console.log(article.title);
                            
                            	// HTML Source Code
                            	//console.log(article.html);
                            	// DOM
                            	//console.log(article.document);
                            
                            	// Response Object from Request Lib
                            	//console.log(meta);
                            
                            	// Close article to clean up jsdom and prevent leaks
                            	//article.close();
                        	}
                        );*/
                    } else {
                        res.send('');
                    }
                } else {
                    res.send('');
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
                if(data.title && req.user){
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
	
	app.post('/api/addfeed/parse', function(req, res) {
		var posts = [];
		var isNoError = true;
		//console.log(req.body.url);
		var addFeedParseReq = feedRequest(req.body.url, {timeout: 20000, pool:false});
		addFeedParseReq.setMaxListeners(50);
		addFeedParseReq.setHeader('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.63 Safari/537.36');
		addFeedParseReq.setHeader('accept', 'text/html,application/xhtml+xml');
		
		var addFeedParseParser = new feedParser();
		
		addFeedParseReq.on('error', done);
		
		addFeedParseReq.on('response', function(addFeedParseRes) {
			if (addFeedParseRes.statusCode != 200) return this.emit('error', new Error('Bad status code'));
			var charset = getParams(addFeedParseRes.headers['content-type'] || '').charset;
			addFeedParseRes = maybeTranslate(addFeedParseRes, charset);
			// And boom goes the dynamite
			addFeedParseRes.pipe(addFeedParseParser);
		});
		
		addFeedParseParser.on('error', function(){
			isNoError = false;
			res.send('Error fetching the url');
		});
		addFeedParseParser.on('end', function(){
			if(isNoError){
				res.json(posts);
			}
		});
		addFeedParseParser.on('readable', function() {
			var post;
			while (post = this.read()) {
			//	console.log(post);
				posts.push(post);
			}
			
		});
		
		//res.send('We are parsing the feed');
	});
	
	app.post('/api/addfeed/assigntouser', function(req, res) {
		db.feeds.findOne({url: req.body.url}, function(err,data){
			if(err){
				res.send('error');
			} else {
				if(data){
					users.update(
						{
							_id: req.user._id
						}, 
						{
							$addToSet: { "userfeeds" : {"feed" : data._id, title: req.body.title} } 
						},
						function(err, userUpdated){
							if(err){
								res.send("Failed to add feed to user");
							} else {
								res.send(data._id);
							}
						}
					);
				} else {
					db.feeds.insert({url:req.body.url, title: req.body.title}, function(err, data) {
						if(err){
							res.send("Failed to create the feed");
						} else {
							res.send("Feed is created, re-run the assignment");
						}
					});
            	}
            }
        });
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

function done(err) {
	if (err) {
		console.log(err, err.stack);
	}
}

function getParams(str) {
	var params = str.split(';').reduce(function (params, param) {
		var parts = param.split('=').map(function (part) { return part.trim(); });
		if (parts.length === 2) {
			params[parts[0]] = parts[1];
		}
		return params;
	}, {});
	return params;
}

function maybeTranslate (res, charset) {
	var iconv;
	// Use iconv if its not utf8 already.
	if (!iconv && charset && !/utf-*8/i.test(charset)) {
		try {
			iconv = new Iconv(charset, 'utf-8');
			console.log('Converting from charset %s to utf-8', charset);
			iconv.on('error', done);
			// If we're using iconv, stream will be the output of iconv
			// otherwise it will remain the output of request
			res = res.pipe(iconv);
		} catch(err) {
			res.emit('error', err);
		}
	}
	return res;
}

function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on 
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}
