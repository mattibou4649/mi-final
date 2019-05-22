const express = require('express')
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const world = require('./js/server_world');
const path = require('path');
const hbs = require('express-handlebars');
const passport = require('passport');
const dotenv = require('dotenv');

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
    res.redirect('/auth/facebook');
}

// Facebook login
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/', failureRedirect: '/auth/facebook' }));

app.get('/auth/facebook/logout', authenticate, (req, res) => {
    req.logout();
    res.redirect('/auth/facebook');
});

// Routes
app.get('/', authenticate, (req, res) => {
    res.render('index', {
        user: req.user
    });
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/auth/facebook');
});


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

    socket.on('playerDied', id => {
        var bullet = world.createBullet(id);
        io.in('multiplayer1').emit('endGame', winner)
    })

});

app.set('port', (process.env.PORT || 5000));

app.listen(app.get('port'), function(){
    console.log( "Listening");
})