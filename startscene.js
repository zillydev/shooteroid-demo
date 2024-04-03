class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        this.load.plugin('rexvirtualjoystickplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexvirtualjoystickplugin.min.js', true);
        this.load.image('btnPlay', 'assets/blue_button05.png');
        
    }

    create() {
        var btnPlay = new Button(this, windowWidth/2, windowHeight/2, 'btnPlay', function() {
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });
    }
}