class Button extends Phaser.GameObjects.Image {
    constructor(scene, x, y, key, onclick) {
        super(scene, x, y, key);
        scene.add.existing(this);
        this.setInteractive();
        this.on('pointerup', onclick, scene);
    }
}

class WaveBar {
    constructor(scene) {
        this.scene = scene;
        const x = windowWidth/2 - 106;
        const y = windowHeight-25;
        const leftShadow = scene.add.image(x, y, 'barShadowLeft').setOrigin(0, 0.5);
        const midShadow = scene.add.image(leftShadow.x + leftShadow.width, y, 'barShadowMid').setOrigin(0, 0.5);
        midShadow.displayWidth = 200;
        scene.add.image(midShadow.x + midShadow.displayWidth, y, 'barShadowRight').setOrigin(0, 0.5);

        this.left = scene.add.image(x, y, 'barLeft').setOrigin(0, 0.5);
        this.mid = scene.add.image(this.left.x + this.left.width, y, 'barMid').setOrigin(0, 0.5);
        this.mid.displayWidth = 200;
        this.right = scene.add.image(this.mid.x + this.mid.displayWidth, y, 'barRight').setOrigin(0, 0.5);
    }

    animate(percent, duration=1000) {
        const width = 200 * (percent/100);
        this.scene.tweens.add({
            targets: this.mid,
            displayWidth: width,
            duration: duration,
            ease: Phaser.Math.Easing.Sine.Out,
            onUpdate: () => {
                this.right.x = this.mid.x + this.mid.displayWidth
            }
        })
    }
}

class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    preload() {
        //this.scene.launch('GameScene');
        this.load.image('larger', 'assets/larger.png');
        this.load.image('smaller', 'assets/smaller.png');
        this.load.image('health', 'assets/playerLife1_orange.png');
        this.load.image('barLeft', 'assets/bar_left.png');
        this.load.image('barMid', 'assets/bar_mid.png');
        this.load.image('barRight', 'assets/bar_right.png');
        this.load.image('barShadowLeft', 'assets/bar_shadow_left.png');
        this.load.image('barShadowMid', 'assets/bar_shadow_mid.png');
        this.load.image('barShadowRight', 'assets/bar_shadow_right.png');
    }

    create() {
        var scoreText = this.add.bitmapText(16, 16, 'spaceFont', "Score: 0");
        this.waveText = this.add.bitmapText(windowWidth/2, windowHeight/2, 'spaceFont', "Wave 1")
            .setAlpha(0).setOrigin(0.5);
        var btnFullscreen = new Button(this, windowWidth - 50, 50, 'larger', function() {
            game.events.emit('fullscreen');
        });
        this.wavebar = new WaveBar(this);

        var healthGroup = this.add.group();
        for (var i=0;i<3;i++) {
            var health = this.add.image(windowWidth - 125 + (i*50), 34, 'health');
            health.setName(i);
            healthGroup.add(health);
        }

        if (isDeviceMobile) {
            this.input.addPointer();
            joyStick1 = this.plugins.get('rexvirtualjoystickplugin').add(this, {
                x: 200,
                y: windowHeight - 150,
                radius: 50,
                forceMin: 7
            });

            joyStick2 = this.plugins.get('rexvirtualjoystickplugin').add(this, {
                x: windowWidth - 200,
                y: windowHeight - 150,
                radius: 50
            });
            joyStick2.on('update', function() {
                game.events.emit('rotate', joyStick2.angle);
            }, this);

            game.events.on('resize', function(gameSize) {
                joyStick1.setPosition(200, gameSize.height - 150)//.setScale(scaleFactorX, scaleFactorY);
                joyStick2.setPosition(gameSize.width - 200, gameSize.height - 150)//.setScale(scaleFactorX, scaleFactorY);
                scoreText.setScale(scaleFactorX, scaleFactorY);
            }, this);
        }

        game.events.on('addScore', function(score) {
            scoreText.setText("Score: " + score);
        }, this);

        game.events.on('reduceHealth', function() {
            healthGroup.getFirstAlive().destroy();
        }, this);

        game.events.on('larger', function() {
            btnFullscreen.setTexture('larger');
        });

        game.events.on('smaller', function() {
            btnFullscreen.setTexture('smaller');
        });

        game.events.on('resize', function(gameSize, scaleFactorX, scaleFactorY) {
            btnFullscreen.setPosition(gameSize.width - 35, 30).setScale(scaleFactorX, scaleFactorY);
            healthGroup.children.iterate(function(child) {
                child.setPosition(windowWidth - 125 + (child.name*50), 34);
            })
        }, this);

        game.events.on('waveStart', function(waveCount) {
            this.waveText.setText("Wave " + waveCount);
            this.tweens.timeline()
                .add({
                    targets: this.waveText,
                    alpha: 1,
                    scale: 1.5,
                    duration: 1000
                }).add({
                    targets: this.waveText,
                    alpha: 0,
                    scale: 2,
                    duration: 1000,
                    onComplete: this.startWave,
                    onCompleteScope: this
                }).play();
        }, this);
        game.events.emit('waveStart', 1);

        game.events.on('wavebarAnimate', function(percentage) {
            this.wavebar.animate(percentage);
        }, this);
    }

    update() {
        if (isDeviceMobile) {
            if (joyStick1.force >= 7) {
                game.events.emit('move', joyStick1.angle);
            }
            if (joyStick2.force >= 60) {
                game.events.emit('shoot');
            }
        }
    }

    startWave() {
        this.waveText.setScale(1);
        game.events.emit('startMeteors');
    }
}
