const windowWidth = 800;
const windowHeight = 600;

const config = {
    type: Phaser.AUTO,
    scale: {
        //mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,
        width: windowWidth,
        height: windowHeight
    },
    scene: {
        preload: preload,
        create: create,
        update: update,
        physics: {
            arcade: {
                debug: false
            },
            matter: {
                gravity: false,
                setBounds: false,
                debug: false
            }
        }
    }
};

var chunks, chunkBounds;
var player, shield, explosion, crosshair;
var meteorPool, laserPool;
var particles;
var cursors, spacebar;
var score = 0;
var scoreText;
var UICam;
var shapes;
var cat1, cat2, cat3;

const game = new Phaser.Game(config);

class Meteor extends Phaser.Physics.Matter.Image {
    constructor(scene, x, y, key) {
        super(scene.matter.world, x, y, key, null, {
            shape: shapes.key,
            isSensor: true,
            frictionAir: 0
        });
        this.setDataEnabled();
        this.setCollisionCategory(cat2);
        this.setCollidesWith([cat1, cat3]);
        this.updateVel();
        UICam.ignore(this);
    }

    updateVel() {
        if (this.texture.key.search('Big') == 6) {
            this.data.set('health', 6);
            this.speed = Phaser.Math.Between(2, 3);
        } else if (this.texture.key.search('Med') == 6) {
            this.data.set('health', 2);
            this.speed = Phaser.Math.Between(3, 4);
        } else {
            this.data.set('health', 1);
            this.speed = Phaser.Math.Between(5, 6);
        }
        this.direction = Math.atan((player.x - this.x)/(player.y - this.y));
        this.speed = (player.y >= this.y) ? this.speed:-this.speed;
        this.setVelocityX(this.speed*Math.sin(this.direction));
        this.setVelocityY(this.speed*Math.cos(this.direction));
        this.setAngularVelocity(Phaser.Math.FloatBetween(-0.02, 0.02));
    }

    emitParticles() {
        particles.setTexture('meteorParticle' + Phaser.Math.Between(0, 1));
        var emitter = particles.createEmitter({
            speed: 100,
            scale: { start: 2, end: 0 },
            lifespan: 500,
            on: false
        });
        emitter.emitParticle(20, this.x + this.width/2, this.y + this.height/2);
    }
}

class MeteorPool extends Phaser.GameObjects.Group {
    constructor(scene, config = {}) {
        const defaults = {
            maxSize: -1
        }
        super(scene, Object.assign(defaults, config));
    }

    spawn(x, y, key) {
        const spawnExisting = this.countActive(false) > 0;
        var meteor;
        if (spawnExisting) {
            meteor = this.getFirstDead(false, x, y);
            meteor.setActive(true);
            meteor.setVisible(true);
            meteor.updateVel();
            meteor.world.add(meteor.body);
        } else {
            meteor = new Meteor(this.scene, x, y, key);
            this.add(meteor, true);
        }
        return meteor;
    }

    despawn(meteor) {
        meteor.setActive(false);
        meteor.setVisible(false);
        meteor.world.remove(meteor.body);
    }
}

class Laser extends Phaser.Physics.Matter.Image {
    constructor(scene, x, y, tx, ty, rotation) {
        super(scene.matter.world, x, y, 'laser', null, {
            isSensor: true,
            frictionAir: 0
        });
        this.setCollisionCategory(cat1);
        this.setCollidesWith(cat2);
        this.updateVel(x, y, tx, ty, rotation);
        UICam.ignore(this);
    }

    updateVel(x, y, tx, ty, rotation) {
        this.direction = Math.atan((tx-x) / (ty-y));
        this.speed = (ty >= y) ? 20:-20;
        this.setVelocityX(this.speed*Math.sin(this.direction));
        this.setVelocityY(this.speed*Math.cos(this.direction));
        this.rotation = rotation;
    }
}

class LaserPool extends Phaser.GameObjects.Group {
    constructor(scene, config = {}) {
        const defaults = {
            maxSize: -1
        }
        super(scene, Object.assign(defaults, config));
    }

    spawn(x, y, tx, ty, rotation) {
        const spawnExisting = this.countActive(false) > 0;
        var laser;
        if (spawnExisting) {
            laser = this.getFirstDead(false, x, y);
            laser.setActive(true);
            laser.setVisible(true);
            laser.updateVel(x, y, tx, ty, rotation);
            laser.world.add(laser.body);
        } else {
            laser = new Laser(this.scene, x, y, tx, ty, rotation);
            this.add(laser, true);
        }
        return laser;
    }

    despawn(laser) {
        laser.setActive(false);
        laser.setVisible(false);
        laser.world.remove(laser.body);
    }
}

class Player extends Phaser.Physics.Matter.Image {
    constructor(scene, x, y) {
        super(scene.matter.world, x, y, 'player', null, {
            isSensor: true,
            frictionAir: 0
        });
        this.setScale(0.5);
        scene.add.existing(this);
        this.setDataEnabled();
        this.setCollisionCategory(cat3);
        this.setCollidesWith(cat2);
        this.health = 3;
    }
}

function preload() {
    this.load.image('player', 'assets/playerShip1_orange.png');
    this.load.image('laser', 'assets/laserRed05.png');
    this.load.image('crosshair', 'assets/crosshair.png');
    this.load.image('background', 'assets/background.png');
    for (var i=0;i<9;i++) {
        if (i<2) {
            this.load.image('meteorParticle'+i, 'assets/meteorBrown_tiny'+i+'.png');
            this.load.image('meteorMed'+i, 'assets/meteorBrown_med'+i+'.png');
            this.load.image('meteorSmall'+i, 'assets/meteorBrown_small'+i+'.png');
        }
        if (i<3) {
            this.load.image('shield'+i, 'assets/shield'+i+'.png');
        }
        if (i<4) {
            this.load.image('meteorBig'+i, 'assets/meteorBrown_big'+i+'.png');
        }
        this.load.image('explosion'+i, 'assets/explosion0'+i+'.png');
    }
    this.load.bitmapFont('spaceFont', 'assets/kenvector_future_0.png', 'assets/kenvector_future.xml');
    this.load.json('shapes', 'assets/shapes.json');
}

function create() {
    cat1 = this.matter.world.nextCategory();
    cat2 = this.matter.world.nextCategory();
    cat3 = this.matter.world.nextCategory();

    chunks = this.add.container();
    var x = 0, y = -windowHeight;
    for (var i=0;i<9;i++) {
        var sprite = this.physics.add.image(-windowWidth + (x*windowWidth), y, 'background').setOrigin(0);
        sprite.name = i;
        chunks.add(sprite);
        x++;
        if (x == 3) { x = 0; y += windowHeight; }
    }

    chunkBounds = {
        top: {
            x: chunks.getAt(3).x,
            y: chunks.getAt(3).y
        },
        left: {
            x: chunks.getAt(1).x,
            y: chunks.getAt(1).y
        },
        right: {
            x: chunks.getAt(2).x,
            y: chunks.getAt(2).y
        },
        bottom: {
            x: chunks.getAt(6).x,
            y: chunks.getAt(6).y
        }
    }

    player = new Player(this, windowWidth/2, windowHeight/2);
    this.cameras.main.startFollow(player, false, 0.5, 0.5);
    this.cameras.main.zoom = 0.75;
    crosshair = this.matter.add.image(0, 0, 'crosshair');
    explosion = this.physics.add.sprite(0, 0, 'explosion0')
        .setScale(0.25)
        .setVisible(false);
    shield = this.physics.add.sprite(player.x, player.y, 'shield0')
        .setScale(0.5)
        .setVisible(false);
    meteorPool = new MeteorPool(this);
    laserPool = new LaserPool(this);
    particles = this.add.particles('meteorParticle0');
    cursors = this.input.keyboard.createCursorKeys();
    spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    shapes = this.cache.json.get('shapes');
    UICam = this.cameras.add(0, 0, windowWidth, windowHeight);
    scoreText = this.add.bitmapText(16, 16, 'spaceFont', "Score: " + score);
    this.cameras.main.ignore(scoreText);
    var children = this.children.getChildren();
    for (var x in children) {
        if (children[x] != scoreText) {
            UICam.ignore(children[x]);
        }
    }

    this.matter.world.on('collisionstart', function (event) {
        var player, laser, meteor, key1, key2;
        var pairs = event.pairs.slice();
        for (var i=0;i<pairs.length;i++) {
            try {
                key1 = pairs[i].bodyA.gameObject.texture.key;
                key2 = pairs[i].bodyB.gameObject.texture.key;
                if (key1 == 'player' || key2 == 'player') {
                    if (key1 == 'player' && key2.includes('meteor')) {
                        player = pairs[i].bodyA.gameObject;
                        meteor = pairs[i].bodyB.gameObject;
                    } else if (key1.includes('meteor') && key2 == 'player') {
                        player = pairs[i].bodyB.gameObject;
                        meteor = pairs[i].bodyA.gameObject;
                    }
                    if (player.visible) {
                        meteor.emitParticles();
                        meteorPool.despawn(meteor);
                        if (!shield.anims.isPlaying) {
                            player.setVelocity(0);
                            crosshair.setVelocity(0);
                            player.setVisible(false);
                            explosion.x = player.x;
                            explosion.y = player.y;
                            explosion.setVisible(true);
                            explosion.anims.play('explosion');
                        }
                    }
                } else {
                    if (key1 == 'laser' && key2.includes('meteor')) {
                        laser = pairs[i].bodyA.gameObject;
                        meteor = pairs[i].bodyB.gameObject;
                    } else if (key1.includes('meteor') && key2 == 'laser') {
                        laser = pairs[i].bodyB.gameObject;
                        meteor = pairs[i].bodyA.gameObject;
                    }
                    laserPool.despawn(laser);
                    var health = meteor.data.get('health');
                    if (health <= 1) {
                        meteor.emitParticles();
                        meteorPool.despawn(meteor);
                        scoreUp(meteor.texture.key);
                    } else {
                        var timeline = game.scene.getAt(0).tweens.timeline();
                        timeline.add({
                            targets: meteor,
                            scale: 1.1,
                            duration: 30
                        });
                        timeline.add({
                            targets: meteor,
                            scale: 1,
                            duration: 30
                        });
                        timeline.play();
                        meteor.data.set('health', health-1);
                    }
                }
            } catch(error) {}
        }
    });

    game.canvas.addEventListener('mousedown', function () {
        game.input.mouse.requestPointerLock();
    });

    this.input.on('pointermove', function (pointer) {
        if (this.input.mouse.locked)
        {
            crosshair.x += pointer.movementX;
            crosshair.y += pointer.movementY;
        }
    }, this);

    this.input.on('pointerdown', function () {
        if (player.visible) {
            var x1, y1, x2, y2;
            if (player.angle >= 0 && player.angle <= 180) {
                x1 = ((17/90) * player.angle) - 17;
                x2 = ((-17/90) * player.angle) + 17;
                if (player.angle >= 0 && player.angle <= 90) {
                    y1 = (-17/90) * player.angle;
                    y2 = (17/90) * player.angle;
                } else {
                    y1 = ((17/90) * player.angle) - 34;
                    y2 = ((-17/90) * player.angle) + 34;
                }
            } else {
                x1 = -(((17/90) * player.angle) + 17);
                x2 = -(((-17/90) * player.angle) - 17);
                if (player.angle <= 0 && player.angle >= -90) {
                    y1 = (-17/90) * player.angle;
                    y2 = (17/90) * player.angle;
                } else {
                    y1 = ((17/90) * player.angle) + 34;
                    y2 = ((-17/90) * player.angle) - 34;
                }
            }
            laser1 = laserPool.spawn(player.x + x1, player.y + y1, crosshair.x + x1, crosshair.y + y1, player.rotation);
            laser2 = laserPool.spawn(player.x + x2, player.y + y2, crosshair.x + x2, crosshair.y + y2, player.rotation);
        }
    }, this);

    this.anims.create({
        key: 'shield',
        frames: [ {key: 'shield0'}, {key: 'shield1'}, {key: 'shield2'} ],
        frameRate: 10,
        repeat: 10,
        hideOnComplete: true
    });
    this.anims.create({
        key: 'explosion',
        frames: [ {key: 'explosion0'}, {key: 'explosion1'}, {key: 'explosion2'}, {key: 'explosion3'}, {key: 'explosion4'}, {key: 'explosion5'}, {key: 'explosion6'}, {key: 'explosion7'}, {key: 'explosion8'} ],
        frameRate: 5,
        hideOnComplete: true
    });

    explosion.on('animationcomplete', function(anim, frame, object) {
        player.setVisible(true);
        shield.setVisible(true);
        shield.anims.play('shield');
    });
    particles.emitters.each(function (emitter) {
        if (!emitter.getAliveParticleCount()) {
            emitter.remove();
        }
    });
    this.time.addEvent({
        delay: 300,
        callback: spawnMeteor,
        loop: true
    });
}

function update() {
    if (player.visible) {
        if (cursors.left.isDown) {
            player.setVelocityX(-7);
            crosshair.setVelocityX(-7);
        } else if (cursors.right.isDown) {
            player.setVelocityX(7);
            crosshair.setVelocityX(7);
        } else if (cursors.up.isDown) {
            player.setVelocityY(-7);
            crosshair.setVelocityY(-7);
        } else if (cursors.down.isDown) {
            player.setVelocityY(7);
            crosshair.setVelocityY(7);
        } else {
            player.setVelocity(0);
            crosshair.setVelocity(0);
        }
        player.rotation = Phaser.Math.Angle.Between(player.x, player.y, crosshair.x, crosshair.y) + Phaser.Math.DegToRad(90);
        if (shield.anims.isPlaying) {
            shield.x = player.x;
            shield.y = player.y;
            shield.rotation = player.rotation;
        }
        if (player.y < chunkBounds.top.y) {
            genChunks([0, 1, 2], [6, 7, 8]);
        } else if (player.y > chunkBounds.bottom.y) {
            genChunks([6, 7, 8], [0, 1, 2]);
        } else if (player.x < chunkBounds.left.x) {
            genChunks([0, 3, 6], [2, 5, 8]);
        } else if (player.x > chunkBounds.right.x) {
            genChunks([2, 5, 8], [0, 3, 6]);
        }
    }
}

function spawnMeteor() {
    var key = Phaser.Math.RND.pick(['meteorBig0', 'meteorBig1', 'meteorBig2', 'meteorBig3', 'meteorMed0', 'meteorMed1', 'meteorSmall0', 'meteorSmall1']);
    var rand = Phaser.Math.RND.pick(['left', 'right', 'top', 'bottom']);
    var x, y;
    switch (rand) {
        case 'left':
            x = chunkBounds.top.x;
            y = Phaser.Math.Between(chunkBounds.left.y, chunkBounds.bottom.y + windowWidth);
            break;
        case 'right':
            x = chunkBounds.right.x + windowWidth;
            y = Phaser.Math.Between(chunkBounds.left.y, chunkBounds.bottom.y + windowWidth);
            break;
        case 'top':
            x = Phaser.Math.Between(chunkBounds.top.x, chunkBounds.right.x + windowHeight);
            y = chunkBounds.left.y;
            break;
        case 'bottom':
            x = Phaser.Math.Between(chunkBounds.top.x, chunkBounds.right.x + windowHeight);
            y = chunkBounds.bottom.y + windowHeight;
    }
    meteorPool.spawn(x, y, key);
    meteorPool.children.iterate(function(child) {
        if (player.x > child.x || player.y > child.y) {
            if ((player.x - child.x) > (windowWidth*2) || (player.y - child.y) > (windowHeight*2)) {
                this.despawn(child);
            }
        } 
        if (child.x > player.x || child.y > player.y) {
            if ((child.x - player.x) > (windowWidth*2) || (child.y - player.y) > (windowHeight*2)) {
                this.despawn(child);
            }
        }
    }, meteorPool);
    laserPool.children.iterate(function(child) {
        if (player.x > child.x || player.y > child.y) {
            if ((player.x - child.x) > (windowWidth*2) || (player.y - child.y) > (windowHeight*2)) {
                laserPool.despawn(child);
            }
        } 
        if (child.x > player.x || child.y > player.y) {
            if ((child.x - player.x) > (windowWidth*2) || (child.y - player.y) > (windowHeight*2)) {
                laserPool.despawn(child);
            }
        }
    }, laserPool);
}

function scoreUp(key) {
    if (key.search('Big') == 6) {
        score += 20;
    } else if (key.search('Med') == 6) {
        score += 10;
    } else {
        score += 5;
    }
    scoreText.setText("Score: " + score);
}

function genChunks(array1, array2) {
    for (var i=0;i<3;i++) {
        var sprite = chunks.getFirst('name', array2[i]);
        chunks.remove(sprite, true);
    }
    var x, y;
    for (var i=0;i<array1.length;i++) {
        if (array1[0] == 0 && array1[1] == 1 && array1[2] == 2) {
            x = chunkBounds.top.x + (i*windowWidth);
            y = chunkBounds.top.y - (windowHeight*2);
        } else if (array1[0] == 6 && array1[1] == 7 && array1[2] == 8) {
            x = chunkBounds.bottom.x + (i*windowWidth);
            y = chunkBounds.bottom.y + windowHeight;
        } else if (array1[0] == 0 && array1[1] == 3 && array1[2] == 6) {
            x = chunkBounds.left.x - (windowWidth*2);
            y = chunkBounds.left.y + (i*windowHeight);
        } else if (array1[0] == 2 && array1[1] == 5 && array1[2] == 8) {
            x = chunkBounds.right.x + windowWidth;
            y = chunkBounds.right.y + (i*windowHeight);
        }
        var sprite = game.scene.getAt(0).physics.add.image(x, y, 'background').setOrigin(0);
        chunks.addAt(sprite, array1[i]);
        UICam.ignore(sprite);
    }
    for (var i=0;i<9;i++) {
        chunks.getAt(i).name = i;
    }
    chunkBounds.top.x = chunks.getAt(3).x;
    chunkBounds.top.y = chunks.getAt(3).y;
    chunkBounds.left.x = chunks.getAt(1).x;
    chunkBounds.left.y = chunks.getAt(1).y;
    chunkBounds.right.x = chunks.getAt(2).x;
    chunkBounds.right.y = chunks.getAt(2).y;
    chunkBounds.bottom.x = chunks.getAt(6).x;
    chunkBounds.bottom.y = chunks.getAt(6).y;
}