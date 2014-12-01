var cluster         = require( 'cluster' );
var cCPUs           = require('os').cpus().length;

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
var MongoStore      = require('connect-mongo')(session);

var mongojs 		= require('mongojs');
//var db				= mongojs('rssque',['feeds']);
var db	            = mongojs('rssque:***REMOVED***@***REMOVED***:3932/rssque',['feeds']);


var routes = require('./routes/index');
require('./config/passport.js')(passport);

if( cluster.isMaster ) {
    for( var i = 0; i < cCPUs; i++ ) {
        cluster.fork();
    }

    cluster.on( 'online', function( worker ) {
        console.log( 'Worker ' + worker.process.pid + ' is online.' );
    });
    cluster.on( 'exit', function( worker, code, signal ) {
        console.log( 'worker ' + worker.process.pid + ' died.' );
        //olen her birinin yerine yenisi gelebilir belki boyle
        //cluster.fork();
    });
} else {

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
    //app.use(session({ secret: '***REMOVED***'}));
    app.use(
        session({
            cookie: { maxAge: 1000*60*60*24*60 } ,
            secret: "***REMOVED***" ,
            store:new MongoStore({
                db: 'rssque',
                host: '***REMOVED***',
                port: 3932,  
                username: 'rssque',
                password: '***REMOVED***', 
                collection: 'session', 
                auto_reconnect:true
        })
    }));
    
    generateHash = function(password){
    	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };
    
    
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
}