module.exports = function(app, passport){
	var mongojs		= require('mongojs');
	var db			= mongojs('rssque',['feeds']);

	/* GET home page. */
	app.get('/', function(req, res) {
		if(req.isAuthenticated()){
			res.render('index', { isOurUser : 1 });
		}else{
			res.render('index', { isOurUser : 0 });
		}
		
	});
	
	app.get('/login', function(req, res) {
		//res.render('login');
		res.render('login', { message: req.flash('loginMessage') });
	});
	
	app.post('/login', passport.authenticate(
		'local', 
			{ 
				successRedirect: '/profile',
				failureRedirect: '/login',
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
	
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile', {
			user : req.user // get the user out of session and pass to template
		});
	});
	
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