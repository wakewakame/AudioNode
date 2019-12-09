import { HydrangeaJS } from "../3rdparty/HydrangeaJS/src/hydrangea.js";
import { Midi } from "./midi.js";
import { AudioBufferNode, AudioInputNode, AudioOutputNode, MidiInputNode } from "./audio_nodes.js";
import { CreateEmptyNodeButton } from "./util_nodes.js";
import { LatencyFrameNode } from "./util_nodes.js";

const Page = HydrangeaJS.GUI.Page.Page;
const PageEvent = HydrangeaJS.GUI.Page.PageEvent;
const NodeCanvas = HydrangeaJS.GUI.Templates.NodeCanvas;
const TimeNode = HydrangeaJS.Extra.ShaderNode.TimeNode;
const PictureNode = HydrangeaJS.Extra.ShaderNode.PictureNode;
const ShaderNode = HydrangeaJS.Extra.ShaderNode.ShaderNode;
const FrameNode = HydrangeaJS.Extra.ShaderNode.FrameNode;
const ValueNode = HydrangeaJS.Extra.ShaderNode.ValueNode;
const Audio = HydrangeaJS.Extra.Audio.Audio;

// set fir length
const w_length = "1024.0";
const f_length = "32.0";

const nodesToJson = (node_array) => {
	let id_counter = 0;
	let result = [];
	let input_params = [];
	let output_params = [];

	Object.values(node_array).forEach((node) => {
		let node_json = {};
		node_json["name"] = node.name;
		node_json["type"] = node.type;
		node_json["x"] = node.x;
		node_json["y"] = node.y;
		node_json["w"] = node.w;
		node_json["h"] = node.h;
		node_json["text"] = "";
		if (node.hasOwnProperty("compileState")) {
			node_json["text"] = node.compileState.code;
		}
		node_json["inputs"] = [];
		Object.values(node.inputs.childs).forEach((input) => {
			let param = {};
			param["name"] = input.name;
			param["type"] = input.type;
			param["output_id"] = "-1";
			input_params.push({"param": param, "instance": input.output});
			node_json["inputs"].push(param);
		});
		node_json["outputs"] = [];
		Object.values(node.outputs.childs).forEach((output) => {
			let param = {};
			param["name"] = output.name;
			param["type"] = output.type;
			param["id"] = id_counter.toString(10);
			id_counter++;
			node_json["outputs"].push(param);
			output_params.push({"param": param, "instance": output});
		});
		result.push(node_json);
	});

	for(let input of input_params) {
		for(let output of output_params) {
			if (input["instance"] === output["instance"]) {
				input["param"]["output_id"] = output["param"]["id"];
				break;
			}
		}
	}

	return JSON.stringify(result);
};

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
		this.audio = new Audio(parseInt(w_length));
		this.midi = new Midi();
		this.audioInput = this.add(new AudioInputNode(30, 30, this.audio.array_length));
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
			this.audioOutput.frameBuffer.read(tmpArray)
			for (let i = 0; i < output.length; i++) {
				output[i] = tmpArray[i * 4 + 0];
			}
		});
		document.addEventListener("click", () => {
			this.audio.clickEvent();

			this.audio.loadSound("/dst/music.mp3", (e) => {
				if (this.childs.filter(x => (x instanceof AudioBufferNode)).length === 0) {
					const audioBufferNode = this.add(new AudioBufferNode("hoge music", 30, 30, e));
					const shader_1 = this.childs.filter(x => (x.name === "shader_1"))[0];
					shader_1.inputs.childs[0].output = audioBufferNode.outputs.childs[0];
					shader_1.inputs.childs[1].output = audioBufferNode.outputs.childs[1];
				}
			}, (e) => console.log(e));
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

		/*
		let node1 = this.nodeCanvas.add(new ShaderNode("copy", 30 + 250 * 1, 150, 500));
		this.nodeCanvas.add(new CreateEmptyNodeButton(280, 330));
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
	float wave = 0.0;
	for(int i = 0; i < 128; i++) {
		vec4 key = texture2D(texture, vec2(float(i) / 127.0, 0.0));
		float hz = 440.0 * pow(2.0, (float(i) - 69.0) / 12.0);
		float len = 44100.0;
		float pi = 3.14159265;
		if (key.r != 0.0) wave += 0.3 * key.r * sin(hz * 2.0 * pi * 1024.0 * (key.g + p.x) / len);
	}
	gl_FragColor = vec4(wave, 0.0, 0.0, 1.0);
}`
		);
		node1.inputs.childs[0].output = this.nodeCanvas.midiInput.outputs.childs[0];
		node1.inputs.childs[1].output = this.nodeCanvas.audioInput.outputs.childs[1];
		this.nodeCanvas.audioOutput.inputs.childs[0].output = node1.outputs.childs[0];
*/
		
		// delete default nodes
		//this.nodeCanvas.childs.concat().forEach((n) => {this.nodeCanvas.remove(n);});

		// add CreateEmptyNodeButton
		this.nodeCanvas.add(new CreateEmptyNodeButton(280, 330));

		// add time node
		const time1 = this.nodeCanvas.add(new TimeNode(20, 20)); time1.resize(0, 0);

		// add frequency characteristic generator
		const shader1 = this.nodeCanvas.add(new ShaderNode("shader1", 120, 20));
		shader1.setCode(
`precision highp float;
uniform float time;
varying vec2 vUv;

void main(void){
    float p = 0.0;
    if (vUv.x < mod(time * 0.3, 1.0)) p = 1.0;
	gl_FragColor = vec4(p, 0.0, 0.0, 1.0);
}`
		); shader1.resize(0, 0); shader1.inputs.childs[0].output = time1.outputs.childs[0];
		const size1 = this.nodeCanvas.add(new ValueNode("ivec2", "size1", 120, 170));
		size1.setCode(
`{
	"x": `+f_length+`,
	"y": 1.0
}`
		); size1.resize(0, 0);
		const frame1 = this.nodeCanvas.add(new FrameNode("frame1", 320, 20, 1, 1, this.nodeCanvas.graphics.gapp.gl.RGBA, this.nodeCanvas.graphics.gapp.gl.FLOAT));
		frame1.inputs.childs[0].output = shader1.outputs.childs[0];
		frame1.inputs.childs[1].output = size1.outputs.childs[0];

		// add DFT processor 1
		const shader2 = this.nodeCanvas.add(new ShaderNode("shader2", 620, 20));
		shader2.setCode(
`precision highp float;
uniform sampler2D audio;
varying vec2 vUv;
varying vec4 vColor;

const float sample_rate = `+f_length+`;
int samples = int(sample_rate);
float hz1 = 0.0;
float hz2 = sample_rate * 0.5;

const float PI = 3.14159265358979;

vec2 iexp(float theta) {
    return vec2(cos(theta), sin(theta));
}

void main(void){
	float wave = texture2D(audio, vec2(vUv.y, 0.0)).r;
	float hz = hz1 * (1.0 - vUv.x) + hz2 * vUv.x;
	vec2 dft = wave * iexp(0.0 - hz * (vUv.y * float(samples) / float(sample_rate)) * (2.0 * PI));
	gl_FragColor = vec4(dft, 0.0, 1.0);
}`
		); shader2.resize(0, 0); shader2.inputs.childs[0].output = frame1.outputs.childs[0];
		const size2 = this.nodeCanvas.add(new ValueNode("ivec2", "size2", 620, 170));
		size2.setCode(
`{
	"x": `+f_length+`,
	"y": `+f_length+`
}`
		); size2.resize(0, 0);
		const frame2 = this.nodeCanvas.add(new FrameNode("frame2", 820, 20, 1, 1, this.nodeCanvas.graphics.gapp.gl.RGBA, this.nodeCanvas.graphics.gapp.gl.FLOAT));
		frame2.inputs.childs[0].output = shader2.outputs.childs[0];
		frame2.inputs.childs[1].output = size2.outputs.childs[0];

		// add DFT processor 2
		const shader3 = this.nodeCanvas.add(new ShaderNode("shader3", 1120, 20));
		shader3.setCode(
`precision highp float;
uniform sampler2D texture;
varying vec2 vUv;

const float len = `+f_length+`;

void main(void){
    vec2 sum = vec2(0.0);
    for(int i = 0; i < int(len); i++) {
        vec2 p = vec2(vUv.x, (float(i) + 0.5) / len);
        sum += texture2D(texture, p).rg;
    }
    sum /= len;
	gl_FragColor = vec4(sum, 0.0, 1.0);
}`
		); shader3.resize(0, 0); shader3.inputs.childs[0].output = frame2.outputs.childs[0];
		const size3 = this.nodeCanvas.add(new ValueNode("ivec2", "size3", 1120, 170));
		size3.setCode(
`{
	"x": `+f_length+`,
	"y": 1.0
}`
		); size3.resize(0, 0);
		const frame3 = this.nodeCanvas.add(new FrameNode("frame3", 1320, 20, 1, 1, this.nodeCanvas.graphics.gapp.gl.RGBA, this.nodeCanvas.graphics.gapp.gl.FLOAT));
		frame3.inputs.childs[0].output = shader3.outputs.childs[0];
		frame3.inputs.childs[1].output = size3.outputs.childs[0];

		// add IDFT processor 1
		const shader4 = this.nodeCanvas.add(new ShaderNode("shader4", 1620, 20));
		shader4.setCode(
`precision highp float;
uniform sampler2D audio;
uniform sampler2D audio2;
varying vec2 vUv;
varying vec4 vColor;

void main(void){
	vec2 wave = texture2D(audio, vec2(vUv.y, 0.0)).rg;
	float output_wave = wave.r;
	output_wave *= texture2D(audio2, vUv).r;
	gl_FragColor = vec4(output_wave, 0.0, 0.0, 1.0);
}`
		); shader4.resize(0, 0); shader4.inputs.childs[0].output = frame3.outputs.childs[0];
		const size4 = this.nodeCanvas.add(new ValueNode("ivec2", "size4", 1620, 170));
		size4.setCode(
`{
	"x": `+w_length+`,
	"y": `+f_length+`
}`
		); size4.resize(0, 0);
		const frame4 = this.nodeCanvas.add(new FrameNode("frame4", 1820, 20, 1, 1, this.nodeCanvas.graphics.gapp.gl.RGBA, this.nodeCanvas.graphics.gapp.gl.FLOAT));
		frame4.inputs.childs[0].output = shader4.outputs.childs[0];
		frame4.inputs.childs[1].output = size4.outputs.childs[0];

		// add IDFT processor 2
		const shader5 = this.nodeCanvas.add(new ShaderNode("shader5", 2120, 20));
		shader5.setCode(
`precision highp float;
uniform sampler2D texture;
varying vec2 vUv;

const float len = `+f_length+`;

void main(void){
    vec2 sum = vec2(0.0);
    for(int i = 0; i < int(len); i++) {
        vec2 p = vec2(vUv.x, (float(i) + 0.5) / len);
        sum += texture2D(texture, p).rg;
    }
	gl_FragColor = vec4(sum, 0.0, 1.0);
}`
		); shader5.resize(0, 0); shader5.inputs.childs[0].output = frame4.outputs.childs[0];
		const size5 = this.nodeCanvas.add(new ValueNode("ivec2", "size5", 2120, 170));
		size5.setCode(
`{
	"x": `+w_length+`,
	"y": 1.0
}`
		); size5.resize(0, 0);
		const frame5 = this.nodeCanvas.add(new FrameNode("frame5", 2320, 20, 1, 1, this.nodeCanvas.graphics.gapp.gl.RGBA, this.nodeCanvas.graphics.gapp.gl.FLOAT));
		frame5.inputs.childs[0].output = shader5.outputs.childs[0];
		frame5.inputs.childs[1].output = size5.outputs.childs[0];

		// add preview 1
		const shader6 = this.nodeCanvas.add(new ShaderNode("shader6", 620, 320));
		shader6.setCode(
`precision highp float;
uniform sampler2D texture;
varying vec2 vUv;

void main(void){
    vec2 cs = texture2D(texture, vUv).rg;
    float wave = sqrt(cs.x * cs.x + cs.y * cs.y);
    float g = (vUv.y > wave) ? 1.0 : 0.0;
	gl_FragColor = vec4(vec3(g), 1.0);
}`
		); shader6.resize(0, 0); shader6.inputs.childs[0].output = frame1.outputs.childs[0];
		const size6 = this.nodeCanvas.add(new ValueNode("ivec2", "size6", 620, 490));
		size6.setCode(
`{
	"x": `+f_length+`,
	"y": `+f_length+`
}`
		); size6.resize(0, 0);
		const frame6 = this.nodeCanvas.add(new FrameNode("frame6", 820, 320, 1, 1, this.nodeCanvas.graphics.gapp.gl.RGBA, this.nodeCanvas.graphics.gapp.gl.FLOAT));
		frame6.inputs.childs[0].output = shader6.outputs.childs[0];
		frame6.inputs.childs[1].output = size6.outputs.childs[0];

		// add preview 2
		const shader7 = this.nodeCanvas.add(new ShaderNode("shader7", 1620, 320));
		shader7.setCode(
`precision highp float;
uniform sampler2D texture;
varying vec2 vUv;

void main(void){
    vec2 cs = texture2D(texture, vUv).rg;
    float wave = sqrt(cs.x * cs.x + cs.y * cs.y);
    float g = (vUv.y > wave) ? 1.0 : 0.0;
	gl_FragColor = vec4(vec3(g), 1.0);
}`
		); shader7.resize(0, 0); shader7.inputs.childs[0].output = frame3.outputs.childs[0];
		const size7 = this.nodeCanvas.add(new ValueNode("ivec2", "size7", 1620, 490));
		size7.setCode(
`{
	"x": `+f_length+`,
	"y": `+f_length+`
}`
		); size7.resize(0, 0);
		const frame7 = this.nodeCanvas.add(new FrameNode("frame7", 1820, 320, 1, 1, this.nodeCanvas.graphics.gapp.gl.RGBA, this.nodeCanvas.graphics.gapp.gl.FLOAT));
		frame7.inputs.childs[0].output = shader7.outputs.childs[0];
		frame7.inputs.childs[1].output = size7.outputs.childs[0];

		// add preview 3
		const shader8 = this.nodeCanvas.add(new ShaderNode("shader8", 2620, 320));
		shader8.setCode(
`precision highp float;
uniform sampler2D texture;
varying vec2 vUv;

void main(void){
    vec2 cs = texture2D(texture, vUv).rg;
    float wave = cs.x;
    float g = (vUv.y > wave) ? 1.0 : 0.0;
	gl_FragColor = vec4(vec3(g), 1.0);
}`
		); shader8.resize(0, 0); shader8.inputs.childs[0].output = frame5.outputs.childs[0];
		const size8 = this.nodeCanvas.add(new ValueNode("ivec2", "size8", 2620, 490));
		size8.setCode(
`{
	"x": `+w_length+`,
	"y": `+w_length+`
}`
		); size8.resize(0, 0);
		const frame8 = this.nodeCanvas.add(new FrameNode("frame8", 2820, 320, 1, 1, this.nodeCanvas.graphics.gapp.gl.RGBA, this.nodeCanvas.graphics.gapp.gl.FLOAT));
		frame8.inputs.childs[0].output = shader8.outputs.childs[0];
		frame8.inputs.childs[1].output = size8.outputs.childs[0];

		const shader_2 = this.nodeCanvas.add(new ShaderNode("shader_2", 1120, -220));
		shader_2.setCode(
`precision highp float;
uniform sampler2D current;
uniform sampler2D back;
varying vec2 vUv;

const float w_len = `+w_length+`;
const float f_len = `+f_length+`;

void main(void){
    float index = vUv.x - (vUv.y * f_len / w_len);
    float wave = 0.0;
    if (index < 0.0) {
        index += 1.0;
        wave = texture2D(back, vec2(index, 0.0)).r;
    }
    else {
        wave = texture2D(current, vec2(index, 0.0)).r;
    }
	gl_FragColor = vec4(wave, 0.0, 0.0, 1.0);
}`
		); shader_2.resize(0, 0);
		const size_2 = this.nodeCanvas.add(new ValueNode("ivec2", "size_2", 1120, -70));
		size_2.setCode(
`{
	"x": `+w_length+`,
	"y": `+f_length+`
}`
		); size_2.resize(0, 0);
		const frame_2 = this.nodeCanvas.add(new FrameNode("frame_2", 1320, -220, 1, 1, this.nodeCanvas.graphics.gapp.gl.RGBA, this.nodeCanvas.graphics.gapp.gl.FLOAT));
		frame_2.inputs.childs[1].output = size_2.outputs.childs[0];

		const shader_1 = this.nodeCanvas.add(new ShaderNode("shader_1", 620, -220));
		shader_1.setCode(
`precision highp float;
uniform sampler2D audio;
uniform ivec2 audio_resolution;
uniform sampler2D midi;
varying vec2 vUv;

const float w_len = `+w_length+`;

float read(float f_index){
	float index = floor(f_index * w_len);
	vec2 pos = vec2(
		floor(mod(index, 4096.0 * 4.0)) / (4.0 * 4096.0),
		1.0 - floor(index / (4096.0 * 4.0)) / 4096.0
	);
	vec4 wave = texture2D(audio, pos);
	if (mod(index, 4.0) == 0.0) return wave.r;
	if (mod(index, 4.0) == 1.0) return wave.g;
	if (mod(index, 4.0) == 2.0) return wave.b;
	if (mod(index, 4.0) == 3.0) return wave.a;
	return 0.0;
}

void main(void){
	vec2 area = vec2(
		float(audio_resolution.x) / exp2(ceil(log2(float(audio_resolution.x)))),
		float(audio_resolution.y) / exp2(ceil(log2(float(audio_resolution.y))))
	);
	vec2 p = vUv;
	float wave = 0.0;
	for(int i = 0; i < 128; i++) {
		vec4 key = texture2D(midi, vec2(float(i) / 127.0, 0.0));
		float hz = 440.0 * pow(2.0, (float(i) - 69.0) / 12.0);
		float len = 44100.0;
		float pi = 3.14159265;
		if (key.r != 0.0) {
			wave += read(p.x + key.g);
			//wave += 0.1 * key.r * sin(hz * 2.0 * pi * 1024.0 * (key.g + p.x) / len);
		}
	}
	gl_FragColor = vec4(wave, 0.0, 0.0, 1.0);
}`
		); shader_1.resize(0, 0);
		const size_1 = this.nodeCanvas.add(new ValueNode("ivec2", "size_1", 620, -70));
		size_1.setCode(
`{
	"x": `+w_length+`,
	"y": 1.0
}`
		); size_1.resize(0, 0);
		const frame_1 = this.nodeCanvas.add(new FrameNode("frame_1", 820, -420, 1, 1, this.nodeCanvas.graphics.gapp.gl.RGBA, this.nodeCanvas.graphics.gapp.gl.FLOAT));
		frame_1.inputs.childs[1].output = size_1.outputs.childs[0];
		const l_frame_1 = this.nodeCanvas.add(new LatencyFrameNode("l_frame_1", 820, -220, 1, 1, this.nodeCanvas.graphics.gapp.gl.RGBA, this.nodeCanvas.graphics.gapp.gl.FLOAT));
		l_frame_1.inputs.childs[1].output = size_1.outputs.childs[0];

		const audioInputNode = this.nodeCanvas.childs.filter(x => (x instanceof AudioInputNode))[0];
		const audioOutputNode = this.nodeCanvas.childs.filter(x => (x instanceof AudioOutputNode))[0];
		const midiInputNode = this.nodeCanvas.childs.filter(x => (x instanceof MidiInputNode))[0];
		audioInputNode.target = {"x": 320, "y": -220};
		audioOutputNode.target = {"x": 2320, "y": -120};
		frame_2.inputs.childs[0].output = shader_2.outputs.childs[0];
		shader_2.inputs.childs[0].output = frame_1.outputs.childs[0];
		shader_2.inputs.childs[1].output = l_frame_1.outputs.childs[0];
		frame_1.inputs.childs[0].output = shader_1.outputs.childs[0];
		l_frame_1.inputs.childs[0].output = shader_1.outputs.childs[0];
		shader_1.inputs.childs[2].output = midiInputNode.outputs.childs[0];
		shader4.inputs.childs[1].output = frame_2.outputs.childs[0];
		audioOutputNode.inputs.childs[0].output = shader5.outputs.childs[0];
	}
	dropFiles(page, files) {
		for(let i = 0; i < files.length; i++) {
			if (
				(!this.nodeCanvas) ||
				(!this.nodeCanvas.audio) ||
				(!this.nodeCanvas.audio.start)
			) continue;
			this.nodeCanvas.audio.loadSound(URL.createObjectURL(files[i]), (e) => {
				this.nodeCanvas.add(new AudioBufferNode(files[i].name, 30, 30, e));
			}, (e) => console.log(e));
		}
	}
};

const page = new Page(new OriginalPageEvent());
