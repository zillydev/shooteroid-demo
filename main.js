var windowWidth = 800;
var windowHeight = 600;
var scaleFactorX = windowWidth / 800;
var scaleFactorY = windowHeight / 600;
const ninetyDeg = Math.PI/2;
const angleCalcVal = 17/90;

const config = {
    type: Phaser.AUTO,
    scale: {
        //mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,
        width: windowWidth,
        height: windowHeight
    },
    physics: {
        arcade: {debug: true},
        matter: {
            gravity: false,
            setBounds: false,
            debug: true
        }
    },
    scene: [StartScene, GameScene, UIScene, GameOverScene]
};

var chunks, chunkBounds, chunkFarBounds;
var player, shield, explosion, explosion2, crosshair;
var meteorPool, laserPool, laserPool1, laserPool2, enemyPool;
var particles;
var cursors, spacebar;
var score = 0;
var joyStick1, joyStick2;
var shapes, enemyShapes;
//cat1 = laser1, cat2 = meteor, cat3 = player, cat4 = enemy, cat5 = laser2
var cat1, cat2, cat3, cat4, cat5;
var currTime;
var isDeviceMobile = false;
if (typeof window.orientation !== 'undefined') {
    isDeviceMobile = true;
}

const game = new Phaser.Game(config);
