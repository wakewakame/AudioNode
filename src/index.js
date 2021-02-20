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
	constructor(page) {
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
	}
	setup(){
		this.audio = new Audio();
		this.midi = new Midi();
		this.audioInput  = this.add(new AudioInputNode(30, 30, this.audio.array_length));
		this.audioOutput = this.add(new AudioOutputNode(530, 30));
		this.midiInput   = this.add(new MidiInputNode(30, 230, this.midi));
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
		this.nodeCanvas = page.addComponent(new NodeCanvasExt(page));

		let node1 = this.nodeCanvas.add(new ShaderAndFrameNode("copy", 30 + 250 * 1, 150, 500));

		this.nodeCanvas.add(new CreateEmptyNodeButton(280, 330));

		node1.setCode(
`{
	"name": "MIDI to Sin",
	"code": "
		precision highp float;
		uniform sampler2D input_frame;
		uniform vec2 input_frame_area;
		varying vec2 v_uv;
		
		void main(void){
			vec2 p = v_uv * input_frame_area;
			float wave = 0.0;
			for(int i = 0; i < 128; i++) {
				vec4 key = texture2D(input_frame, vec2(float(i) / 127.0, 0.0));
				float hz = 440.0 * pow(2.0, (float(i) - 69.0) / 12.0);
				float len = 44100.0;
				float pi = 3.14159265;
				if (key.r != 0.0) wave += 0.3 * key.r * sin(hz * 2.0 * pi * 1024.0 * (key.g + p.x) / len);
			}
			gl_FragColor = vec4(wave - 0.0, 0.0, 0.0, 1.0);
		}
	",
	"output_width": 1024,
	"output_height": 1,
	"output_type": "FLOAT",
	"preview": "
		precision highp float;
		uniform sampler2D output_frame;
		uniform vec2 output_frame_area;
		varying vec2 v_uv;
		
		void main(void){
			vec2 p = v_uv * output_frame_area;
			float wave = texture2D(output_frame, p).r / 2.0;
			p.y = (p.y * 2.0) - 1.0;
			float g = (p.y > wave) ? 1.0 : 0.0;
			gl_FragColor = vec4(vec3(g), 1.0);
		}
	"
}`
		);

		//node1.setInput(this.nodeCanvas.midiInput, "output frame", "input_frame");
		//this.nodeCanvas.audioOutput.setInput(node1, "output frame", "input frame");

		console.log(JSON.stringify(this.nodeCanvas.save()));

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
			}, console.log);
		}
	}
};

const page = new Page(new OriginalPageEvent());
