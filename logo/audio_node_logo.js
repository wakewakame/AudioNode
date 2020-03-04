/*
This program outputs AudioNode logo in svg format.
It works with p5.js.
You can try p5.js from the following URL.
https://editor.p5js.org/dannyrozin/sketches/r1djoVow7
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

const getParam = (filename, width, aspect, weight, repeat) => {
  let param = {
    filename: filename,
    width: width,
    outer_width: width,
    aspect: aspect,
    weight: weight,
    repeat: repeat
  };
  param.edge = param.weight * 2;
  param.center_x = param.outer_width * 0.5;
  param.left = param.center_x - param.width * 0.5 + (param.weight + param.edge) * 0.5;
  param.width -= param.weight + param.edge;
  param.height = param.width * param.aspect;
  param.outer_height = param.height + param.edge * 0.5;
  param.center_y = param.outer_height * 0.5;
  param.top = param.center_y - param.height * 0.5;
  return param;
};

const node = (param) => {  
  // config
  strokeCap(SQUARE);
  noFill();
  stroke(255, 41, 137);
  
  // around
  strokeWeight(param.weight);
  beginShape();
  cornerCircleVertex(
    param.left, param.top + param.edge,
    param.left, param.top,
    param.left + param.edge, param.top
  );
  cornerCircleVertex(
    param.left + param.width - param.edge, param.top,
    param.left + param.width, param.top,
    param.left + param.width, param.top + param.edge
  );
  endShape();
  beginShape();
  cornerCircleVertex(
    param.left, param.top + param.height - param.edge,
    param.left, param.top + param.height,
    param.left + param.edge, param.top + param.height
  );
  cornerCircleVertex(
    param.left + param.width - param.edge, param.top + param.height,
    param.left + param.width, param.top + param.height,
    param.left + param.width, param.top + param.height - param.edge
  );
  endShape();
  
  // sin wave
  strokeWeight(param.weight * 0.6);
  beginShape();
  sinVezierVertex(
    param.left + param.edge * 0.5, param.left + param.width - param.edge * 0.5,
    param.top + param.height * 0.5, param.height * 0.14, param.repeat, 0.7
  );
  endShape();
  beginShape();
  sinVezierVertex(
    param.left + param.edge * 0.5, param.left + param.width - param.edge * 0.5,
    param.top + param.height * 0.5, param.height * 0.14, param.repeat, 2
  );
  endShape();

  // circle
  strokeWeight(param.weight);
  ellipse(param.left, param.top + param.height * 0.5, param.edge, param.edge);
  ellipse(param.left + param.width, param.top + param.height * 0.5, param.edge, param.edge);
};


function setup() {
  const size = 512;
  let param = {};
  param = getParam("audio_node_logo.svg", size, 2/3, size * 0.092, 2);
  //param = getParam("audio_node_logo_small.svg", size, 1, size * 0.12, 1);
  createCanvas(param.outer_width, param.outer_height, SVG);
  background(0);
  node(param);
  save(param.filename);
}
