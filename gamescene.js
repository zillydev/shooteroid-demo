class Enemy extends Phaser.Physics.Matter.Image {
    constructor(scene, x, y, key, pos) {
        super(scene.matter.world, x, y, key, null, {
            shape: enemyShapes.key,
            isSensor: true,
            frictionAir: 0
        });
        this.setScale(0.75);
        this.setDataEnabled();
        this.setCollisionCategory(cat4);
        this.setCollidesWith([cat1, cat2, cat3]);
        scene.add.existing(this);
        this.world.add(this.body);
        this.data.set('health', 6);
        this.velX = 0;
        this.velY = 0;
        this.pos = pos;
        this.lastFired = 0;
        this.screened = false;
        this.isFiring = true;
        this.fired = 0;
        this.dead = false;
        this.fireEvent = scene.time.addEvent({
            delay: 2000,
            loop: true,
            callback: function() { this.isFiring = true; },
            callbackScope: this,
            paused: true
        });

        this.screen;
        this.move;
        switch(this.pos) {
            case 'top':
                this.screen = function() {
                    if (this.y - player.y < -600) {
                        this.velY += 0.05;
                    }
                }
                this.move = function() {
                    if (player.velY > 0) {
                        this.velY = 3.5;
                    } else if (player.velY < 0) {
                        this.velY = -3.5;
                    }
                }
                break;
            case 'bottom':
                this.screen = function() {
                    if (this.y - player.y > 600) {
                        this.velY += -0.05;
                    }
                }
                this.move = function() {
                    if (player.velY > 0) {
                        this.velY = 3.5;
                    } else if (player.velY < 0) {
                        this.velY = -3.5;
                    }
                }
                break;
            case 'left':
                this.screen = function() {
                    if (this.x - player.x < -600) {
                        this.velX += 0.05;
                    }
                }
                this.move = function() {
                    if (player.velX > 0) {
                        this.velX = 3.5;
                    } else if (player.velX < 0) {
                        this.velX = -3.5;
                    }
                }
                break;
            case 'right':
                this.screen = function() {
                    if (this.x - player.x > 600) {
                        this.velX += -0.05;
                    }
                }
                this.move = function() {
                    if (player.velX > 0) {
                        this.velX = 3.5;
                    } else if (player.velX < 0) {
                        this.velX = -3.5;
                    }
                }
                break;
        }
    }

    update(object) {
        if (this.screened) {
            /* if (this.y - player.y > 500) {
                this.velY = -3.5;
            } 
            else if (this.y - player.y < -500) {
                this.velY = 3.5;
            } 
            if (this.x - player.x > 500) {
                this.velX = -3.5;
            }
            else if (this.x - player.x < -500) {
                this.velX = 3.5;
            } */
            this.move();
            if (player.velY == 0) {
                this.velY = 0;
            }
            if (player.velX == 0) {
                this.velX = 0;
            }
            if (this.isFiring) {
                if (object.spawnLasers(this, false)) {
                    this.fired++;
                }
                if (this.fired > 3) {
                    this.fired = 0;
                    this.isFiring = false;
                }
            }
        } else {
            this.screen();
            if (((this.y - player.y < 500 && this.y - player.y > 400) || (this.y - player.y > -500 && this.y - player.y < -400)) && (this.pos.includes('top') || this.pos.includes('bottom'))) {
                this.velY = 0;
                this.screened = true;
                this.fireEvent.paused = false;
                console.log("screened Y");
            } else if (((this.x - player.x < 700 && this.x - player.x > 600) || (this.x - player.x > -700 && this.x - player.x < -600)) && (this.pos.includes('left') || this.pos.includes('right'))) {
                this.velX = 0;
                this.screened = true;
                this.fireEvent.paused = false;
                console.log("screened X")
            }
        }
        this.setVelocity(this.velX, this.velY);
        this.rotation = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y) + ninetyDeg;
    }
}

class EnemyPool extends Phaser.GameObjects.Group {
    constructor(scene, config={}) {
        const defaults = {
            maxSize: -1
        }
        super(scene, Object.assign(defaults, config));
    }

    spawn(x, y, key, pos) {
        const spawnExisting = this.countActive(false) > 0;
        var enemy;
        if (spawnExisting) {
            enemy = this.getFirstDead(false, x, y);
            enemy.setActive(true);
            enemy.setVisible(true);
            enemy.world.add(enemy.body);
            enemy.fireEvent.paused = false;
        } else {
            enemy = new Enemy(this.scene, x, y, key, pos);
            this.add(enemy, true);
        }
        enemy.dead = false;
        return enemy;
    }

    despawn(enemy) {
        enemy.data.set('health', 6);
        enemy.setActive(false);
        enemy.setVisible(false);
        enemy.world.remove(enemy.body);
    }
}

class Meteor extends Phaser.Physics.Matter.Image {
    constructor(scene, x, y, key) {
        super(scene.matter.world, x, y, key, null, {
            shape: shapes.key,
            isSensor: true,
            frictionAir: 0
        });
        this.setDataEnabled();
        this.setCollisionCategory(cat2);
        this.setCollidesWith([cat1, cat3, cat4, cat5]);
        this.updateVel();
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
        this.direction = Math.atan(Phaser.Math.Between(chunkBounds.top.x, chunkBounds.right.x + windowWidth)/Phaser.Math.Between(chunkBounds.left.y, chunkBounds.bottom.y + windowHeight));
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

class LaserProt extends Phaser.Physics.Matter.Image {
    constructor(scene, x, y, rotation) {
        super(scene.matter.world, x, y, 'laser', null, {
            isSensor: true,
            frictionAir: 0
        });
        this.speed = -20;
        this.setDataEnabled();
        this.updateVel(rotation);
    }

    updateVel(rotation) {
        this.setVelocityX(this.speed*Math.cos(rotation + ninetyDeg));
        this.setVelocityY(this.speed*Math.sin(rotation + ninetyDeg));
        this.rotation = rotation;
    }
}

class Laser1 extends LaserProt {
    constructor(scene, x, y, rotation) {
        super(scene, x, y, rotation);
        this.setCollisionCategory(cat1);
        this.setCollidesWith([cat2, cat4]);
        this.data.set('name', 'laser1');
    }
}

class Laser2 extends LaserProt {
    constructor(scene, x, y, rotation) {
        super(scene, x, y, rotation);
        this.setCollisionCategory(cat5);
        this.setCollidesWith([cat2, cat3]);
        this.data.set('name', 'laser2');
    }
}

class LaserPool extends Phaser.GameObjects.Group {
    constructor(scene, config = {}) {
        const defaults = {
            maxSize: -1
        }
        super(scene, Object.assign(defaults, config));
    }

    despawn(laser) {
        laser.setActive(false);
        laser.setVisible(false);
        laser.world.remove(laser.body);
    }
}

class LaserPool1 extends LaserPool {
    constructor(scene, config = {}) {
        super(scene, config);
    }

    spawn(x, y, rotation) {
        const spawnExisting = this.countActive(false) > 0;
        var laser;
        if (spawnExisting) {
            laser = this.getFirstDead(false, x, y);
            laser.setActive(true);
            laser.setVisible(true);
            laser.updateVel(rotation);
            laser.world.add(laser.body);
        } else {
            laser = new Laser1(this.scene, x, y, rotation);
            this.add(laser, true);
            laserPool.add(laser, true);
        }
    }
}

class LaserPool2 extends LaserPool {
    constructor(scene, config = {}) {
        super(scene, config);
    }

    spawn(x, y, rotation) {
        const spawnExisting = this.countActive(false) > 0;
        var laser;
        if (spawnExisting) {
            laser = this.getFirstDead(false, x, y);
            laser.setActive(true);
            laser.setVisible(true);
            laser.updateVel(rotation);
            laser.world.add(laser.body);
        } else {
            laser = new Laser2(this.scene, x, y, rotation);
            this.add(laser, true);
            laserPool.add(laser, true);
        }
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
        this.setCollidesWith([cat2, cat4, cat5]);
        this.health = 3;
        this.lastFired = 0;
        this.velX = 0;
        this.velY = 0;
    }
    update() {
        this.setVelocity(this.velX, this.velY);
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'GameScene',
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
        });
    }

    preload() {
        //this.scene.launch('UIScene');
        this.load.bitmapFont('spaceFont', 'assets/kenvector_future_0.png', 'assets/kenvector_future.xml');
        this.load.image('player', 'assets/playerShip1_orange.png');
        this.load.image('laser', 'assets/laserRed05.png');
        this.load.image('crosshair', 'assets/crosshair.png');
        this.load.image('background', 'assets/background2.png');
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
            if (i<=5 && i!=0) {
                this.load.image('enemyBlack'+i, 'assets/enemyBlack'+i+'.png');
                this.load.image('enemyBlue'+i, 'assets/enemyBlue'+i+'.png');
                this.load.image('enemyGreen'+i, 'assets/enemyGreen'+i+'.png');
                this.load.image('enemyRed'+i, 'assets/enemyRed'+i+'.png');
            }
            this.load.image('explosion'+i, 'assets/explosion0'+i+'.png');
        }
        this.load.json('shapes', 'assets/shapes.json');
        this.load.json('enemyShapes', 'assets/enemyShapes.json');
    }

    create() {
        cat1 = this.matter.world.nextCategory();
        cat2 = this.matter.world.nextCategory();
        cat3 = this.matter.world.nextCategory();
        cat4 = this.matter.world.nextCategory();
        cat5 = this.matter.world.nextCategory();

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

        chunkFarBounds = {
            top: {
                x: chunkBounds.top.x-windowWidth,
                y: chunkBounds.left.y-windowHeight
            },
            left: {
                x: chunkBounds.top.x-windowWidth,
                y: chunkBounds.left.y-windowHeight
            },
            right: {
                x: chunkBounds.right.x+(2*windowWidth),
                y: chunkBounds.right.y-windowHeight
            },
            bottom: {
                x: chunkBounds.bottom.x-windowWidth,
                y: chunkBounds.bottom.y+(2*windowHeight)
            }
        }

        function toggleFullscreen() {
            let elem = document.documentElement;
            if (!document.fullscreenElement) {
                if (elem.requestFullscreen) {
                    elem.requestFullscreen();
                } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen();
                }

                game.events.emit('smaller');
                screen.orientation.lock('landscape')
                    .then(function() {
                        console.log("locked");
                    })
                    .catch(function(error) {
                        console.log(error);
                    });
            } else {
                document.exitFullscreen();
                game.events.emit('larger');
            }
        }
        game.events.on('fullscreen', function() {
            toggleFullscreen();
        });

        window.addEventListener('resize', function () {
            game.scale.resize(window.innerWidth, window.innerHeight);
        }, false);
        this.scale.on('resize', function(gameSize) {
            windowWidth = gameSize.width;
            windowHeight = gameSize.height;
            scaleFactorX = gameSize.width / 800;
            scaleFactorY = gameSize.height / 600;
            game.events.emit('resize', gameSize, scaleFactorX, scaleFactorY);
        }, this);
        game.canvas.addEventListener('mousedown', function () {
            game.input.mouse.requestPointerLock();
        });

        player = new Player(this, windowWidth/2, windowHeight/2);
        this.cameras.main.startFollow(player, false, 0.5, 0.5);
        this.cameras.main.zoom = 0.4;

        if (!isDeviceMobile) {
            crosshair = this.matter.add.image(200, 50, 'crosshair');
            crosshair.setScale(scaleFactorX, scaleFactorY);
        } else {
            crosshair = this.matter.add.image(0, 0);
        }

        explosion = this.physics.add.sprite(0, 0, 'explosion0')
            .setScale(0.25, 0.25)
            .setVisible(false);
        shield = this.physics.add.sprite(player.x, player.y, 'shield0')
            .setScale(0.5)
            .setVisible(false);
        meteorPool = new MeteorPool(this);
        laserPool = new LaserPool(this);
        laserPool1 = new LaserPool1(this);
        laserPool2 = new LaserPool2(this);
        enemyPool = new EnemyPool(this);
        particles = this.add.particles('meteorParticle0');
        cursors = this.input.keyboard.createCursorKeys();
        spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        shapes = this.cache.json.get('shapes');
        enemyShapes = this.cache.json.get('enemyShapes');

        this.matter.world.on('collisionstart', function (event) {
            var player, laser, meteor, enemy, key1, key2;
            var pairs = event.pairs.slice();
            for (var i=0;i<pairs.length;i++) {
                try {
                    key1 = pairs[i].bodyA.gameObject.texture.key;
                    key2 = pairs[i].bodyB.gameObject.texture.key;
                    if (key1.includes('enemy') || key2.includes('enemy')) { 
                        if ((key1.includes('enemy') || key2.includes('enemy')) && (key1.includes('meteor') || key2.includes('meteor'))) {
                            if (key1.includes('enemy') && key2.includes('meteor')) {
                                enemy = pairs[i].bodyA.gameObject;
                                meteor = pairs[i].bodyB.gameObject;
                            } else if (key1.includes('meteor') && key2.includes('enemy')) {
                                enemy = pairs[i].bodyB.gameObject;
                                meteor = pairs[i].bodyA.gameObject;
                            }
                            meteor.emitParticles();
                            meteorPool.despawn(meteor);
                        } else if ((key1.includes('enemy') || key2.includes('enemy')) && (key1 == 'laser' || key2 == 'laser')) {
                            if (key1.includes('enemy') && key2 == 'laser') {
                                enemy = pairs[i].bodyA.gameObject;
                                laser = pairs[i].bodyB.gameObject;
                            } else if (key1 == 'laser' && key2.includes('enemy')) {
                                enemy = pairs[i].bodyB.gameObject;
                                laser = pairs[i].bodyA.gameObject;
                            }
                            laserPool.despawn(laser);
                            enemy.data.set('health', enemy.data.get('health')-1);
                            if (enemy.data.get('health') == 0 && enemy.dead == false) {
                                this.addScore('enemy');
                                enemyPool.despawn(enemy);
                                enemy.dead = true;
                                enemy.fireEvent.paused = true;
                                enemy.isFiring = false;
                                var explosion2 = this.physics.add.sprite(0, 0, 'explosion0')
                                    .setScale(0.25, 0.25)
                                    .setPosition(enemy.x, enemy.y)
                                    .anims.play('explosion')
                                    .on('animationcomplete', function() {
                                        explosion2.destroy();
                                    });
                                enemy.destroy();
                                game.events.emit('wavebarAnimate', this.waveProgress);
                            }
                        }
                    } else if (key1 == 'player' || key2 == 'player') {
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
                                player.velX = 0;
                                player.velY = 0;
                                crosshair.setVelocity(0);
                                player.setVisible(false);
                                player.health--;
                                explosion.x = player.x;
                                explosion.y = player.y;
                                explosion.setVisible(true);
                                explosion.anims.play('explosion');
                                game.events.emit('reduceHealth');
                                if (player.health <= 0) {
                                    this.cameras.main.setAlpha(0.5);
                                    //this.scene.pause();
                                    //this.scene.pause('UIScene');
                                    this.scene.launch('GameOverScene');
                                }
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
                            if (laser.data.get('name') == 'laser1') {
                                this.addScore(meteor.texture.key);
                            }
                        } else {
                            var timeline = this.tweens.timeline();
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
        }, this);

        if (!game.events.on('move', function(angle) {
            if (player.visible) {
                player.setVelocityX(Math.sin(((angle+90)*Math.PI)/180) * 7);
                player.setVelocityY(Math.sin(((angle-180)*Math.PI)/180) * -7);
            }
        }, this)) {
            player.setVelocity(0);
        }
        game.events.on('rotate', function(angle) {
            if (angle) {
                player.angle = angle+90;
            }
        });
        game.events.on('shoot', function() {
            if (player.visible) {
                this.spawnLasers(player, true);
            }
        }, this);

        if (!isDeviceMobile) {
            /* this.input.on('pointerdown', function (pointer) {
                if (player.visible) {
                    this.spawnLasers();
                }
            }, this); */
            this.input.on('pointermove', function (pointer) {
                if (this.input.mouse.locked) {
                    crosshair.x += pointer.movementX;
                    crosshair.y += pointer.movementY;
                }
            }, this);
        }

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

        explosion.on('animationcomplete', function() {
            player.setVisible(true);
            shield.setVisible(true);
            shield.anims.play('shield');
        });
        particles.emitters.each(function (emitter) {
            if (!emitter.getAliveParticleCount()) {
                emitter.remove();
            }
        });
        this.waveCount = 1;
        this.waveProgress = 100;
        this.meteorWaveProgress = 80;
        this.enemyWaveProgress = 20;
        this.maxWaveProgress = 100;
        //this.scoreThreshold = 300;
        this.meteorSpawner = this.time.addEvent({
            delay: 300,
            callback: this.spawnMeteor,
            loop: true,
            paused: true
        });

        game.events.on('startMeteors', function() {
            this.meteorSpawner.paused = false;
        }, this);
        this.time.addEvent({
            delay: 1000,
            callback: function() { this.spawnEnemy(); },
            callbackScope: this,
            repeat: 0
        });
        
    }

    update(time) {
        if (player.visible) {
            currTime = time;
            if (cursors.left.isDown) {
                player.velX = -7;
                crosshair.setVelocityX(-7);
            } else if (cursors.right.isDown) {
                player.velX = 7;
                crosshair.setVelocityX(7);
            } else if (cursors.up.isDown) {
                player.velY = -7;
                crosshair.setVelocityY(-7);
            } else if (cursors.down.isDown) {
                player.velY = 7;
                crosshair.setVelocityY(7);
            } else {
                player.velX = 0;
                player.velY = 0;
                crosshair.setVelocity(0);
            }
            player.setVelocity(player.velX, player.velY);
            if (this.input.activePointer.isDown) {
                // enemyPool.children.iterate(function(child) {
                //     console.log(child.y - player.y);
                // });
                //console.log(player.velY);
                this.spawnLasers(player, true);
            }
            if (!isDeviceMobile) {
                player.rotation = Phaser.Math.Angle.Between(player.x, player.y, crosshair.x, crosshair.y) + ninetyDeg;
            }
            if (shield.anims.isPlaying) {
                shield.x = player.x;
                shield.y = player.y;
                shield.rotation = player.rotation;
            }
            if (player.y < chunkBounds.top.y) {
                this.genChunks([0, 1, 2], [6, 7, 8]);
            } else if (player.y > chunkBounds.bottom.y) {
                this.genChunks([6, 7, 8], [0, 1, 2]);
            } else if (player.x < chunkBounds.left.x) {
                this.genChunks([0, 3, 6], [2, 5, 8]);
            } else if (player.x > chunkBounds.right.x) {
                this.genChunks([2, 5, 8], [0, 3, 6]);
            }
        }
        enemyPool.children.iterate(function(child) {
            if (!child.dead) {
                child.update(this);
            }
        }, this);
    }

    spawnEnemy() {
        var keyValues = [];
        for (var i=1;i<=5;i++) {
            keyValues.push('enemyBlack'+i);
            keyValues.push('enemyBlue'+i);
            keyValues.push('enemyGreen'+i);
            keyValues.push('enemyRed'+i);
        }
        var key = Phaser.Math.RND.pick(keyValues);
        var rand = Phaser.Math.RND.pick(['top', 'bottom', 'left', 'right']);
        //var rand = 'bottom';
        var x, y;
        switch (rand) {
            case 'left':
                x = chunkBounds.top.x;
                y = Phaser.Math.Between(chunkBounds.top.y, chunkBounds.bottom.y);
                break;
            case 'right':
                x = chunkBounds.right.x + windowWidth;
                y = Phaser.Math.Between(chunkBounds.top.y, chunkBounds.bottom.y);
                break;
            case 'top':
                x = Phaser.Math.Between(chunkBounds.left.x, chunkBounds.right.x);
                y = chunkBounds.left.y;
                break;
            case 'bottom':
                x = Phaser.Math.Between(chunkBounds.left.x, chunkBounds.right.x);
                y = chunkBounds.bottom.y + windowHeight;
                break;
        }
        enemyPool.spawn(x, y, key, rand);
    }

    spawnMeteor() {
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

    spawnLasers(object, isPlayer) {
        if ((currTime - object.lastFired) > 150) {
            object.lastFired = currTime;
            let x1, y1, x2, y2;
            if (object.angle >= 0 && object.angle <= 180) {
                x1 = (angleCalcVal * object.angle) - 17;
                x2 = (-angleCalcVal * object.angle) + 17;
                if (object.angle >= 0 && object.angle <= 90) {
                    y1 = -angleCalcVal * object.angle;
                    y2 = angleCalcVal * object.angle;
                } else {
                    y1 = (angleCalcVal * object.angle) - 34;
                    y2 = (-angleCalcVal * object.angle) + 34;
                }
            } else {
                x1 = -((angleCalcVal * object.angle) + 17);
                x2 = -((-angleCalcVal * object.angle) - 17);
                if (object.angle <= 0 && object.angle >= -90) {
                    y1 = -angleCalcVal * object.angle;
                    y2 = angleCalcVal * object.angle;
                } else {
                    y1 = (angleCalcVal * object.angle) + 34;
                    y2 = (-angleCalcVal * object.angle) - 34;
                }
            }
            if (isPlayer) {
                laserPool1.spawn(object.x + x1, object.y + y1, object.rotation);
                laserPool1.spawn(object.x + x2, object.y + y2, object.rotation);
            } else {
                laserPool2.spawn(object.x + x1, object.y + y1, object.rotation);
                laserPool2.spawn(object.x + x2, object.y + y2, object.rotation);
            }
            return true;
        }
    }

    addScore(key) {
        var reduceWaveProgress = 0;
        if (key.search('Big') == 6) {
            score += 20;
            reduceWaveProgress = 10;
        } else if (key.search('Med') == 6) {
            score += 10;
            reduceWaveProgress = 5;
        } else if (key.search('Small') == 6) {
            score += 5;
            reduceWaveProgress = 3;
        } else {
            score += 50;
            this.waveProgress -= 20/this.waveCount;
        }
        game.events.emit('addScore', score);
        // if (this.waveScore >= this.scoreThreshold) {
        //     console.log(this.waveScore + " " + this.scoreThreshold);
        //     this.waveScore = 0;
        //     this.meteorSpawner.paused = true;
        //     this.waveCount++;
        //     this.scoreThreshold += 50 * this.waveCount;
        //     game.events.emit('startWave', this.waveCount);
        // }
        if (this.meteorWaveProgress > 0 && reduceWaveProgress != 0) {
            this.waveProgress -= reduceWaveProgress/(this.maxWaveProgress/100);
            this.meteorWaveProgress -= reduceWaveProgress/(this.maxWaveProgress/100);
        }
        if(this.waveProgress <= 0) {
            this.waveCount++;
            this.waveProgress = 100;
            this.meteorWaveProgress = 80;
            this.maxWaveProgress = 100 * this.waveCount;
            this.time.addEvent({
                delay: 7000,
                repeat: this.waveCount-1,
                callback: function() { this.spawnEnemy(); },
                callbackScope: this
            });
            game.events.emit('waveStart', this.waveCount);
        }
        game.events.emit('wavebarAnimate', this.waveProgress);
    }

    genChunks(array1, array2) {
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
            //var sprite = game.scene.getScene('GameScene').physics.add.image(x, y, 'background').setOrigin(0);
            chunks.addAt(game.scene.getScene('GameScene').physics.add.image(x, y, 'background').setOrigin(0), 
                array1[i]);
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

}
