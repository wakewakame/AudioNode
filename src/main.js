import { HydrangeaJS } from "../3rdparty/HydrangeaJS/src/hydrangea.js";
import { Midi } from "./midi.js";

const Page = HydrangeaJS.GUI.Page.Page;
const PageEvent = HydrangeaJS.GUI.Page.PageEvent;
const NodeCanvas = HydrangeaJS.GUI.Templates.NodeCanvas;
const TimeNode = HydrangeaJS.Extra.ShaderNode.TimeNode;
const PictureNode = HydrangeaJS.Extra.ShaderNode.PictureNode;
const ShaderNode = HydrangeaJS.Extra.ShaderNode.ShaderNode;
const FrameNode = HydrangeaJS.Extra.ShaderNode.FrameNode;
const ValueNode = HydrangeaJS.Extra.ShaderNode.ValueNode;
const Audio = HydrangeaJS.Extra.Audio.Audio;

const NodeCanvasExt = class extends NodeCanvas{
	constructor(page) {
		super();
		this.page = page;
		this.activeNode = null;
		this.editorElement = this.page.addElement("div", 0.0, 0.5, 1.0, 1.0, {
			"background": "#FFFFFF80",
			"display": "none"
		});
		this.editorElement.id = "shader_editor";
		this.editor = ace.edit(this.editorElement.id);
		this.editor.setTheme("ace/theme/tomorrow");
		this.editor.setOptions({
			fontSize: "14pt"
		});
		this.editor.getSession().setMode("ace/mode/glsl");
		this.editor.on("change", (e) => {
			if (this.childs.length > 0) {
				if (this.childs[0].hasOwnProperty("compileState")) {
					const code = this.editor.getValue();
					if (
						code !== "" &&
						code !== this.childs[0].compileState.code
					) this.childs[0].setCode(code);
				}
			}
		});
		this.addEventListener("DOWN", e => {
			this.activeNode = null;
			this.editorElement.style["display"] = "none";
		});
		this.audio = null;
		this.audioInput = null;
		this.audioOutput = null;
	}
	setup(){
		const AudioInputNode = class extends FrameNode {
			constructor(x, y, array_length) {
				super(
					"audio input",
					x, y, array_length, 1
				);
				this.inputWave = null;
			}
			setup() {
				super.setup();
				this.resizeFrame(
					this.frameBufferState.width, this.frameBufferState.height,
					this.graphics.gapp.gl.RGBA, this.graphics.gapp.gl.FLOAT
				);
				this.inputs.remove(this.inputShaderNodeParam);
				this.inputs.remove(this.inputResolutionNodeParam);
				this.previewShader.loadShader(this.previewShader.default_shader.vertex, `
precision highp float;
uniform sampler2D texture;
uniform ivec2 textureArea;
varying vec2 vUv;

void main(void){
	vec2 p = vUv * vec2(textureArea);
	float wave = texture2D(texture, p).r / 2.0;
	p.y = (p.y * 2.0) - 1.0;
	float g = (p.y > wave) ? 1.0 : 0.0;
	gl_FragColor = vec4(vec3(g), 1.0);
}
				`);
			}
			job() {
				super.job();
				if (this.inputWave instanceof Float32Array) {
					this.frameBuffer.texture.update(this.inputWave);
				}
			}
		};
		const AudioOutputNode = class extends FrameNode {
			constructor(x, y, array_length) {
				super(
					"audio output",
					x, y, array_length, 1
				);
			}
			setup() {
				super.setup();
				this.resizeFrame(
					this.frameBufferState.width, this.frameBufferState.height,
					this.graphics.gapp.gl.RGBA, this.graphics.gapp.gl.FLOAT
				);
				this.outputs.remove(this.outputShaderNodeParam);
				this.outputs.remove(this.outputResolutionNodeParam);
				this.inputs.remove(this.inputResolutionNodeParam);
				this.previewShader.loadShader(this.previewShader.default_shader.vertex, `
precision highp float;
uniform sampler2D texture;
uniform ivec2 textureArea;
varying vec2 vUv;

void main(void){
	vec2 p = vUv * vec2(textureArea);
	float wave = texture2D(texture, p).r / 2.0;
	p.y = (p.y * 2.0) - 1.0;
	float g = (p.y > wave) ? 1.0 : 0.0;
	gl_FragColor = vec4(vec3(g), 1.0);
}
				`);
			}
		};
		const MidiInputNode = class extends FrameNode {
			constructor(x, y, midi) {
				super(
					"midi input",
					x, y, 128, 1
				);
				this.midi = midi;
				this.midiState = new Float32Array(128 * 4);
			}
			setup() {
				super.setup();
				this.resizeFrame(
					this.frameBufferState.width, this.frameBufferState.height,
					this.graphics.gapp.gl.RGBA, this.graphics.gapp.gl.FLOAT
				);
				this.inputs.remove(this.inputShaderNodeParam);
				this.inputs.remove(this.inputResolutionNodeParam);
				this.previewShader.loadShader(this.previewShader.default_shader.vertex, `
precision highp float;
uniform sampler2D texture;
uniform vec2 textureArea;
varying vec2 vUv;
varying vec4 vColor;

void main(void){
	gl_FragColor = vec4(texture2D(texture, vUv * textureArea).rgb, 1.0);
}
				`);
				this.midi.addEventListener("onMidiMessage", (e) => {
					switch(e.data[0]) {
						case 128:
							this.midiState[e.data[1] * 4 + 0] = 0.0;
							this.midiState[e.data[1] * 4 + 2] = 0.0;
							break;
						case 144:
							this.midiState[e.data[1] * 4 + 0] = 1.0;
							this.midiState[e.data[1] * 4 + 1] = 0.0;
							break;
					}
				});
			}
			job() {
				super.job();
				this.frameBuffer.texture.update(this.midiState);
				for(let i = 0; i < (this.midiState.length) / 4; i++) {
					if (this.midiState[i * 4 + 0] == 0.0) {
						this.midiState[i * 4 + 2] += 1.0;
					}
					else {
						this.midiState[i * 4 + 1] += 1.0;
					}
				}
			}
		};
		this.audio = new Audio();
		this.midi = new Midi();
		this.audioInput  = this.add(new AudioInputNode (30, 30, this.audio.array_length));
		this.audioOutput = this.add(new AudioOutputNode(530, 30, this.audio.array_length));
		this.midiInput = this.add(new MidiInputNode(30, 230, this.midi));
		this.audio.setCallback((input, output, inputSampleRate, outputSampleRate) => {
			const tmpArray = new Float32Array(input.length * 4);
			for (let i = 0; i < input.length; i++) {
				tmpArray[i * 4 + 0] = input[i];
				tmpArray[i * 4 + 1] = 1.0;
				tmpArray[i * 4 + 2] = 1.0;
				tmpArray[i * 4 + 3] = 1.0;
			}
			this.audioInput.inputWave = tmpArray;
			this.resetAndJob();
			this.page.loop();
			this.audioOutput.frameBuffer.read(tmpArray)
			for (let i = 0; i < output.length; i++) {
				output[i] = tmpArray[i * 4 + 0];
			}
		});
		document.addEventListener("click", () => {
			this.audio.clickEvent();
		}, false);
	}
	add(component){
		const ret = super.add(component);
		component.addEventListener("DOWN", e => {
			this.activeNode = e.component;
			this.editorElement.style["display"] = "none";
			if (this.childs[0].hasOwnProperty("compileState")) {
				this.editorElement.style["display"] = "inline";
				this.editor.setValue(this.activeNode.compileState.code);
				this.editor.gotoLine(1, 0);
			}
		});
		return ret;
	}
};

const OriginalPageEvent = class extends PageEvent {
	constructor() {
		super();
		this.nodeCanvas = null;
	}
	init(page) {
		this.nodeCanvas = page.addComponent(new NodeCanvasExt(page));
		let node1 = this.nodeCanvas.add(new ShaderNode("copy", 30 + 250 * 1, 150, 500));
		node1.setCode(
`precision highp float;
uniform sampler2D texture;
uniform ivec2 texture_resolution;
varying vec2 vUv;

void main(void){
	vec2 area = vec2(
		float(texture_resolution.x) / exp2(ceil(log2(float(texture_resolution.x)))),
		float(texture_resolution.y) / exp2(ceil(log2(float(texture_resolution.y))))
	);
	vec2 p = vUv;
	p.x = p.x * float(texture_resolution.x - 1) / float(texture_resolution.x);
	float wave = 0.0;
	for(int i = 0; i < 128; i++) {
		int a = int(texture2D(texture, vec2(float(i) / 127.0, 0.0)).r);
		float hz = 440.0 * pow(2.0, (float(i) - 69.0) / 12.0);
		float len = 44100.0;
		float pi = 3.14159265;
		float t = texture2D(texture, vec2(float(i) / 127.0, 0.0)).g;
		if (a == 1) wave += (0.2) * sin(hz * 2.0 * pi * 1024.0 * (t + p.x) / len);
	}
	gl_FragColor = vec4(wave, 0.0, 0.0, 1.0);
}`
		);

		node1.inputs.childs[0].output = this.nodeCanvas.midiInput.outputs.childs[0];
		node1.inputs.childs[1].output = this.nodeCanvas.audioInput.outputs.childs[1];
		this.nodeCanvas.audioOutput.inputs.childs[0].output = node1.outputs.childs[0];
	}
	dropFiles(page, files) { console.log(files); }
};

const page = new Page(new OriginalPageEvent(), false);