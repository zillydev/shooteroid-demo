class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    preload() {
        this.load.image('btnPlay', 'assets/blue_button05.png');
    }

    create() {
        var playAgain = new Button(this, windowWidth/2, windowHeight/2 + 100, 'btnPlay', function() {
            score = 0;
            game.events.removeAllListeners();
            this.scene.start('GameScene');
        });
    }

    update() {

    }
}