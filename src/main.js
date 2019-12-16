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
			if (this.audioOutput.frameBuffer.isDeleted() === false) {
				this.audioOutput.frameBuffer.read(tmpArray)
				for (let i = 0; i < output.length; i++) {
					output[i] = tmpArray[i * 4 + 0];
				}
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
		this.nodeCanvas.childs.concat().filter(x => !(x instanceof AudioInputNode)).forEach((node) => {this.nodeCanvas.remove(node)});
		this.nodeCanvas.add(new CreateEmptyNodeButton(280, 330));
	}
	dropFiles(page, files) {
		for(let i = 0; i < files.length; i++) {
			if (
				(!this.nodeCanvas) ||
				(!this.nodeCanvas.audio) ||
				(!this.nodeCanvas.audio.start)
			) continue;
			const url = URL.createObjectURL(files[i]);
			this.nodeCanvas.audio.loadSound(url, (e) => {
				this.nodeCanvas.add(new AudioBufferNode(files[i].name, 30, 30, e));
			}, (e) => {
				this.nodeCanvas.add(new PictureNode(files[i].name, url, 30, 30));
			});
		}
	}
};

const page = new Page(new OriginalPageEvent());
