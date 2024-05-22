class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_characters", "platformer_characters.png", "tilemap-characters-packed.json");

        // Load tilemap information
        this.load.image("platformer_main", "platformer_main.png");
        this.load.image("platformer_food", "platformer_food.png");
        this.load.image("platformer_farm", "platformer_farm.png");
        this.load.image("platformer_industrial", "platformer_industrial.png");
        this.load.image("darkness", "dark_packed.png")
        this.load.tilemapTiledJSON("platformer-map", "platformer-map.tmj");   // Tilemap in JSON

        // objects
        this.load.spritesheet("food_spritesheet", "platformer_food.png", {
            frameWidth: 18,
            frameHeight: 18
        });

        // distortion fx
        this.load.image('distort', 'distortionmessy.png');
        this.load.image('distort2', 'noisesmall.png');
        this.load.image('distort3', 'distortioncircle.png');

        // walking sounds
        this.load.audio("walk_cloud_sound", "walking_clouds.ogg");
        this.load.audio("walk_concrete_sound", "walking_concrete.ogg");
        this.load.audio("walk_grass_sound", "walking_grass.ogg");
        this.load.audio("walk_greenhouse_sound", "walking_greenhouse.ogg");
        this.load.audio("walk_metal_sound", "walking_metal.ogg");
        this.load.audio("walk_snow_sound", "walking_snow.ogg");

        // DRANK sound
        this.load.audio("drinking_sound", "dranking.mp3");

        // particles
        this.load.multiatlas("kenny-particles", "kenny-particles.json");
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('platformer_characters', {
                prefix: "tile_",
                start: 6,
                end: 7,
                suffix: ".png",
                zeroPad: 4
            }), // start and end is from the tile_0006 and 0007 bits, zeroPad makes sure the 0's and # are four long
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0006.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "platformer_characters",
            frames: [
                { frame: "tile_0007.png" }
            ],
        });

         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}