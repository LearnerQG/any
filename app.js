const express			= require('express');
const session			= require('express-session');
const hbs				= require('express-handlebars');
const mongoose			= require('mongoose');
const passport			= require('passport');
const localStrategy		= require('passport-local').Strategy;
const bcrypt			= require('bcrypt');
const app				= express();
require('dotenv').config();

const expressLayouts = require('express-ejs-layouts');


mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true});
// options usecreateindex, usefindandmodify are not supported
// my last code was like this: mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false }); *And that was giving me mongoose error.
// And the process.env.DATABASE_URL works just as i menion here. It first takes the .env file and that it grabs the DATABASE_URL of that .env file and takes the value that is after equal(=) sign. In our case the value is mongodb://localhost/mybrary
const db = mongoose.connection

db.on('error', error=>console.error(error))


db.once('open', ()=> console.log('Connected to mongoose'))


const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true
	},
	password: {
		type: String,
		required: true
	}
});

const User = mongoose.model('User', UserSchema);


// Middleware
// app.engine('hbs', hbs({ extname: '.hbs' }));
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(session({
	secret: "verygoodsecret",
	resave: false,
	saveUninitialized: true
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Passport.js
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});


passport.use(new localStrategy(function (username, password, done) {
	User.findOne({ username: username }, function (err, user) {
		if (err) return done(err);
		if (!user) return done(null, false, { message: 'Incorrect username.' });

		bcrypt.compare(password, user.password, function (err, res) {
			if (err) return done(err);
			if (res === false) return done(null, false, { message: 'Incorrect password.' });
			
			return done(null, user);
		});
	});
}));


function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) return next();
	res.redirect('/login');
}

function isLoggedOut(req, res, next) {
	if (!req.isAuthenticated()) return next();
	res.redirect('/');
}

// ROUTES
app.get('/', isLoggedIn, (req, res) => {
	res.render("index", { title: "Home" });
});

app.get('/about', (req, res) => {
	res.render("index", { title: "About" });
});

app.get('/login', isLoggedOut, (req, res) => {
	const response = {
		title: "Login",
		error: req.query.error
	}

	res.render('login', response);
});

app.post('/login', passport.authenticate('local', {
	successRedirect: '/',
	failureRedirect: '/login?error=true'
}));

app.get('/logout', function (req, res) {
	req.logout();
	res.redirect('/');
});

// Setup our admin user
app.get('/setup', async (req, res) => {
	const exists = await User.find({ username:req.body.username});


	// if (exists) {
	//res.redirect('/login');
	//	return;
	//};

	bcrypt.genSalt(10, function (err, salt) {
		if (err) return next(err);
bcrypt.hash("passwo", salt
, function (err, hash) {
		if (err) return next(err);
			
			const newAdmin = new User({
				username: "admin3",
				password: hash
			});

			newAdmin.save();

			res.redirect('/login');
		});
	});
});

app.listen(3000, () => {
	console.log("Listening on port 3000");
});
