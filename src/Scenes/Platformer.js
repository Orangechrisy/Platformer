class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 700;
        this.DRAG = 2000;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1300;
        this.JUMP_VELOCITY = -500;
        this.MAX_SPEED = 175;
        this.PARTICLE_VELOCITY = 50;

        this.DRANKS = 0;
        this.totalDRANKS = 4;

        // no these are not good variable names but i do not care at this point
        this.alreadyHidden = false; // if the greenhouse layer is currently hidden
        this.currentlyOverlapping = false; // if there is currently any overlap on the triggers
        this.canTrigger = true; // if the player has moved off the tile and the swap can happen again

        this.isMoving = false;
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
        this.tilemap_darkness = this.map.addTilesetImage("dark_packed", "darkness");
        this.allTilesets = [this.tilemap_main, this.tilemap_food, this.tilemap_farm, this.tilemap_industrial, this.tilemap_darkness];

        // Create a layer
        this.backgroundLayer = this.map.createLayer("background", this.allTilesets, 0, 0);
        this.groundLayer = this.map.createLayer("ground", this.allTilesets, 0, 0);
        this.greenhouseLayer = this.map.createLayer("greenhouse-hide", this.allTilesets, 0, 0);
        this.itemLayer = this.map.createLayer("items", this.allTilesets, 0, 0);
        this.darkLayer = this.map.createLayer("background-hide", this.allTilesets, 0, 0);
        this.allLayers = [this.backgroundLayer, this.groundLayer, this.greenhouseLayer, this.darkLayer];
        // maybe also put the items in there to make it prohibitively hard to see the objective

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(70, 1100, "platformer_characters", "tile_0006.png"); // 70, 1100
        my.sprite.player.setCollideWorldBounds(true);
        my.sprite.player.setMaxVelocity(this.MAX_SPEED, 1000);

        // set up sound
        this.cloudSound = this.sound.add("walk_cloud_sound", {volume: .25, rate: .5});
        this.concreteSound = this.sound.add("walk_concrete_sound", {volume: .25, rate: .5});
        this.grassSound = this.sound.add("walk_grass_sound", {volume: .25, rate: .5});
        this.greenhouseSound = this.sound.add("walk_greenhouse_sound", {volume: .25, rate: .5});
        this.metalSound = this.sound.add("walk_metal_sound", {volume: .25, rate: .5});
        this.snowSound = this.sound.add("walk_snow_sound", {volume: .25, rate: .5});
        this.allSounds = [this.cloudSound, this.concreteSound, this.grassSound, this.greenhouseSound, this.metalSound, this.snowSound];
        this.dranking = this.sound.add("drinking_sound", {volume: 1, rate: 2.5})

        // to make platform tiles jump through
        this.groundLayer.forEachTile(tile => {
            if (tile.properties["platform"]) {
                tile.setCollision(false, false, true, false);
            }
        });
        this.darkLayer.forEachTile(tile => {
            if (tile.properties["dark"]) {
                tile.setCollision(false, false, false, false);
            }
        });

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);
        this.physics.add.collider(my.sprite.player, this.darkLayer);

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // restart key
        this.restartKey = this.input.keyboard.addKey('R');

        // camera stuff
        this.cam = this.cameras.main;
        this.cam.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cam.setViewport(0, 0, 1000, 600);
        this.cam.startFollow(my.sprite.player, true, .25, .25);
        
        // texts (win, death, start, restart)
        let x = this.cameras.main.worldView.x + this.cameras.main.width / 2;
        let y = this.cameras.main.worldView.y + this.cameras.main.height / 2;
        this.winText = this.add.text(x, y, "Congrats you got super drunk!", {
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setFontSize(56).setScrollFactor(0, 0).setVisible(false);
        this.deathText = this.add.text(x, y, "Oops, what a stumble!", {
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setFontSize(56).setScrollFactor(0, 0).setVisible(false);
        this.startText = this.add.text(15, 1200, "How about a drink?", {
            fontFamily: 'Arial Black'
        }).setOrigin(0).setFontSize(24);
        this.restartText = this.add.text(x, y + 100, "Press R to restart", {
            fontFamily: 'Arial Black'
        }).setOrigin(0.5).setFontSize(24).setScrollFactor(0, 0).setVisible(false);

        // DRINK
        this.drinks = this.map.createFromObjects("items", {
            name: "DRINK",
            key: "food_spritesheet",
            frame: 82
        });
        this.physics.world.enable(this.drinks, Phaser.Physics.Arcade.STATIC_BODY);
        this.drinksGroup = this.add.group(this.drinks);
        this.physics.add.overlap(my.sprite.player, this.drinksGroup, (obj1, obj2) => {
            obj2.destroy(); // remove drink on overlap
            this.DRANKS += 1;
            this.drankEffects(this.DRANKS);
            this.dranking.play();
        });

        // HIDDEN
        this.darkLayer.setAlpha(0);
        this.hiddenChecks = this.map.createFromObjects("items", {
            name: "HIDDENCHECK",
            key: "food_spritesheet",
            frame: 103
        });
        this.hiddenChecks.forEach(tile => {
            tile.setVisible(false);
        });
        this.greenhouseLayer.tilemap.hidden = false;
        this.physics.world.enable(this.hiddenChecks, Phaser.Physics.Arcade.STATIC_BODY);
        this.hiddenGroup = this.add.group(this.hiddenChecks);
        this.physics.add.overlap(my.sprite.player, this.hiddenGroup, (obj1, obj2) => {
            if (this.canTrigger) {
                if (!this.alreadyHidden) { // currently visible so want to make invisible
                    if (this.greenhouseLayer.tilemap.hidden == false) {
                        this.greenhouseLayer.tilemap.hidden = true;
                        this.greenhouseLayer.setAlpha(0);
                        this.darkLayer.setAlpha(.75);
                        this.alreadyHidden = true;
                        this.canTrigger = false;
                        this.groundLayer.forEachTile(tile => {
                            if (tile.properties["platformToggle"]) {
                                tile.setCollision(false, false, true, false);
                            }
                        });
                        this.darkLayer.forEachTile(tile => {
                            if (tile.properties["dark"]) {
                                tile.setCollision(true, true, true, true);
                            }
                        });
                    }
                }
                else { // currently invisible so want to make visible
                    this.greenhouseLayer.tilemap.hidden = false;
                    this.greenhouseLayer.setAlpha(1);
                    this.darkLayer.setAlpha(0);
                    this.alreadyHidden = false;
                    this.canTrigger = false;
                    this.groundLayer.forEachTile(tile => {
                        if (tile.properties["platformToggle"]) {
                            tile.setCollision(false, false, false, false);
                        }
                    });
                    this.darkLayer.forEachTile(tile => {
                        if (tile.properties["dark"]) {
                            tile.setCollision(false, false, false, false);
                        }
                    });
                }
            }
        });

        // CLIMB
        this.scaffolding = this.map.createFromObjects("items", {
            name: "SCAFFOLD",
            key: "food_spritesheet",
            frame: 11
        });
        this.physics.world.enable(this.scaffolding, Phaser.Physics.Arcade.STATIC_BODY);
        this.scaffoldGroup = this.add.group(this.scaffolding);
        this.scaffolding.forEach(tile => {
            tile.setVisible(false);
        });
        this.physics.add.overlap(my.sprite.player, this.scaffoldGroup, (obj1, obj2) => {
            if (cursors.up.isDown) {
                my.sprite.player.body.setVelocityY(-100);
                this.playWalkSound();
            }
        });

        // PARTICLES
        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_01.png', 'smoke_02.png', 'smoke_03.png'],
            scale: {start: 0.02, end: 0.1},
            lifespan: 350,
            maxAliveParticles: 12,
            alpha: {start: 1, end: 0.1, random: true}, 
            gravity: -400,
            blendMode: 1
        });
        my.vfx.walking.stop();
    }

    // for putting the fx on
    drankEffects(drinks) {
        if (drinks >= 1) {
            this.allLayers.forEach(layer => {
                this.fx = layer.postFX.addDisplacement('distort3', -0.05, -0.05);
                this.tweens.add({
                    targets: this.fx,
                    x: 0.05,
                    y: 0.05,
                    yoyo: true,
                    loop: -1,
                    duration: 1950,
                    ease: 'sine.inout'
                });
            });
            if (drinks >= 2) {
                this.allLayers.forEach(layer => {
                    this.fx = layer.postFX.addDisplacement('distort', 0.02, 0.03);
                    this.tweens.add({
                        targets: this.fx,
                        x: -0.03,
                        y: -0.04,
                        yoyo: true,
                        loop: -1,
                        duration: 1340,
                        ease: 'cubic.inout'
                    });
                });
                if (drinks >= 3) {
                    this.allLayers.forEach(layer => {
                        this.fx = layer.postFX.addDisplacement('distort2', 0.02, 0.01);
                        this.tweens.add({
                            targets: this.fx,
                            x: -0.02,
                            y: -0.01,
                            yoyo: true,
                            loop: -1,
                            duration: 2490,
                            ease: 'sine.inout'
                        });
                    });
                }
            }
        }
    }

    update() {
        // win!
        if (this.DRANKS == this.totalDRANKS) {
            this.winText.setVisible(true);
            this.restartText.setVisible(true);
        }

        if (my.sprite.player.y > 1250) {
            this.deathText.setVisible(true);
            this.restartText.setVisible(true);
            this.winText.setVisible(false);
        }

        // movement
        if(cursors.left.isDown) {
            my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);

            this.playWalkSound();
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.body.setAccelerationX(this.ACCELERATION);

            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);

            this.playWalkSound();
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else {
            my.sprite.player.body.setAccelerationX(0);
            my.sprite.player.body.setDragX(this.DRAG);

            my.sprite.player.anims.play('idle');

            this.stopWalkSound();
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        // hidden overlap flag check stuff argh but it works
        this.currentlyOverlapping = false;
        this.hiddenChecks.forEach( tile => {
            if (this.physics.overlap(my.sprite.player, tile)) {
                this.currentlyOverlapping = true;
            }
        });
        if (this.currentlyOverlapping == false) {
            this.canTrigger = true;
        }

        if(Phaser.Input.Keyboard.JustDown(this.restartKey)) {
            this.scene.restart();
        }
    }

    // sound functions
    playWalkSound() {
        let tile = this.getTileBelowPlayer();
        if (tile) {
            if (tile.properties["cloudSound"] && !this.cloudSound.isPlaying) {
                this.allSounds.forEach(sound => {
                    sound.stop();
                })
                this.cloudSound.play();
            }
            if (tile.properties["concreteSound"] && !this.concreteSound.isPlaying) {
                this.allSounds.forEach(sound => {
                    sound.stop();
                })
                this.concreteSound.play();
            }
            if (tile.properties["grassSound"] && !this.grassSound.isPlaying) {
                this.allSounds.forEach(sound => {
                    sound.stop();
                })
                this.grassSound.play();
            }
            if (tile.properties["greenhouseSound"] && !this.greenhouseSound.isPlaying) {
                this.allSounds.forEach(sound => {
                    sound.stop();
                })
                this.greenhouseSound.play();
            }
            if (tile.properties["metalSound"] && !this.metalSound.isPlaying) {
                this.allSounds.forEach(sound => {
                    sound.stop();
                })
                this.metalSound.play();
            }
            if (tile.properties["snowSound"] && !this.snowSound.isPlaying) {
                this.allSounds.forEach(sound => {
                    sound.stop();
                })
                this.snowSound.play();
            }
        }
        else {
            this.allSounds.forEach(sound => {
                sound.stop();
            })
        }
    }

    stopWalkSound() {
        this.allSounds.forEach(sound => {
            sound.stop();
        })
    }

    getTileBelowPlayer() {
        let checkX = my.sprite.player.x;
        let checkY = my.sprite.player.y + my.sprite.player.displayHeight/2 + 1;
        return this.groundLayer.getTileAtWorldXY(checkX, checkY);
    }
}