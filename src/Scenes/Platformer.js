class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 500;
        this.DRAG = 2000;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1300;
        this.JUMP_VELOCITY = -500;

        this.DRANKS = 0;
        this.totalDRANKS = 4;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles
        this.map = this.add.tilemap("platformer-map", 18, 18, 180, 70);
        this.physics.world.setBounds(0, 0, 3240, 1860); // cause fuck the camera

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tilemap_main = this.map.addTilesetImage("platformer_main", "platformer_main");
        this.tilemap_food = this.map.addTilesetImage("platformer_food", "platformer_food");
        this.tilemap_farm = this.map.addTilesetImage("platformer_farm", "platformer_farm");
        this.tilemap_industrial = this.map.addTilesetImage("platformer_industrial", "platformer_industrial");
        this.allTilesets = [this.tilemap_main, this.tilemap_food, this.tilemap_farm, this.tilemap_industrial];

        // Create a layer
        this.backgroundLayer = this.map.createLayer("background", this.allTilesets, 0, 0);
        this.groundLayer = this.map.createLayer("ground", this.allTilesets, 0, 0);
        this.greenhouseLayer = this.map.createLayer("greenhouse-hide", this.allTilesets, 0, 0);
        this.itemLayer = this.map.createLayer("items", this.allTilesets, 0, 0);

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(10, 10, "platformer_characters", "tile_0006.png");
        my.sprite.player.setCollideWorldBounds(true);

        // to make platform tiles jump through
        this.groundLayer.forEachTile(tile => {
            if (tile.properties["platform"]) {
              tile.setCollision(false, false, true, false);
            }
         });
        //this.greenhouseLayer.setAlpha(0);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // camera stuff
        this.cam = this.cameras.main;
        this.cam.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cam.setViewport(0, 0, 1000, 600);
        this.cameras.main.startFollow(my.sprite.player, true, .25, .25);

        this.fx = my.sprite.player.preFX.addDisplacement('distort', -0.2, -0.2);
        this.tweens.add({
            targets: this.fx,
            x: 0.2,
            y: 0.2,
            yoyo: true,
            loop: -1,
            duration: 2000,
            ease: 'sine.inout'
        });
        //this.fx.setVisible(false);

        // DRINK
        this.drinks = this.map.createFromObjects("items", {
            name: "DRINK",
            key: "farm_spritesheet",
            frame: 82
        });
        this.physics.world.enable(this.drinks, Phaser.Physics.Arcade.STATIC_BODY);
        this.drinksGroup = this.add.group(this.drinks);
        this.physics.add.overlap(my.sprite.player, this.drinksGroup, (obj1, obj2) => {
            obj2.destroy(); // remove drink on overlap
            this.DRANKS += 1;
            // TODO: DRANK EFFECTS
            //this.fx.setVisible(true);
        });

        // HIDDEN
        this.hiddenChecks = this.map.createFromObjects("items", {
            name: "HIDDENCHECK",
            key: "farm_spritesheet",
            frame: 103
        });

        my.sprite.player.on("overlapstart", () => {
            console.log("overlapstart");
            if (this.greenhouseLayer.tilemap.properties["hidden"] == false) {
                this.greenhouseLayer.tilemap.properties["hidden"] = true;
                this.greenhouseLayer.setAlpha(0);
                console.log("hiding layer");
            }
            else {
                this.greenhouseLayer.tilemap.properties["hidden"] = false;
                this.greenhouseLayer.setAlpha(1);
                console.log("revealing layer");
            }
        });
        this.hiddenChecks.forEach(tile => {
            tile.setVisible(false);
            this.physics.add.overlap(my.sprite.player, tile);
        });


        // this.hiddenChecks = this.physics.add.staticGroup({
        //     key: 'farm_spritesheet',
        //     frameQuantity: 103
        // });
        /*
        my.sprite.player.onOverlap = true;
        this.hiddengroup;
        this.hiddenChecks.forEach(tile => {
            tile.setVisible(false);
            this.physics.world.enable(tile, Phaser.Physics.Arcade.STATIC_BODY)
            //tile.overlap = false;
            //tile.onOverlap = true;
            console.log(this.physics.add.overlap(my.sprite.player, tile));
            this.physics.add.overlap(my.sprite.player, tile, (obj1, obj2) => {
                this.sawTheCollision = true;
                if (this.greenhouseLayer.tilemap.properties["hidden"] == false) {
                    this.greenhouseLayer.tilemap.properties["hidden"] = true;
                    this.greenhouseLayer.setAlpha(0);
                    tile.overlap = true;
                    console.log("hiding layer");
                }
                else {
                    this.greenhouseLayer.tilemap.properties["hidden"] = false;
                    this.greenhouseLayer.setAlpha(1);
                    tile.overlap = true;
                    console.log("revealing layer");
                }
                //if (tile.overlap && this.physics.add.overlap(my.sprite.player, tile))
            });
        });*/
    }

    update() {
        var touching = !my.sprite.player.body.touching.none;
        var wasTouching = !my.sprite.player.body.wasTouching.none;
        //console.log("touch", touching, wasTouching);
        if (touching && !wasTouching) my.sprite.player.emit("overlapstart");

        if(cursors.left.isDown) {
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

        } else if(cursors.right.isDown) {
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);

            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

        } else {
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);

            my.sprite.player.anims.play('idle');
        }
/*
        if (this.sawTheCollision) {
            console.log("touching");
            console.log("my.sprite.player.body.touching.none: " + my.sprite.player.body.touching.none);
            if (!my.sprite.player.body.touching.none) {
                console.log("no longer touching");
                this.sawTheCollision = false;
            }
        }*/

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if (this.DRANKS == this.totalDRANKS) {
            // TODO: WIN
        }
    }
}