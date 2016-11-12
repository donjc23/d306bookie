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
		if(hour > 18) //18  //15
			sevenOclock = true;
		User.find(function(err, users){
			if(err)
				throw err;
			for(var i=0; i<users.length; i++) {
				var stuff = {};
				var temp = [];
				temp = users[i].allPicks;
				var yesterday = temp[temp.length - 1];
				if(yesterday){
					var date = yesterday.dayPick;
					var day = moment(date).day();
					//var day = date.getDay();
					stuff.name = users[i].local.username;
					stuff.score = users[i].score;
					stuff.daywins = users[i].daywins;
					stuff.games = users[i].games;
					if (day == tday){
						stuff.picks = yesterday.dayPicks;
					}else{
						stuff.picks = [];
					}
				}else{
					stuff.name = users[i].local.username;
					stuff.score = users[i].score;
					stuff.daywins = users[i].daywins;
					stuff.games = users[i].games; 
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
		var allPicks=[];
		var temp = [];
		temp = user.allPicks;
		for(var i=0; i<temp.length; i++) {
			allPicks.push(temp[i].dayPicks);
		}
		var today = new Date();
		var estday = moment(today).format('ha z');
		var tday = moment(today).day();
		var hour = moment(today).hour();
		var sevenOclock = false;
		var nextDay = false;
		if(hour > 18) //18-7pm  //15-4pm
			sevenOclock = true;
		var lastPick = temp[temp.length - 1];
		if(lastPick){
			var date = lastPick.dayPick;
			//var day = date.getDay();
			var day = moment(date).day();
			if (day == tday){
				picks = lastPick.dayPicks;
			}else{
				picks = [];
				if(hour < 12){
					nextDay = true;
				}
			}
		}
		res.render('profile.ejs', {allPicks : allPicks, picks: picks, day: estday, name: user.local.username, sevenOclock: sevenOclock, nextDay: nextDay});
	});
	
	app.post('/score', function(req, res){
		var result = ['76ers+5','Cavaliers-7','Raptors+3','Jazz-4','Celtics-6','Thunder+4.5','Spurs-8.5','Kings+6'];
		var size = result.length;
		var today = new Date();
		var tday = moment(today).day();
		//console.log('tday is ' + tday);	
		User.find(function(err, users){
			if(err)
				throw err;
			for(var i=0; i<users.length; i++) {
				var todayscore = 0;
				var temp = [];
				temp = users[i].allPicks;
				var yesterday = temp[temp.length - 1];
				if(yesterday){
					var picks = yesterday.dayPicks;
					var ysize = picks.length;
					var date = yesterday.dayPick;
					var day = moment(date).day();
					//var day = date.getDay();
					//console.log('pday is ' + day);
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
							users[i].games = users[i].games + picks.length; //61-64
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
							users[i].games = users[i].games + picks.length;
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
		picks.push(req.body.match5);
		picks.push(req.body.match6);
		picks.push(req.body.match7);
		picks.push(req.body.match8);
		picks.push(req.body.match9);
		picks.push(req.body.match10);
		picks.push(req.body.match11);
		
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
