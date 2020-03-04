/*
This program outputs AudioNode logo in svg format.
It works with p5.js.
You can try p5.js from the following URL.
https://editor.p5js.org/dannyrozin/sketches/
*/

const cornerCircleVertex = (x1, y1, x2, y2, x3, y3) => {
  const pi = 2 * Math.acos(0);
  const h = 4 * (Math.sqrt(2) - 1) / 3;
  vertex(x1, y1);
  bezierVertex(
    x1 + h * (x2 - x1), y1 + h * (y2 - y1),
    x3 + h * (x2 - x3), y3 + h * (y2 - y3),
    x3, y3
  );
};

const sinVezierVertex = (x1, x2, y, height, repeat, over) => {
  const pi = 2 * Math.acos(0);
  const div = 2 * repeat;
  const w = (x2 - x1) / div;
  const h = over * 4 / (3 * pi);
  for(let i = 0; i < div; i++) {
    vertex(x1, y);
    bezierVertex(
      x1 + (    h) * w, y - (h * pi) * height,
      x1 + (1 - h) * w, y - (h * pi) * height,
      x1 + (1    ) * w, y
    );
    x1 += w;
    height *= -1;
  }
};

const node = (center_x, center_y, width, aspect, weight, repeat) => {
  //resize
  const edge = weight * 2;
  const left = center_x - width * 0.5 + (weight + edge) * 0.5;
  width -= weight + edge;
  const height = width * aspect;
  const top = center_y - height * 0.5;
  
  // config
  strokeCap(SQUARE);
  noFill();
  stroke(255, 41, 137);
  
  // around
  strokeWeight(weight);
  beginShape();
  cornerCircleVertex(
    left, top + edge,
    left, top,
    left + edge, top
  );
  cornerCircleVertex(
    left + width - edge, top,
    left + width, top,
    left + width, top + edge
  );
  endShape();
  beginShape();
  cornerCircleVertex(
    left, top + height - edge,
    left, top + height,
    left + edge, top + height
  );
  cornerCircleVertex(
    left + width - edge, top + height,
    left + width, top + height,
    left + width, top + height - edge
  );
  endShape();
  
  // sin wave
  strokeWeight(weight * 0.6);
  beginShape();
  sinVezierVertex(
    left + edge * 0.5, left + width - edge * 0.5,
    top + height * 0.5, height * 0.14, repeat, 0.7
  );
  endShape();
  beginShape();
  sinVezierVertex(
    left + edge * 0.5, left + width - edge * 0.5,
    top + height * 0.5, height * 0.14, repeat, 2
  );
  endShape();

  // circle
  strokeWeight(weight);
  ellipse(left, top + height * 0.5, edge, edge);
  ellipse(left + width, top + height * 0.5, edge, edge);
};

const param = (aspect, weight, repeat) => {
  node(width * 0.5, height * 0.5, width, aspect, size * weight, repeat);
};

let size = 512;

function setup() {
  createCanvas(size, size, SVG); // Create SVG Canvas
}

function draw() {
  param(2/3, 0.092, 2);
  save("audio_node_logo.svg");
  //param(1, 0.12, 1);
  //save("audio_node_logo_small.svg");
  noLoop();
}