const express = require('express')
const app = require('express')();
const http = require('http').Server(app);
const socketIO = require('socket.io');
const world = require('./js/server_world');
const world2 = require('./js/server_world2');
const world3 = require('./js/server_world3');
const path = require('path');
const hbs = require('express-handlebars');
const passport = require('passport');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const Score = require('./models/Score');

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

app.get('/mode2', authenticate, (req, res) => {
    res.render('mode2', {
        layout: 'layout_one',
        user: req.user
    });
});

app.get('/mode3', authenticate, (req, res) => {
    res.render('mode3', {
        layout: 'layout_two',
        user: req.user
    });
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/auth/google');
});

app.post('/score', async (req, res) => {
    const { userWon, score, userLost } = req.body;
    
    var newScore = new Score({userWon, score, userLost});

    await newScore.save();
})

app.set('port', (process.env.PORT || 3000));
const server = app.listen(app.get('port'), () => console.log(`Listening`)); 

const io = socketIO(server, { wsEngine: 'ws' });


// Handle connection
io.on('connection', (socket) => {
    console.log('a user connected');

    var id = null;
    var player = null;

    var id2 = null;
    var player2 = null;

    var id3 = null;
    var player3 = null;

    socket.on('connectMultiplayerOne', () => {
        socket.join('multiplayer1');

        id = socket.id;
        world.addPlayer(id);

        player = world.playerForId(id);
        socket.emit('createPlayer', player);

        socket.to('multiplayer1').emit('addOtherPlayer', player);
    })

    //MULTIPLAYER 1
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
        if(player) {
            io.in('multiplayer1').emit('removeOtherPlayer', player);
            world.removePlayer( player );
        }

        if(player2) {
            io.in('multiplayer2').emit('removeOtherPlayer', player2);
            world2.removePlayer( player2 );
        }

        if(player3) {
            io.in('multiplayer3').emit('removeOtherPlayer', player3);
            world3.removePlayer( player3 );
        }

    });

    socket.on('playerShooting', id => {
        var bullet = world.createBullet(id);
        io.in('multiplayer1').emit('shootBullet', bullet)
    })

    socket.on('playerWon', (playerName) => {
        io.in('multiplayer1').emit('endGame', playerName)
    })

    socket.on('connectMultiplayerTwo', () => {
        socket.join('multiplayer2');

        id2 = socket.id;
        world2.addPlayer(id2);

        player2 = world2.playerForId(id2);
        socket.emit('createPlayer2', player2);

        socket.to('multiplayer2').emit('addOtherPlayer', player2);
    })

    //MULTIPLAYER 2
    socket.on('requestOldPlayers2', () => {
        for (var i = 0; i < world2.players.length; i++){
            if (world2.players[i].playerId != id2)
                socket.emit('addOtherPlayer', world2.players[i]);
        }
    });

    socket.on('updatePosition2', data => {
        var newData = world2.updatePlayerData(data);
        socket.to('multiplayer2').emit('updatePosition', newData);
    });

    socket.on('moveFrontClient2', () => {
        socket.to('multiplayer2').emit('moveFrontServer');
    });

    socket.on('moveBackClient2', () => {
        socket.to('multiplayer2').emit('moveBackServer');
    });

    socket.on('playerShooting2', id => {
        var bullet = world2.createBullet(id);
        io.in('multiplayer2').emit('shootBullet', bullet)
    })

    socket.on('playerWon2', (playerName) => {
        io.in('multiplayer2').emit('endGame', playerName)
    })

    //MULTIPLAYER 3
    socket.on('connectMultiplayerThree', () => {
        socket.join('multiplayer3');

        id3 = socket.id;
        world3.addPlayer(id3);

        player3 = world3.playerForId(id3);
        socket.emit('createPlayer3', player3);

        socket.to('multiplayer3').emit('addOtherPlayer', player3);
    })

    socket.on('requestOldPlayers3', () => {
        for (var i = 0; i < world3.players.length; i++){
            if (world3.players[i].playerId != id3)
                socket.emit('addOtherPlayer', world3.players[i]);
        }
    });

    socket.on('updatePosition3', data => {
        var newData = world3.updatePlayerData(data);
        socket.to('multiplayer3').emit('updatePosition', newData);
    });

    socket.on('moveFrontClient3', () => {
        socket.to('multiplayer3').emit('moveFrontServer');
    });

    socket.on('moveBackClient3', () => {
        socket.to('multiplayer3').emit('moveBackServer');
    });

    socket.on('playerShooting3', id => {
        var bullet = world3.createBullet(id);
        io.in('multiplayer3').emit('shootBullet', bullet)
    })

    socket.on('playerWon3', (playerName) => {
        io.in('multiplayer3').emit('endGame', playerName)
    })
});