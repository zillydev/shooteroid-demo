const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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
var player, shield, explosion;
var particles;
var cursors, spacebar;
var score = 0;
var scoreText;
var shapes;
var cat1, cat2, cat3;

const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'assets/playerShip1_orange.png');
    this.load.image('laser', 'assets/laserRed05.png');
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
    var x = 0;
    var y = -600;
    for (var i=0;i<9;i++) {
        var sprite = this.physics.add.image(-800 + (x*800), y, 'background').setOrigin(0);
        sprite.name = i;
        chunks.add(sprite);
        x++;
        if (x == 3) { x = 0; y += 600; }
    }

    chunkBounds = {
        top: {
            x: -800,
            y: 0
        },
        left: {
            x: 0,
            y: -600
        },
        right: {
            x: 800,
            y: -600
        },
        bottom: {
            x: -800,
            y: 600
        }
    }

    player = this.matter.add.image(400, 300, 'player')
        .setScale(0.5)
        .setSensor(true)
        .setCollisionCategory(cat3).setCollidesWith(cat2)
        .setVelocity(0)
        .setDataEnabled();
    this.cameras.main.startFollow(player);
    explosion = this.physics.add.sprite(0, 0, 'explosion0')
        .setScale(0.25)
        .setVisible(false);
    shield = this.physics.add.sprite(player.x, player.y, 'shield0')
        .setScale(0.5)
        .setVisible(false);
    particles = this.add.particles('meteorParticle0');
    cursors = this.input.keyboard.createCursorKeys();
    spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    scoreText = this.add.bitmapText(16, 16, 'spaceFont', "Score: " + score);
    shapes = this.cache.json.get('shapes');

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
                        destroyMeteor(meteor);
                        if (!shield.anims.isPlaying) {
                            player.setVelocity(0);
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
                    laser.destroy();
                    var health = meteor.data.get('health');
                    if (health <= 1) {
                        destroyMeteor(meteor);
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
            } catch(error) {
                //console.log("error");
            }
        }
    });

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
        player.x = 400;
        player.y = 300;
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
        delay: 400,
        callback: spawnMeteor,
        loop: true
    });
}

function update() {
    if (player.visible) {
        if (cursors.left.isDown) {
            player.setVelocityX(-7);
        } else if (cursors.right.isDown) {
            player.setVelocityX(7);
        } else if (cursors.up.isDown) {
            player.setVelocityY(-7);
        } else if (cursors.down.isDown) {
            player.setVelocityY(7);
        } else {
            player.setVelocity(0);
        }
        if (Phaser.Input.Keyboard.JustDown(spacebar)) {
            this.matter.add.image(player.x - 17, player.y, 'laser', null)
                .setSensor(true)
                .setCollisionCategory(cat1)
                .setCollidesWith(cat2)
                .setVelocityY(-20);
            this.matter.add.image(player.x + player.displayWidth - 33, player.y, 'laser', null)
                .setSensor(true)
                .setCollisionCategory(cat1)
                .setCollidesWith(cat2)
                .setVelocityY(-20);
        }
        if (shield.anims.isPlaying) {
            shield.x = player.x;
            shield.y = player.y;
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
    var meteor = game.scene.getAt(0).matter.add.sprite(Phaser.Math.Between(50, config.width - 50), -100, key, null, { shape: shapes[key]})
        .setSensor(true)
        .setCollisionCategory(cat2)
        .setCollidesWith([cat1, cat3])
        .setDataEnabled()
        .setVelocityX(Phaser.Math.FloatBetween(-1, 1));
    if (key.search('Big') == 6) {
        meteor.data.set('health', 6);
        meteor.setVelocityY(Phaser.Math.Between(2, 3));
    } else if (key.search('Med') == 6) {
        meteor.data.set('health', 2);
        meteor.setVelocityY(Phaser.Math.Between(3, 4));
    } else {
        meteor.data.set('health', 1);
        meteor.setVelocityY(Phaser.Math.Between(5, 6));
    }
    meteor.setAngularVelocity(Phaser.Math.FloatBetween(Phaser.Math.DegToRad(-0.1), Phaser.Math.DegToRad(0.1)));
}

function destroyMeteor(meteor) {
    key = meteor.texture.key;
    if (key.search('Big') == 6) {
        score += 20;
    } else if (key.search('Med') == 6) {
        score += 10;
    } else {
        score += 5;
    }
    scoreText.setText("Score: " + score);
    particles.setTexture('meteorParticle' + Phaser.Math.Between(0, 1));
    var emitter = particles.createEmitter({
        speed: 100,
        scale: { start: 2, end: 0 },
        lifespan: 500,
        on: false
    });
    emitter.emitParticle(20, meteor.x + meteor.width/2, meteor.y + meteor.height/2);
    meteor.destroy();
}

function genChunks(array1, array2) {
    for (var i=0;i<3;i++) {
        var sprite = chunks.getFirst('name', array2[i]);
        chunks.remove(sprite, true);
    }
    var x, y;
    for (var i=0;i<array1.length;i++) {
        if (array1[0] == 0 && array1[1] == 1 && array1[2] == 2) {
            x = chunkBounds.top.x + (i*800);
            y = chunkBounds.top.y - 1200;
        } else if (array1[0] == 6 && array1[1] == 7 && array1[2] == 8) {
            x = chunkBounds.bottom.x + (i*800);
            y = chunkBounds.bottom.y + 600;
        } else if (array1[0] == 0 && array1[1] == 3 && array1[2] == 6) {
            x = chunkBounds.left.x - 1600;
            y = chunkBounds.left.y + (i*600);
        } else if (array1[0] == 2 && array1[1] == 5 && array1[2] == 8) {
            x = chunkBounds.right.x + 800;
            y = chunkBounds.right.y + (i*600);
        }
        var sprite = game.scene.getAt(0).physics.add.sprite(x, y, 'background').setOrigin(0);
        chunks.addAt(sprite, array1[i]);
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