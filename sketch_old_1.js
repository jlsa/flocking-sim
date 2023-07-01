let image;
let isHovering = false;

function setup() {
  let canvas = createCanvas(800, 800);
  image = createImg('http://th07.deviantart.net/fs70/PRE/i/2011/260/3/5/dash_hooray_by_rainbowcrab-d49xk0d.png');
  image.position(200, 250);
  image.size(200, 200);

  canvas.position(300, 50);

  canvas.mouseOver(uniHide);
  canvas.mouseOut(uniShow);
}

function draw() {
  noStroke();
  background(220, 180, 200);
  fill(180, 200, 40);
  strokeWeight(6);
  stroke(180, 100, 240);
  for (let i = 0; i < width; i += 15) {
    line(i, 0, i, height);
  }
  stroke(128, 128, 128);
  line(mouseX, mouseY, width / 2, height / 2);

  // render bounds of image
  rect(190, 50, 200, 200);
}

function uniHide() {
  image.hide();
}

function uniShow() {
  image.show();
}