// store all players
var players = [];
var bullets = [];

function Player(id){

    this.playerId = id;
    this.x = 0;
    this.y = 1.5;
    this.z = -5;
    this.r_x = 0;
    this.r_y = 0;
    this.r_z = 0;

}

function Bullet(id, x, y, z, r_y){
    this.playerShooting = id;
    this.x = x;
    this.y = y;
    this.z = z;
    this.r_y = r_y;
}

var addPlayer = function(id){

    var player = new Player(id);
    players.push( player );

    return player;
};

var createBullet = function(id){
    var player = playerForId(id);
    var bullet = new Bullet(id, player.x, player.y, player.z, player.r_y)

    return bullet;
}

var removePlayer = function(player){

    var index = players.indexOf(player);

    if (index > -1) {
        players.splice(index, 1);
    }
};

var updatePlayerData = function(data){
    var player = playerForId(data.playerId);
    player.x = data.x;
    player.y = data.y;
    player.z = data.z;
    player.r_x = data.r_x;
    player.r_y = data.r_y;
    player.r_z = data.r_z;

    return player;
};

var playerForId = function(id){

    var player;
    for (var i = 0; i < players.length; i++){
        if (players[i].playerId === id){

            player = players[i];
            break;

        }
    }

    return player;
};

module.exports.players = players;
module.exports.addPlayer = addPlayer;
module.exports.createBullet = createBullet;
module.exports.removePlayer = removePlayer;
module.exports.updatePlayerData = updatePlayerData;
module.exports.playerForId = playerForId;
