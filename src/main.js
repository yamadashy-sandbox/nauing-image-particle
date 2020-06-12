"use strict";

import p5 from 'p5';
import * as PIXI from 'pixi.js'

const IMAGE_URL = "./static/images/nauboo.png";
const PARTICLE_SIZE = 1; // image pixel size
const PADDING = 30;
const DEFAULT_REPULSION_CHANGE_DISTANCE = 80;

let repulsionChangeDistance = DEFAULT_REPULSION_CHANGE_DISTANCE;
let particleSystem = null;
let targetImage = null;
let p5instance = null;

// ==================================================
// ImageParticle Class
// ==================================================
class ImageParticle {
  constructor(originPosition, originScale, originColor) {
    this.position = originPosition.copy();
    this.originPosition = originPosition.copy();
    this.velocity = p5instance.createVector(p5instance.random(0, 50), p5instance.random(0, 50));
    this.repulsion = p5instance.random(1.0, 5.0);
    this.mouseRepulsion = 1.0;
    this.gravity = 0.01;
    this.maxGravity = p5instance.random(0.01, 0.04);
    this.scale = originScale;
    this.originScale = originScale;
    this.color = originColor;
    this.sprite = null;
  }

  createSprite(texture) {
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.tint = (this.color[0] << 16) + (this.color[1] << 8) + (this.color[2]);

    return this.sprite;
  }

  updateState() {
    this._updateStateByMouse();
    this._updateStateByOrigin();
    this.velocity.mult(0.95);
    this.position.add(this.velocity);

    this.sprite.position.x = this.position.x;
    this.sprite.position.y = this.position.y;
    this.sprite.scale.x = this.sprite.scale.y = this.scale;
  }

  _updateStateByMouse() {
    const distanceX = p5instance.mouseX - this.position.x;
    const distanceY = p5instance.mouseY - this.position.y;
    const distance = p5instance.mag(distanceX, distanceY);
    const pointCos = distanceX / distance;
    const pointSin = distanceY / distance;

    if (distance < repulsionChangeDistance) {
      this.gravity *= 0.6;
      this.mouseRepulsion = p5instance.max(0, this.mouseRepulsion * 0.5 - 0.01);
      this.velocity.sub(pointCos * this.repulsion, pointSin * this.repulsion);
      this.velocity.mult(1 - this.mouseRepulsion);
    } else {
      this.gravity += (this.maxGravity - this.gravity) * 0.1;
      this.mouseRepulsion = p5instance.min(1, this.mouseRepulsion + 0.03);
    }
  }

  _updateStateByOrigin() {
    const distanceX = this.originPosition.x - this.position.x;
    const distanceY = this.originPosition.y - this.position.y;
    const distance = p5instance.mag(distanceX, distanceY);

    this.velocity.add(distanceX * this.gravity, distanceY * this.gravity);
    this.scale = this.originScale + this.originScale * distance / 512;
  }
}

// ==================================================
// ImageParticleSystem クラス
// ==================================================
class ImageParticleSystem {
  constructor() {
    this.points = [];
    this.pointSprites = [];
    this.app = new PIXI.Application({
      view: document.getElementById("viewport"),
      backgroundColor: 0xFFFFFF,
      width: window.innerWidth,
      height: window.innerHeight
    });
    this.renderer = this.app.renderer;
    this.stage = new PIXI.Container();
    this.container = new PIXI.Container();

    this._createParticles();
    this._setup();
  }

  _setup() {
    this.stage.addChild(this.container);
    document.body.appendChild(this.renderer.view);
  }

  _getPixel(x, y) {
    const pixels = targetImage.pixels;
    const idx = (y * targetImage.width + x) * 4;

    if (x > targetImage.width || x < 0 || y > targetImage.height || y < 0) {
      return [0, 0, 0, 0];
    }

    return [
      pixels[idx],
      pixels[idx + 1],
      pixels[idx + 2],
      pixels[idx + 3]
    ];
  }

  _createParticleTexture() {
    const graphics = new PIXI.Graphics();

    graphics.beginFill(0xFFFFFF);
    graphics.drawRect(0, 0, PARTICLE_SIZE, PARTICLE_SIZE);
    graphics.endFill();

    return this.renderer.generateTexture(graphics);;
  }

  _createParticles() {
    const imageWidth = targetImage.width;
    const imageHeight = targetImage.height;
    const imageScale = p5instance.min((window.innerWidth - PADDING * 2) / imageWidth, (window.innerHeight - PADDING * 2) / imageHeight);
    const texture = this._createParticleTexture();
    const fractionSizeX = imageWidth / PARTICLE_SIZE;
    const fractionSizeY = imageHeight / PARTICLE_SIZE;
    const offsetX = (window.innerWidth - p5instance.min(window.innerWidth, window.innerHeight)) / 2;
    const offsetY = (window.innerHeight - p5instance.min(window.innerWidth, window.innerHeight)) / 2;

    for (let i = 0; i < fractionSizeX; i++) {
      for (let j = 0; j < fractionSizeY; j++) {
        const imagePosition = p5instance.createVector(p5instance.int(i * PARTICLE_SIZE), p5instance.int(j * PARTICLE_SIZE));
        let originPosition = imagePosition;
        let originScale = imageScale;
        let originColor = this._getPixel(imagePosition.x, imagePosition.y);

        // 透明はスキップ
        if (originColor[3] === 0) {
          continue;
        }

        originPosition.mult(imageScale);
        originPosition.add(offsetX + PADDING, offsetY + PADDING);

        let point = new ImageParticle(originPosition, originScale, originColor);
        this.points.push(point);
        this.container.addChild(point.createSprite(texture));
      }
    }
  }

  updateState() {
    for (let point of this.points) {
      point.updateState();
    }
  }

  render() {
    this.renderer.render(this.stage);
  }
}

// ==================================================
// Main
// ==================================================
function sketch(p5instance) {
  p5instance.preload = function() {
    targetImage = p5instance.loadImage(IMAGE_URL);
  }

  p5instance.setup = function() {
    targetImage.loadPixels();
    p5instance.noStroke();
    p5instance.frameRate(60);
    particleSystem = new ImageParticleSystem();
  }

  p5instance.draw = function() {
    repulsionChangeDistance = p5instance.max(0, repulsionChangeDistance - 1.5);

    particleSystem.updateState();
    particleSystem.render();
  }

  p5instance.mouseMoved = function() {
    repulsionChangeDistance = DEFAULT_REPULSION_CHANGE_DISTANCE;
  }

  p5instance.touchMoved = function() {
    repulsionChangeDistance = DEFAULT_REPULSION_CHANGE_DISTANCE;
  }
}

p5instance = new p5(sketch, document.body);
