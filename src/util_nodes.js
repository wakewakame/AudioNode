import { HydrangeaJS } from "../3rdparty/HydrangeaJS/src/hydrangea.js";

const Node = HydrangeaJS.GUI.Templates.Node;
const ShaderNode = HydrangeaJS.Extra.ShaderNode.ShaderNode;
const FrameNode = HydrangeaJS.Extra.ShaderNode.FrameNode;
const ValueNode = HydrangeaJS.Extra.ShaderNode.ValueNode;
const TimeNode = HydrangeaJS.Extra.ShaderNode.TimeNode;

export const CreateEmptyNodeButton = class extends Node {
	constructor(x, y) {
		super("create", "💪😀💪やぁ", x, y);
		this.textWidth = 0.0;
		this.createText = null;
		this.generateTypes = {};
		this.generateTypeTexts = [];
		this.currentGenerateType = 0;
		this.arrowShape = null;
		this.mouseArea = 0;
	}
	setup() {
		super.setup();
		this.createText = this.graphics.createTexture(1, 1);
		this.createText.loadText("create", "#303030", 100, "monospace", true);
		this.generateTypes = {
			"byte frame": () => { return new FrameNode("byte frame", this.x, this.y, 1, 1, this.graphics.gapp.gl.RGBA, this.graphics.gapp.gl.UNSIGNED_BYTE); },
			"float frame": () => { return new FrameNode("float frame", this.x, this.y, 1, 1, this.graphics.gapp.gl.RGBA, this.graphics.gapp.gl.FLOAT); },
			"shader": () => { return new ShaderNode("empty", this.x, this.y, 500); },
			"float": () => { return new ValueNode("float", "empty", this.x, this.y, 500); },
			"int": () => { return new ValueNode("int", "empty", this.x, this.y, 500); },
			"vec2": () => { return new ValueNode("vec2", "empty", this.x, this.y, 500); },
			"ivec2": () => { return new ValueNode("ivec2", "empty", this.x, this.y, 500); },
			"vec3": () => { return new ValueNode("vec3", "empty", this.x, this.y, 500); },
			"ivec3": () => { return new ValueNode("ivec3", "empty", this.x, this.y, 500); },
			"vec4": () => { return new ValueNode("vec4", "empty", this.x, this.y, 500); },
			"ivec4": () => { return new ValueNode("ivec4", "empty", this.x, this.y, 500); },
			"time": () => { return new TimeNode(this.x, this.y); }
		};
		this.textWidth = Math.max(this.textWidth, this.createText.width);
		Object.keys(this.generateTypes).forEach((key) => {
			const t = this.graphics.createTexture(1, 1);
			t.loadText(key, "#303030", 180, "monospace", true);
			this.textWidth = Math.max(this.textWidth, t.width);
			this.generateTypeTexts.push(t);
		});
		this.resize(
			this.textWidth * 0.16 + 64.0,
			280.0 * 0.16 + 32.0
		);
		this.arrowShape = this.graphics.createShape();
		this.arrowShape.beginShape(this.arrowShape.gl.TRIANGLES);
		this.arrowShape.color(0.3, 0.3, 0.3, 1.0);
		this.arrowShape.vertex(-1.0, 0.0, 0.0);
		this.arrowShape.vertex(1.0, -1.0, 0.0);
		this.arrowShape.vertex(1.0, 1.0, 0.0);
		this.arrowShape.endShape();
	}
	deleted(){
		if (this.arrowShape !== null) this.arrowShape.delete();
		if (this.createText !== null) this.createText.delete();
		this.generateTypeTexts.forEach((t) => {
			t.delete();
		});
	}
	draw() {
		super.draw();

		this.graphics.pushMatrix();
		this.graphics.translate(this.w / 2.0, this.h / 2.0);
		let scale = 0.16 * Math.min(1.0, this.w / (this.textWidth * 0.16 + 64.0));
		this.graphics.scale(scale, scale);
		this.graphics.pushMatrix();
		this.graphics.translate(-this.createText.width / 2.0, -280.0 / 2.0);
		this.graphics.image(
			this.createText, 0, 0, this.createText.width, this.createText.height
		);
		this.graphics.popMatrix();
		this.graphics.pushMatrix();
		const gtt = this.generateTypeTexts[this.currentGenerateType];
		this.graphics.translate(-gtt.width / 2.0, -80.0 / 2.0);
		this.graphics.image(
			gtt, 0, 0, gtt.width, gtt.height
		);
		this.graphics.popMatrix();
		this.graphics.popMatrix();

		this.graphics.fill(1.0, 0.0, 0.0, 0.4);
		this.graphics.stroke(0.0, 0.0, 0.0, 0.0);

		this.graphics.pushMatrix();
		this.graphics.translate(16.0, this.h / 2.0);
		this.graphics.scale(8.0, 8.0);
		this.graphics.shape(this.arrowShape);
		if (this.mouseArea == 1) this.graphics.ellipse(0, 0, 5, 5);
		this.graphics.popMatrix();

		this.graphics.pushMatrix();
		this.graphics.translate(this.w - 16.0, this.h / 2.0);
		this.graphics.scale(-8.0, 8.0);
		this.graphics.shape(this.arrowShape);
		if (this.mouseArea == 2) this.graphics.ellipse(0, 0, 5, 5);
		this.graphics.popMatrix();
	}
	mouseEvent(type, x, y, start_x, start_y) {
		super.mouseEvent(type, x, y, start_x, start_y);

		this.mouseArea = 0;
		if (x < 30.0) this.mouseArea = 1;
		if (x > this.w - 30.0) this.mouseArea = 2;

		if (type === "CLICK") {
			switch(this.mouseArea){
				case 0:
					const empty = this.parent.add(
						Object.values(this.generateTypes)[this.currentGenerateType]()
					);
					empty.resize(this.w, this.h);
					this.parent.activeChilds(empty);
					break;
				case 1:
					this.currentGenerateType--;
					break;
				case 2:
					this.currentGenerateType++;
					break;
			}
			this.currentGenerateType =
				this.currentGenerateType -
				Math.floor(this.currentGenerateType / Object.keys(this.generateTypes).length) * Object.keys(this.generateTypes).length;
		}
	}
};

export const LatencyFrameNode = class extends FrameNode {
	constructor(name, x, y, width = 1, height = 1, format = null, type = null) {
		super(name, x, y, width, height, format, type);
		this.frameBufferTmp = null;
	}
	setup(){
		super.setup();
		this.frameBufferTmp = this.graphics.createFrame(
			this.frameBufferState.width,
			this.frameBufferState.height,
			this.frameBufferState.format,
			this.frameBufferState.type
		);
	}
	deleted(){
		super.deleted();
		this.frameBufferTmp.delete();
	}
	resizeFrame(width, height, format = null, type = null){
		super.resizeFrame(width, height, format, type);
		this.frameBufferTmp.resize(
			width,
			height,
			format,
			type
		);
	}
	job(){
		let tmp = this.frameBuffer;
		this.frameBuffer = this.frameBufferTmp;
		this.frameBufferTmp = tmp;
		super.job();
	}
	draw(){
		super.draw();
	}
};