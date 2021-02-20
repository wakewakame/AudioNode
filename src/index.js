import { HydrangeaJS } from "../3rdparty/HydrangeaJS/src/index.js";
import { Midi } from "./midi.js";
import { AudioBufferNode, AudioInputNode, AudioOutputNode, MidiInputNode } from "./audio_nodes.js";
import { CreateEmptyNodeButton } from "./util_nodes.js";

const Component = HydrangeaJS.GUI.Component.Component;
const Page = HydrangeaJS.GUI.Page.Page;
const PageEvent = HydrangeaJS.GUI.Page.PageEvent;
const ConvertibleNodeCanvas = HydrangeaJS.GUI.Templates.ConvertibleNodeCanvas;
const ConvertibleNode = HydrangeaJS.GUI.Templates.ConvertibleNode;
const TimeNode = HydrangeaJS.Extra.ShaderNode.TimeNode;
const PictureNode = HydrangeaJS.Extra.ShaderNode.PictureNode;
const ShaderNode = HydrangeaJS.Extra.ShaderNode.ShaderNode;
const FrameNode = HydrangeaJS.Extra.ShaderNode.FrameNode;
const ShaderAndFrameNode = HydrangeaJS.Extra.ShaderNode.ShaderAndFrameNode;
const ValueNode = HydrangeaJS.Extra.ShaderNode.ValueNode;
const ValueNodeParam = HydrangeaJS.Extra.ShaderNode.ValueNodeParam;
const Audio = HydrangeaJS.Extra.Audio.Audio;
const monaco = HydrangeaJS.monaco;

const NodeCanvasExt = class extends ConvertibleNodeCanvas{
	constructor(page, json = []) {
		super({
			"empty": ConvertibleNode,
			"frame": FrameNode,
			"image": PictureNode,
			"shader": ShaderNode,
			"filter": ShaderAndFrameNode,
			"time": TimeNode,
			"int": ValueNode,
			"float": ValueNode,
			"ivec2": ValueNode,
			"vec2": ValueNode,
			"ivec3": ValueNode,
			"vec3": ValueNode,
			"ivec4": ValueNode,
			"vec4": ValueNode
		});
		this.page = page;
		this.activeNode = null;
		this.editorElement = this.page.addElement("div", 0.0, 0.5, 1.0, 1.0, {
			"background": "#FFFFFF80",
			"display": "none",
			"width": "100%",
			"height": "100%",
		});
		this.editor = monaco.editor.create(this.editorElement, {
			value: "",
			language: "text",
			fontSize: "14px",
		});

		this.editor.onDidChangeModelContent(e => {
			if (this.childs.length > 0) {
				if (this.childs[0].json["custom"].hasOwnProperty("compileState")) {
					const code = this.editor.getValue();
					if (
						code !== "" &&
						code !== this.childs[0].json["custom"].compileState.code
					) this.childs[0].setCode(code);
				}
			}
		});
		this.addEventListener("DOWN", _ => {
			this.activeNode = null;
			this.editorElement.style["display"] = "none";
		});
		this.audio = null;
		this.audioInput = null;
		this.audioOutput = null;
		this.createButton = null;
		this.json = json;
	}
	setup(){
		this.audio = new Audio();
		this.midi = new Midi();
		this.audioInput = this.add(new AudioInputNode(30, 30, this.audio.array_length));
		this.audioOutput = this.add(new AudioOutputNode(530, 30));
		this.midiInput = this.add(new MidiInputNode(30, 230, this.midi));
		this.createButton = this.add(new CreateEmptyNodeButton(280, 330));
		const audioInputJson = this.json.filter(n => n["type"] === ("audio input frame"));
		if (audioInputJson.length === 1) {
			this.audioInput.load(audioInputJson[0]);
		}
		const audioOutputJson = this.json.filter(n => n["type"] === ("audio output frame"));
		if (audioOutputJson.length === 1) {
			this.audioOutput.load(audioOutputJson[0]);
		}
		const midiInputJson = this.json.filter(n => n["type"] === ("midi input frame"));
		if (midiInputJson.length === 1) {
			this.midiInput.load(midiInputJson[0]);
		}
		const createButtonJson = this.json.filter(n => n["type"] === ("create"));
		if (createButtonJson.length === 1) {
			this.createButton.load(createButtonJson[0]);
		}
		this.load(this.json);
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
			this.audioOutput.read(tmpArray)
			for (let i = 0; i < output.length; i++) {
				output[i] = tmpArray[i * 4 + 0];
			}
		});
		document.addEventListener("click", () => {
			this.audio.clickEvent();
			console.log(JSON.stringify(this.save()));
		}, false);
	}
	add(component){
		const ret = super.add(component);
		component.addEventListener("DOWN", e => {
			this.activeNode = e.component;
			this.editorElement.style["display"] = "none";
			if (this.childs[0].json["custom"].hasOwnProperty("compileState")) {
				this.editorElement.style["display"] = "inline";
				this.editor.layout();
				this.editor.getModel().setValue(this.activeNode.json["custom"].compileState.code);
				this.editor.revealLine(0);
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
		const json = 
[
	{
		"unique_id":0,
		"type":"audio input frame",
		"name":"audio input",
		"x":30,
		"y":30,
		"w":140,
		"h":140,
		"custom":{
			"frameBufferState":{
				"width":1024,
				"height":1,
				"format":6408,
				"type":5126
			},
			"array_length":1024
		},
		"inputs":[]
	},
	{
		"unique_id":1,
		"type":"audio output frame",
		"name":"audio output",
		"x":530,
		"y":30,
		"w":140,
		"h":140,
		"inputs":[],
		"custom":{},
	},
	{
		"unique_id":2,
		"type":"midi input frame",
		"name":"midi input",
		"x":30,
		"y":230,
		"w":140,
		"h":100,
		"custom":{
			"frameBufferState":{
				"width":128,
				"height":1,
				"format":6408,
				"type":5126
			}
		},
		"inputs":[]
	},
	{
		"unique_id":3,
		"type":"create",
		"name":"クリックで新しいノードを追加",
		"x":30,
		"y":390,
		"w":280,
		"h":100,
		"inpus":[],
		"custom":{},
		"inputs":[]
	}
];

		this.nodeCanvas = page.addComponent(new NodeCanvasExt(page, json));

		console.log(JSON.stringify(this.nodeCanvas.save()));
	}
	dropFiles(page, files) {
		if (
			(!this.nodeCanvas) ||
			(!this.nodeCanvas.audio) ||
			(!this.nodeCanvas.audio.start)
		) return;
		for(let i = 0; i < files.length; i++) {
			const url = URL.createObjectURL(files[i]);
			const name = files[i].name;
			this.nodeCanvas.audio.loadSound(url, (e) => {
				this.nodeCanvas.add(new AudioBufferNode(name, url, 30, 30, e));
			}, () => {
				this.nodeCanvas.add(new PictureNode(name, url, 30, 30));
			});
		}
	}
};

const page = new Page(new OriginalPageEvent());
