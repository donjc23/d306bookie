var User = require('./models/user');
var moment = require('moment-timezone');
moment.tz.setDefault("America/New_York");

module.exports = function(app, passport){
	app.get('/', function(req, res){
		var all =[];
		var today = new Date();
		var tday = moment(today).day();
		var hour = moment(today).hour();
		// var tday = today.getDay();
		// var hour = today.getHours();
		var sevenOclock = false;
		if(hour > 18)
			sevenOclock = true;
		User.find(function(err, users){
			if(err)
				throw err;
			for(var i=0; i<users.length; i++) {
				var stuff = {};
				var yesterday = users[i].allPicks.pop();
				if(yesterday){
					var date = yesterday.dayPick;
					var day = moment(date).day();
					//var day = date.getDay();
					stuff.name = users[i].local.username;
					stuff.score = users[i].score;
					stuff.daywins = users[i].daywins;
					if (day == tday){
						stuff.picks = yesterday.dayPicks;
					}else{
						stuff.picks = [];
					}
				}else{
					stuff.name = users[i].local.username;
					stuff.score = users[i].score;
					stuff.daywins = users[i].daywins;
					stuff.picks = [];
				}
				all.push(stuff);
			}
			res.render('index.ejs', {all: all, sevenOclock: sevenOclock});
			//res.send(all);
		});		
		
	});

	app.get('/login', function(req, res){
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});
	
	app.post('/login', passport.authenticate('local-login', {
		successRedirect: '/profile',
		failureRedirect: '/login',
		failureFlash: true
	}));
	
	app.get('/signup', function(req, res){
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect: '/',
		failureRedirect: '/signup',
		failureFlash: true
	}));
	
	app.get('/profile', isLoggedIn, function(req, res){
		var user = req.user;
		var picks = [];
		var lastPicks = [];
		var today = new Date();
		var estday = moment(today).format('ha z');
		var tday = moment(today).day();
		var hour = moment(today).hour();
		//var tday = today.getDay();
		var score = user.score;
		//var hour = today.getHours();
		var sevenOclock = false;
		if(hour > 18)
			sevenOclock = true;
		var lastPick = user.allPicks.pop();
		if(lastPick){
			var date = lastPick.dayPick;
			//var day = date.getDay();
			var day = moment(date).day();
			if (day == tday){
				picks = lastPick.dayPicks;
			}else{
				picks = [];
				lastPicks = lastPick.dayPicks;
			}
		}
		res.render('profile.ejs', {lastPicks : lastPicks, picks: picks, day: estday, name: user.local.username, sevenOclock: sevenOclock});
	});
	
	app.post('/score', function(req, res){
		var result = ['Hawks-3.5','Bulls+1.5','Spurs-8.5','Trail Blazers+2'];
		var size = result.length;
		var today = new Date();
		var tday = moment(today).day();
		//var tday = today.getDay();	
		User.find(function(err, users){
			if(err)
				throw err;
			for(var i=0; i<users.length; i++) {
				var todayscore = 0;
				var yesterday = users[i].allPicks.pop();
				if(yesterday){
					var picks = yesterday.dayPicks;
					var ysize = picks.length;
					var date = yesterday.dayPick;
					var day = moment(date).day();
					//var day = date.getDay();
					if (day < 6 ){
						if(day == tday-1 && size == ysize){
							for(var j=0; j<picks.length; j++) {
								if (picks[j]==result[j]){
									todayscore++;
									//console.log('todayscore ' + todayscore);
								}
							}
							var newscore = users[i].score + todayscore;
							//console.log('newscore ' + newscore);
							users[i].score = newscore;
							users[i].daywins = todayscore;
							users[i].save(function(err){
								if(err)
									throw err;
							})
							//console.log('users[i].update ' + users[i].score);
						}
					}else{
						if(tday==0 && size == ysize){
							for(var j=0; j<picks.length; j++) {
								if (picks[j]==result[j])
									todayscore++;
							}
							var newscore = users[i].score + todayscore;
							users[i].score = newscore;
							users[i].daywins = todayscore;
							users[i].save(function(err){
								if(err)
									throw err;
							})
						}
					}
				}
				
			}
			
		})
		res.redirect('/');
	});

	app.post('/fix', function(req, res){
		var name = 'Mr.Gwu';
		User.findOne({'local.username': name}, function(err, user){
			if(err)
				throw err;
			if(user){
				user.score = 7;
				user.daywins = 7;
				user.save(function(err){
					if(err)
						throw err;
				})
			}
		})
		res.redirect('/');
	});
	
	
	
	app.post('/profile', isLoggedIn, function(req, res){
		var user = req.user;
		var picks =[];
		var today = {};
		picks.push(req.body.match1);
		picks.push(req.body.match2);
		picks.push(req.body.match3);
		picks.push(req.body.match4);
		
	
	
		today.dayPick = new Date();
		today.dayPicks = picks;
		user.allPicks.push(today);
		user.save(function(err){
			if(err)
				throw err;
			res.redirect('/profile');
		})
		
	});
	
	
	app.get('/logout', function(req, res){
		req.logout();
		res.redirect('/');
	});

	
	
};

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()){
		return next();
	}

	res.redirect('/login');
}