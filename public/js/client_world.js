var scene, camera, renderer, mesh, clock;
var meshFloor, ambientLight, light;

var bulletCollided = false;

var crate, crateTexture, crateNormalMap, crateBumpMap;
var mixers = [];
var otherMixers = [];
var deltaTime;

var keyboard = {};
var player = { height:1.8, speed:0.2, turnSpeed:Math.PI*0.02, canShoot:0 };
var playerObj = {};
var playerData, playerId;
var objects = [];
var otherPlayers = [], otherPlayersId = [];
var bullets = [];
var USE_WIREFRAME = false;

var loadingScreen = {
	scene: new THREE.Scene(),
	camera: new THREE.PerspectiveCamera(90, 1280/720, 0.1, 100),
	box: new THREE.Mesh(
		new THREE.BoxGeometry(0.5,0.5,0.5),
		new THREE.MeshBasicMaterial({ color:0x4444ff })
	)
};

var bullet2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.05,8,8),
    new THREE.MeshBasicMaterial({color:0xffffff})
);

var loadingManager = null;
var RESOURCES_LOADED = false;
var MORE_THAN_ONE = false;

// Models index
var models = {
	// tent: {
	// 	obj:"/models/Tent_Poles_01.obj",
	// 	mtl:"/models/Tent_Poles_01.mtl",
	// 	mesh: null
	// },
	// campfire: {
	// 	obj:"/models/Campfire_01.obj",
	// 	mtl:"/models/Campfire_01.mtl",
	// 	mesh: null
	// },
	scene: {
		obj:"/models/wall.obj",
		mtl:"/models/wall.mtl",
		mesh: null
	},
	// uzi: {
	// 	obj:"/models/uziGold.obj",
	// 	mtl:"/models/uziGold.mtl",
	// 	mesh: null,
	// 	castShadow: false
	// }
};

// Meshes index
var meshes = {};

var socket = io(); 

function loadWorld(){
    init();

    function init(){
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(90, (window.innerWidth - 100) / (window.innerHeight - 100), 0.1, 1000);
        clock = new THREE.Clock();
        
        loadingScreen.box.position.set(0,0,5);
        loadingScreen.camera.lookAt(loadingScreen.box.position);
        loadingScreen.scene.add(loadingScreen.box);
        
        loadingManager = new THREE.LoadingManager();
        loadingManager.onProgress = (item, loaded, total) => {
            console.log(item, loaded, total);
        };
        loadingManager.onLoad = () => {
            console.log("loaded all resources");
            RESOURCES_LOADED = true;
            onResourcesLoaded();
        };
        
        
        // mesh = new THREE.Mesh(
        //     new THREE.BoxGeometry(1,1,1),
        //     new THREE.MeshPhongMaterial({color:0xff4444, wireframe:USE_WIREFRAME})
        // );
        // mesh.position.y += 1;
        // mesh.receiveShadow = true;
        // mesh.castShadow = true;
        // scene.add(mesh);
        
        meshFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(500,500, 10,10),
            new THREE.MeshPhongMaterial({color:0xffffff, wireframe:USE_WIREFRAME})
        );
        meshFloor.rotation.x -= Math.PI / 2;
        meshFloor.receiveShadow = true;
        scene.add(meshFloor);
        
        
        ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        
        light = new THREE.PointLight(0xffffff, 0.2, 100000000);
        light.position.set(-3,6,-3);
        light.castShadow = true;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 25;
        // scene.add(light);
        
        
        var textureLoader = new THREE.TextureLoader(loadingManager);
        crateTexture = textureLoader.load("/js/crate0/crate0_diffuse.jpg");
        crateBumpMap = textureLoader.load("/js/crate0/crate0_bump.jpg");
        crateNormalMap = textureLoader.load("/js/crate0/crate0_normal.jpg");
        
        // crate = new THREE.Mesh(
        //     new THREE.BoxGeometry(3,3,3),
        //     new THREE.MeshPhongMaterial({
        //         color:0xffffff,
        //         map:crateTexture,
        //         bumpMap:crateBumpMap,
        //         normalMap:crateNormalMap
        //     })
        // );
        // scene.add(crate);
        // crate.position.set(2.5, 3/2, 2.5);
        // crate.receiveShadow = true;
        // crate.castShadow = true;
        
        // Load models
        // REMEMBER: Loading in Javascript is asynchronous, so you need
        // to wrap the code in a function and pass it the index. If you
        // don't, then the index '_key' can change while the model is being
        // downloaded, and so the wrong model will be matched with the wrong
        // index key.
        for( var _key in models ){
            (key => {
                
                var mtlLoader = new THREE.MTLLoader(loadingManager);
                mtlLoader.load(models[key].mtl, materials => {
                    materials.preload();
                    
                    var objLoader = new THREE.OBJLoader(loadingManager);
                    
                    objLoader.setMaterials(materials);
                    objLoader.load(models[key].obj, mesh => {
                        
                        mesh.traverse(node => {
                            if( node instanceof THREE.Mesh ){
                                if('castShadow' in models[key])
                                    node.castShadow = models[key].castShadow;
                                else
                                    node.castShadow = true;
                                
                                if('receiveShadow' in models[key])
                                    node.receiveShadow = models[key].receiveShadow;
                                else
                                    node.receiveShadow = true;
                            }
                        });
                        models[key].mesh = mesh;
                        
                    });
                });
                
            })(_key);
        }        
        
        camera.position.set(0, player.height, -5);
        camera.lookAt(new THREE.Vector3(0,player.height,0));
        
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(1280, 720);

        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.BasicShadowMap;
        
        document.getElementById("canvasContainer").appendChild(renderer.domElement);
        
        animate();
    }
}

// Runs when all resources are loaded
function onResourcesLoaded(){
	
    /*
    // Clone models into meshes.
    meshes["tent1"] = models.tent.mesh.clone();
    meshes["tent2"] = models.tent.mesh.clone();
	meshes["campfire1"] = models.campfire.mesh.clone();
	meshes["campfire2"] = models.campfire.mesh.clone();
    */
    
    meshes["scene"] = models.scene.mesh.clone();
    
    /*
    objects.push(meshes["tent1"]);
    objects.push(meshes["tent2"]);
	
	// Reposition individual meshes, then add meshes to scene
	meshes["tent1"].position.set(-5, 0, 4);
	scene.add(meshes["tent1"]);
	
	meshes["tent2"].position.set(-8, 0, 4);
	scene.add(meshes["tent2"]);
	
	meshes["campfire1"].position.set(-5, 0, 1);
	meshes["campfire2"].position.set(-8, 0, 1);
	
	scene.add(meshes["campfire1"]);
    scene.add(meshes["campfire2"]);
    */
	
	meshes["scene"].position.set(-11, 0, 1);
    meshes["scene"].rotation.set(0, Math.PI, 0); // Rotate it to face the other way.
    meshes["scene"].scale.set(2, 2, 2);
    scene.add(meshes["scene"]);
}

function animate(){
    // Play the loading screen until resources are loaded.
	if(RESOURCES_LOADED == false){
        requestAnimationFrame(animate);
        
        console.log(otherPlayers.length)
		
		loadingScreen.box.position.x -= 0.05;
		if( loadingScreen.box.position.x < -10 ) loadingScreen.box.position.x = 10;
		loadingScreen.box.position.y = Math.sin(loadingScreen.box.position.x);
		
		renderer.render(loadingScreen.scene, loadingScreen.camera);
		return;
    }

    // if(otherPlayers.length < 1) {
    //     requestAnimationFrame(animate);
		
	// 	loadingScreen.box.position.x -= 0.05;
	// 	if( loadingScreen.box.position.x < -10 ) loadingScreen.box.position.x = 10;
	// 	loadingScreen.box.position.y = Math.sin(loadingScreen.box.position.x);
		
	// 	renderer.render(loadingScreen.scene, loadingScreen.camera);
	// 	return;
    // }

    requestAnimationFrame(animate);
    
	
	var time = Date.now() * 0.0005;
	var delta = clock.getDelta();
	
	// mesh.rotation.x += 0.01;
	// mesh.rotation.y += 0.02;
	// crate.rotation.y += 0.01;
	// Uncomment for absurdity!
    // meshes["scene"].rotation.z += 0.01;
    // go through bullets array and update position
	// remove bullets when appropriate
    for(var index=0; index<bullets.length; index+=1){
		if( bullets[index] === undefined ) continue;
		if( bullets[index].alive == false ){
			bullets.splice(index,1);
			continue;
		}
		
        bullets[index].position.add(bullets[index].velocity);
        var originPoint = bullets[index].position.clone();
        for (var vertexIndex = 0; vertexIndex < bullets[index].geometry.vertices.length; vertexIndex++){
            var localVertex = bullets[index].geometry.vertices[vertexIndex].clone();
            var globalVertex = localVertex.applyMatrix4(bullets[index].matrix);
            var directionVector = globalVertex.sub(bullets[index].position);
            
            var ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
            var collisionResults = ray.intersectObjects(objects, true);
            if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() && bulletCollided === false) {
                // console.log("collided");
                bulletCollided = true;
                // console.log(playerObj)
                // if(collisionResults[0].object.parent === meshes["tent1"]){
                //     scene.remove(collisionResults[0].object.parent);
                // }
                continue;
            }
        }	
    }

    // var originPoint = playerObj.position.clone();
    // for (var vertexIndex = 0; vertexIndex < playerObj.children[0].geometry.vertices.length; vertexIndex++){
    //     var localVertex = playerObj.geometry.vertices[vertexIndex].clone();
    //     var globalVertex = localVertex.applyMatrix4( playerObj.matrix );
    //     var directionVector = globalVertex.sub( playerObj.position );
        
    //     var ray = new THREE.Raycaster( originPoint, directionVector.clone().normalize() );
    //     var collisionResults = ray.intersectObjects(objects, true);
    //     if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
    //         console.log("collided");
    //     }
    // }

    socket.on('moveFrontServer', function(){
        otherMixers.forEach(b => {
            b.update(delta * 0.001);
        });
    })

    socket.on('moveBackServer', function(){
        otherMixers.forEach(b => {
            b.update(-delta * 0.001);
        });
    })
	
	if(keyboard[87]){ // W key
		camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
        camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
        updatePlayerData();
        mixers.forEach(b => {
            b.update(delta * 0.0001);
        });
        socket.emit('updatePosition', playerData);
        socket.emit('moveFrontClient');
	}
	if(keyboard[83]){ // S key
		camera.position.x += Math.sin(camera.rotation.y) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
        updatePlayerData();
        mixers.forEach(b => {
            b.update(-delta * 0.0001);
        });
        socket.emit('updatePosition', playerData);
        socket.emit('moveBackClient');
	}
	if(keyboard[65]){ // A key
		camera.position.x += Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
        updatePlayerData();
        socket.emit('updatePosition', playerData);
	}
	if(keyboard[68]){ // D key
		camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
        updatePlayerData();
        socket.emit('updatePosition', playerData);
	}
	
	if(keyboard[37]){ // left arrow key
        camera.rotation.y -= player.turnSpeed;
        updatePlayerData();
        socket.emit('updatePosition', playerData);
	}
	if(keyboard[39]){ // right arrow key
        camera.rotation.y += player.turnSpeed;
        updatePlayerData();
        socket.emit('updatePosition', playerData);
    }

    // shoot a bullet
	if(keyboard[32] && player.canShoot <= 0){ // spacebar key        
        socket.emit('playerShooting', playerId);
        bulletCollided = false
    }

	if(player.canShoot > 0) player.canShoot -= 1;
	
	render()
}

function render(){
    if (playerObj){
        updateCameraPosition();
        // camera.lookAt( new THREE.Vector3(0,player.height,0) );
    }
    //Render Scene---------------------------------------
    renderer.clear();
    renderer.render( scene , camera );
}

function keyDown(event){
	keyboard[event.keyCode] = true;
}

function keyUp(event){
	keyboard[event.keyCode] = false;
}

var createPlayer = data => {
    playerData = data;

    var cargador = new THREE.FBXLoader();
    cargador.load('models/player.fbx', function(object) {
        object.mixer = new THREE.AnimationMixer(object);
        var action = object.mixer.clipAction(object.animations[0]);

        playerObj = object;
        playerObj.position.set(data.x,data.y,data.z);
        playerObj.scale.set(0.003,0.003,0.003);

        playerId = data.playerId;

        mixers.push(playerObj.mixer);
        action.play();
        action.timescale = 1;

        objects.push(playerObj);
        scene.add(playerObj);

        updateCameraPosition();
        
        // camera.lookAt( player.position );
        camera.lookAt(new THREE.Vector3(0,player.height,0));
    })

    // var mtlLoader = new THREE.MTLLoader(loadingManager);
    // mtlLoader.load(models.uzi.mtl, materials => {
    //     materials.preload();
        
    //     var objLoader = new THREE.OBJLoader(loadingManager);
        
    //     objLoader.setMaterials(materials);
    //     objLoader.load(models.uzi.obj, mesh => {
            
    //         mesh.traverse(node => {
    //             if( node instanceof THREE.Mesh ){
    //                 if('castShadow' in models.uzi)
    //                     node.castShadow = models.uzi.castShadow;
    //                 else
    //                     node.castShadow = true;
                    
    //                 if('receiveShadow' in models.uzi)
    //                     node.receiveShadow = models.uzi.receiveShadow;
    //                 else
    //                     node.receiveShadow = true;
    //             }
    //         });
    //         models.uzi.mesh = mesh;

    //         playerObj = mesh;

    //         playerObj.position.set(data.x,data.y,data.z);
    //         playerObj.scale.set(10,10,10);

    //         playerId = data.playerId;
        
    //         updateCameraPosition();
        
    //         objects.push( playerObj );
    //         scene.add( playerObj );
        
    //         // camera.lookAt( player.position );
    //         camera.lookAt(new THREE.Vector3(0,player.height,0));
            
    //     });
    // });
};

var addOtherPlayer = data => {
    var cargador = new THREE.FBXLoader();
    cargador.load('models/player.fbx', function(object) {
        object.mixer = new THREE.AnimationMixer(object);
        var action = object.mixer.clipAction(object.animations[0]);
        // models.uzi.mesh = mesh;

        // var otherPlayer = mesh;

        // otherPlayer.position.set(data.x,data.y,data.z);
        // otherPlayer.scale.set(10,10,10);

        // otherPlayersId.push( data.playerId );
        // otherPlayers.push( otherPlayer );
        // objects.push( otherPlayer );
        // scene.add( otherPlayer );

        var otherPlayer = object;
        otherPlayer.position.set(data.x,data.y - 1.1,data.z);
        otherPlayer.scale.set(0.0042,0.0042,0.0042);

        otherMixers.push(otherPlayer.mixer);
        action.play();
        action.timescale = 0.000000001;

        otherPlayersId.push( data.playerId );
        otherPlayers.push( otherPlayer );
        objects.push( otherPlayer );
        scene.add( otherPlayer );
    })

    // var mtlLoader = new THREE.MTLLoader(loadingManager);
    // mtlLoader.load(models.uzi.mtl, materials => {
    //     materials.preload();
        
    //     var objLoader = new THREE.OBJLoader(loadingManager);
        
    //     objLoader.setMaterials(materials);
    //     objLoader.load(models.uzi.obj, mesh => {
            
    //         mesh.traverse(node => {
    //             if( node instanceof THREE.Mesh ){
    //                 if('castShadow' in models.uzi)
    //                     node.castShadow = models.uzi.castShadow;
    //                 else
    //                     node.castShadow = true;
                    
    //                 if('receiveShadow' in models.uzi)
    //                     node.receiveShadow = models.uzi.receiveShadow;
    //                 else
    //                     node.receiveShadow = true;
    //             }
    //         });

    //         models.uzi.mesh = mesh;

    //         var otherPlayer = mesh;

    //         otherPlayer.position.set(data.x,data.y,data.z);
    //         otherPlayer.scale.set(10,10,10);

    //         otherPlayersId.push( data.playerId );
    //         otherPlayers.push( otherPlayer );
    //         objects.push( otherPlayer );
    //         scene.add( otherPlayer );
    //     });
    // });

    // otherPlayer.position.x = data.x;
    // otherPlayer.position.y = data.y;
    // otherPlayer.position.z = data.z;

    // otherPlayersId.push( data.playerId );
    // otherPlayers.push( otherPlayer );
    // objects.push( otherPlayer );
    // scene.add( otherPlayer );

};

var updateCameraPosition = () => {

    var time = Date.now() * 0.0005;

    // playerObj.position.set(
	// 	camera.position.x - Math.sin(camera.rotation.y + Math.PI/6) * 0.75,
	// 	(camera.position.y - 0.5 + Math.sin(time*4 + camera.position.x + camera.position.z)*0.01),
	// 	camera.position.z + Math.cos(camera.rotation.y + Math.PI/6) * 0.75
    // );

    playerObj.position.set(
		camera.position.x + (Math.sin(camera.rotation.y + Math.PI/6) * 0.2),
		camera.position.y - 1.1 + Math.sin(time*4 + camera.position.x + camera.position.z) * 0.01,
		camera.position.z - (Math.cos(camera.rotation.y + Math.PI/6) * 0.2)
    );
    
	playerObj.rotation.set(
		camera.rotation.x,
		camera.rotation.y - Math.PI,
		camera.rotation.z
    );

    // camera.position.x = playerObj.position.x + 6 * Math.sin( playerObj.rotation.y );
    // camera.position.y = playerObj.position.y + 6;
    // camera.position.z = playerObj.position.z + 6 * Math.cos( playerObj.rotation.y );

};

var updatePlayerPosition = data => {

    var somePlayer = playerForId(data.playerId);

    somePlayer.position.x = data.x;
    somePlayer.position.y = data.y - 0.5;
    somePlayer.position.z = data.z;

    // somePlayer.position.set(
	// 	data.x - Math.sin(data.r_x + Math.PI/6) * 0.75,
	// 	data.y - 0.5 + Math.sin(time*4 + data.r_x + data.r_z)*0.01,
	// 	data.x + Math.cos(data.r_x + Math.PI/6) * 0.75
    // );
    
    // somePlayer.rotation.set(
	// 	data.r_x,
	// 	data.r_y - Math.PI,
	// 	data.r_z
    // );

    somePlayer.rotation.x = data.r_x;
    somePlayer.rotation.y = data.r_y;
    somePlayer.rotation.z = data.r_z;

};

var updatePlayerData = () => {
    playerData.x = playerObj.position.x;
    playerData.y = playerObj.position.y;
    playerData.z = playerObj.position.z;

    playerData.r_x = playerObj.rotation.x;
    playerData.r_y = playerObj.rotation.y;
    playerData.r_z = playerObj.rotation.z;

};

var removeOtherPlayer = data => {
    scene.remove( playerForId(data.playerId) );
    var index = otherPlayers.indexOf(data);
    var indexId = otherPlayersId.indexOf(data.playerId);
    otherPlayers.splice(index, 1);
    otherPlayersId.splice(indexId, 1);
};

var playerForId = id => {
    var index;
    for (var i = 0; i < otherPlayersId.length; i++){
        if (otherPlayersId[i] == id){
            index = i;
            break;
        }
    }
    return otherPlayers[index];
};

var shootBullet = data => {
    // creates a bullet as a Mesh object
    var bullet = new THREE.Mesh(
        new THREE.SphereGeometry(0.05,8,8),
        new THREE.MeshBasicMaterial({color:0xffffff})
    );
    
    // position the bullet to come from the player's weapon
    bullet.position.set(
        data.x,
        data.y + 0.15,
        data.z
    );

    if(data.playerShooting == playerId) {
        // set the velocity of the bullet
        bullet.velocity = new THREE.Vector3(
            -Math.sin(camera.rotation.y),
            0,
            Math.cos(camera.rotation.y)
        );
    } else {
        bullet.velocity = new THREE.Vector3(
            Math.sin(data.r_y),
            0,
            -Math.cos(data.r_y)
        );
    }
    
    // after 1000ms, set alive to false and remove from scene
    // setting alive to false flags our update code to remove
    // the bullet from the bullets array
    bullet.alive = true;
    setTimeout(() => {
        bullet.alive = false;
        scene.remove(bullet);
    }, 1000);
    
    // add to scene, array, and set the delay to 10 frames
    bullets.push(bullet);
    scene.add(bullet);
    player.canShoot = 50;
}

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

