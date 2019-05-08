const express = require('express')
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const world = require('./js/server_world');
const path = require('path');
const hbs = require('express-handlebars');

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

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'other'
    })
});

app.get('/register', (req, res) => {
    res.render('register', {
        layout: 'other'
    })
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

});

// Handle environment changes
var port = process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ip_address = process.env.OPENSHIFT_NODEJS_IP || '172.16.6.218';
 
http.listen(port, ip_address, () => {
    console.log( "Listening on " + ip_address + ", server_port " + port );
});
