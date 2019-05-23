const express = require('express')
const app = require('express')();
const http = require('http').Server(app);
const socketIO = require('socket.io');
const world = require('./js/server_world');
const path = require('path');
const hbs = require('express-handlebars');
const passport = require('passport');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

dotenv.config()

// HBS
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/'
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Public folder
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Mongo Connection
mongoose.connect(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@ds341825.mlab.com:41825/mi-final`, {useNewUrlParser: true}).then(() => {
    console.log('MongoDB Connected!');
}).catch(e => console.log(e));

// Passport middleware
app.use(require('express-session')({ secret: process.env.EXPRESS_SESSION_KEY, resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// Passport config
require('./config/passport')(passport);

// Authenticate middleware
const authenticate = (req, res, next) => {
    if (req.isAuthenticated()) { 
        console.log("authenticated");
        return next(); 
    }
    res.redirect('/auth/google');
}

// Facebook login
app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

app.get('/auth/google/callback', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/auth/google' }));

app.get('/auth/google/logout', authenticate, (req, res) => {
    req.logout();
    res.redirect('/auth/google');
});

// Routes
app.get('/', authenticate, (req, res) => {
    res.render('index', {
        user: req.user
    });
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/auth/google');
});

app.set('port', (process.env.PORT || 3000));
const server = app.listen(app.get('port'), () => console.log(`Listening`)); 

const io = socketIO(server, { wsEngine: 'ws' });


// Handle connection
io.on('connection', (socket) => {
    console.log('a user connected');

    var id;
    var player;

    socket.on('connectMultiplayerOne', () => {
        socket.join('multiplayer1');

        id = socket.id;
        world.addPlayer(id);

        player = world.playerForId(id);
        socket.emit('createPlayer', player);

        socket.to('multiplayer1').emit('addOtherPlayer', player);
    })

    socket.on('requestOldPlayers', () => {
        for (var i = 0; i < world.players.length; i++){
            if (world.players[i].playerId != id)
                socket.emit('addOtherPlayer', world.players[i]);
        }
    });

    socket.on('updatePosition', data => {
        var newData = world.updatePlayerData(data);
        socket.to('multiplayer1').emit('updatePosition', newData);
    });

    socket.on('moveFrontClient', () => {
        socket.to('multiplayer1').emit('moveFrontServer');
    });

    socket.on('moveBackClient', () => {
        socket.to('multiplayer1').emit('moveBackServer');
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        io.in('multiplayer1').emit('removeOtherPlayer', player);
        world.removePlayer( player );
    });

    socket.on('playerShooting', id => {
        var bullet = world.createBullet(id);
        io.in('multiplayer1').emit('shootBullet', bullet)
    })

    socket.on('playerWon', (playerName) => {
        io.in('multiplayer1').emit('endGame', playerName)
    })

});