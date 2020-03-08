/*
This program outputs AudioNode logo in svg format.
It works with p5.js.
You can try p5.js from the following URL.
https://editor.p5js.org/dannyrozin/sketches/r1djoVow7
*/

const mod = (i, d) => ((i / d - Math.floor(i / d)) * d);
const zp2mp = (i) => (i * 2 - 1);
const zzpp = (i) => (Math.floor(mod(i / 2, 2)));
const mmpp = (i) => (zp2mp(zzpp(i)));
const zmzp = (i) => (Math.floor(mod(i, 2) * mmpp(i)));

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

const corner = (x, y, size, r, where, reverse) => {
  const line_l = size - r;
  let args = [
    {x: r * zmzp(where - 1) + line_l * mmpp(where - 1),
     y: r * zmzp(where + 0) + line_l * mmpp(where + 0)},
    {x: r * mmpp(where - 1) + line_l * mmpp(where - 1),
     y: r * mmpp(where + 0) + line_l * mmpp(where + 0)},
    {x: r * zmzp(where + 0) + line_l * mmpp(where - 1),
     y: r * zmzp(where + 1) + line_l * mmpp(where + 0)}
  ];
  if (reverse) { args = [args[2], args[1], args[0]]; }
  args = args.map(p => ({x: p.x + x, y: p.y + y}));
  cornerCircleVertex(args[0].x, args[0].y, args[1].x, args[1].y, args[2].x, args[2].y);
};

const print = () => {
  // config
  strokeCap(SQUARE);
  noStroke();
  fill(255, 41, 137);

  // text
  stroke(255, 41, 137);

  let or = 30, ir = 2 / 7, sharp = 2 / 5, gap = 10;
  
  translate(0, or * 0.5);
  translate(or + 0.5, or + 0.5);
  
  push();
  beginShape();
  corner(0, 0, or, or, 0, false);
  corner(0, 0, or, or * ir, 1, false);
  corner(0, 0, or, or * ir * sharp, 2, false);
  corner(-or * (1 + ir), 0, or, or * ir * sharp, 3, false);
  corner(or * (1 - ir), or * (1 - ir), or, or * ir * sharp, 1, true);
  corner(-or * (1 - ir), or * (1 - ir), or, or * ir, 0, true);
  corner(or * (1 + ir), 0, or, or * ir * sharp, 2, false);
  corner(0, 0, or, or * ir * sharp, 3, false);
  endShape(CLOSE);
  translate(or, 0);
  
  translate(or + gap, 0);
  beginShape();
  corner(0, 0, or, or, 0, false);
  corner(0, 0, or, or, 1, false);
  corner(0, 0, or, or, 2, false);
  corner(0, 0, or, or, 3, false);
  corner(0, 0, or * ir, or * ir, 3, true);
  corner(0, 0, or * ir, or * ir, 2, true);
  corner(0, 0, or * ir, or * ir, 1, true);
  corner(0, 0, or * ir, or * ir, 0, true);
  endShape(CLOSE);
  translate(or, 0);
  
  translate(or + gap, 0);
  beginShape();
  corner(0, -or * 0.5, or, or * ir * sharp, 0, false);
  corner(or * (ir + 1), -or * 0.5, or, or * ir * sharp, 1, false);
  corner(or * (ir - 1), or * -2, or, or * ir * sharp, 3, true);
  corner(0, 0, or, or, 1, false);
  corner(0, 0, or, or, 2, false);
  corner(-or * (1 - ir), 0, or, or * ir * sharp, 3, false);
  corner(-or * (1 - ir), or * (1 + ir), or, or * ir * sharp, 4, false);
  corner(or * (1 - ir), -or * (1 - ir), or, or * ir, 2, true);
  corner(or * (1 - ir), or * (1 - ir), or, or * ir, 1, true);
  corner(0, -or * (1 + ir), or, or * ir, 3, false);
  endShape(CLOSE);
  translate(or, 0);
  
  translate(gap - or * ir + 2, 0);
  beginShape();
  corner(0, 0, or, or * ir * sharp, 0, false);
  corner(or * (ir + 1), 0, or, or * ir * sharp, 1, false);
  corner(or * (ir + 1), 0, or, or * ir * sharp, 2, false);
  corner(0, 0, or, or * ir * sharp, 3, false);
  endShape(CLOSE);
  translate(or, 0);
  
  translate(or + gap + 2, 0);
  beginShape();
  corner(0, 0, or, or, 0, false);
  corner(0, 0, or, or, 1, false);
  corner(0, 0, or, or, 2, false);
  corner(0, 0, or, or, 3, false);
  corner(0, 0, or * ir, or * ir, 3, true);
  corner(0, 0, or * ir, or * ir, 2, true);
  corner(0, 0, or * ir, or * ir, 1, true);
  corner(0, 0, or * ir, or * ir, 0, true);
  endShape(CLOSE);
  translate(or, 0);
  pop();
};


function setup() {
  const size = 512;
  createCanvas(60 * 5 + 10 * 4 - 30 * (1 + 2 / 7) + 4 + 1, 75 + 1, SVG);
  //background(0);
  print();
  save("logo_text.svg");
}
