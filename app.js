'use strict';

// Create a PIXI stage.
var stage = new PIXI.Container();

// Create a PIXI renderer with added options.
var renderer = PIXI.autoDetectRenderer(
  window.innerWidth,
  window.innerHeight,
  { antialias: false, transparent: false, resolution: 1 }
);
renderer.view.style.position = "absolute"
renderer.view.style.display = "block";
renderer.backgroundColor = 0xffffff;

// Append new webgl/canvas renderer to the HTML body.
document.body.appendChild(renderer.view);


// Load the spritesheet and run the progress handler and the setup function.
PIXI.loader
  .add('images/spritesheet.json')
  .on("progress", loadProgressHandler)
  .load(setup);

// Display what and how much is being loaded.
function loadProgressHandler(loader, resource) {

  // Display the file `url` currently being loaded
  console.log("loading: " + resource.url);

  // Display the precentage of files currently loaded
  console.log("progress: " + loader.progress + "%");

}


let gameScene, gameOverScene;
let leftTouch = {};
let rightTouch = {};
let stick;
let player;
let state;

function setup() {

  // This scene will be active while the game is active.
  gameScene = new PIXI.Container();
  gameScene.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight);
  gameScene.interactive = true;
  stage.addChild(gameScene);

  // This scene will become visible when the game ends.
  gameOverScene = new PIXI.Container();
  gameOverScene.visible = false;
  stage.addChild(gameOverScene);

  // Player creation and options.
  // Store player animation frames to make a MovieClip.
  let player_textures = [];

  for(let i = 0; i < 3; i++) {
    let texture = PIXI.Texture.fromFrame('player_' + i + '.png');
    player_textures.push(texture);
  }

  player = new PIXI.extras.MovieClip(player_textures);
  player.animationSpeed = 0.3;
  player.anchor.set(0.5, 0.5);
  player.position.set(renderer.view.width / 2, renderer.view.height / 2);
  player.vx = 0;
  player.vy = 0;
  gameScene.addChild(player);

  // The left screen will be the left half of the game scene.
  // This side will be responsible for the movement of the player.

  // The player will be controlled with an invisible, and touch joystick
  // that can be set anywhere on the left half of the game scene.
  //
  //                              \ | /
  //                              - o -
  //                              / | \
  //
  // stick = new PIXI.Graphics();
  // stick.lineStyle(1, 0x000000, 1);
  // gameScene.addChild(stick);

  gameScene.on('touchstart', function(event) {

    this.data = event.data;

    let  oE = event.data.originalEvent;
    let localPos = event.data.getLocalPosition(player.parent);

    if (localPos.x < (renderer.view.width / 2)) {
      leftTouch = {
        eData: event.data,
        fingerDown: true,
        moving: false,
        start: {
          x: localPos.x,
          y: localPos.y
        },
        current: {},
        delta: {}
      };
    } else if (localPos.x > (renderer.view.width / 2)) {
      rightTouch = {
        eData: event.data,
        start: {
          x: localPos.x,
          y: localPos.y
        },
        current: {},
        delta: {}
      }
    }

    // stick.moveTo(leftTouch.start.x, leftTouch.start.y);

  });

  gameScene.on('touchmove', function() {

    if (leftTouch) {
      console.log('left');
      leftTouch.moving = true;

      // leftTouch.current.x = this.data.originalEvent.changedTouches[0].clientX;
      // leftTouch.current.y = this.data.originalEvent.changedTouches[0].clientY;

      // This line will get the touch coords relative to the sprites.
      let localPos = this.data.getLocalPosition(player.parent);

      // Coordinates of current touch in local coordinates.
      leftTouch.current.x = localPos.x;
      leftTouch.current.y = localPos.y;

      // Change in x and y between start touch and current touch.
      leftTouch.delta.x = leftTouch.current.x - leftTouch.start.x;
      leftTouch.delta.y = leftTouch.current.y - leftTouch.start.y;

      // let distSq = (leftTouch.delta.x * leftTouch.delta.x) + (leftTouch.delta.y * leftTouch.delta.y);
      // let radius = 9;
      // if (distSq > radius * radius) {
      //   let dist = Math.sqrt(distSq);
      //   let ratio = radius / dist;

      //   leftTouch.delta.x = (leftTouch.delta.x * ratio) + leftTouch.start.x;
      //   leftTouch.delta.y = (leftTouch.delta.y * ratio) + leftTouch.start.y;
      // }

      leftTouch.degrees = Math.atan2(leftTouch.delta.y, leftTouch.delta.x);

      player.vx = 0.02;
      player.vy = 0.02;

      // stick.lineTo(leftTouch.current.x, leftTouch.current.y);
    } else if (rightTouch) {
      console.log('rightTouchmove');
    }

  });

  gameScene.on('touchend', function() {

    this.data = null;
    leftTouch = {};

  });

  // The right screen will be the right half of the game scene.
  // This side will be responsible for the use of weapons.

  // The right screen uses swipe gestures and shoots projectiles
  // in the direction of said swipes.

  // state holds either the play() function or the end() function.
  // This will either keep the game running (gameScene is visible), or
  // end the game (gameOverScene is visible).
  state = play;

  gameLoop();
}

function gameLoop() {
  state();
  renderer.render(stage);
  requestAnimationFrame(gameLoop);
}

function play() {
  // x borders
  if (player.x > window.innerWidth) {
    player.x = window.innerWidth - 5;
  } else if(player.position.x < 0) {
    player.x = 5;
  }

  // y borders
  if (player.y > window.innerHeight) {
    player.y = window.innerHeight - 5;
  } else if(player.position.y < 0) {
    player.y = 5;
  }

  // moving
  if (leftTouch.fingerDown) {

    // Rotate player sprite only if the current touch is changing w.r.t. start touch.
    if (leftTouch.moving) {
      player.rotation = leftTouch.degrees + (Math.PI / 2);
    }

    // Only move player when delta between start touch and current touch exists.
    if (Math.abs(leftTouch.delta.x) > 0 || Math.abs(leftTouch.delta.y) > 0) {
      // Animate player sprite
      player.play();

      player.position.x += player.vx * leftTouch.delta.x;
      player.position.y += player.vy * leftTouch.delta.y;
    }

  } else {
    player.vx = player.vy = 0;
    player.gotoAndStop(0);
  }

  leftTouch.moving = false;

  // Game end condition.
  // if() {
  //   state = end;
  // }
}

function end() {
  gameScene.visible = false;
  gameOverScene.visible = true;
}
