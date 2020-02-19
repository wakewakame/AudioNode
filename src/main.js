import { HydrangeaJS } from "../3rdparty/HydrangeaJS/src/hydrangea.js";
import { Midi } from "./midi.js";
import { AudioBufferNode, AudioInputNode, AudioOutputNode, MidiInputNode } from "./audio_nodes.js";
import { CreateEmptyNodeButton } from "./util_nodes.js";

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
				if (this.childs[0].json["custom"].hasOwnProperty("compileState")) {
					const code = this.editor.getValue();
					if (
						code !== "" &&
						code !== this.childs[0].json["custom"].compileState.code
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
		this.audio = new Audio();
		this.midi = new Midi();
		this.audioInput = this.add(new AudioInputNode(30, 30, this.audio.array_length));
		this.audioOutput = this.add(new AudioOutputNode(530, 30));
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
			this.audioOutput.read(tmpArray)
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
			if (this.childs[0].json["custom"].hasOwnProperty("compileState")) {
				this.editorElement.style["display"] = "inline";
				this.editor.setValue(this.activeNode.json["custom"].compileState.code);
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

		this.nodeCanvas.load([{"unique_id":0,"type":"audio input frame","name":"audio input","x":30,"y":30,"w":140,"h":24,"inpus":[],"custom":{"frameBufferState":{"width":1024,"height":1,"format":6408,"type":5126},"array_length":1024},"inputs":[]},{"unique_id":1,"type":"audio output frame","name":"audio output","x":530,"y":30,"w":140,"h":24,"inpus":[],"custom":{},"inputs":[{"srcNodeId":0,"srcParamName":"output frame","thisParamName":"input frame"}]},{"unique_id":2,"type":"midi input frame","name":"midi input","x":30,"y":230,"w":140,"h":24,"inpus":[],"custom":{"frameBufferState":{"width":128,"height":1,"format":6408,"type":5126}},"inputs":[]},{"unique_id":3,"type":"filter","name":"copy","x":280,"y":150,"w":140,"h":24,"inpus":[],"custom":{"frameBufferState":{"width":512,"height":512,"type":5121},"compileState":{"initialized":true,"lastChangeTime":1582155617967,"isCompiled":false,"code":"{\n\t\"code\": \"\n\t\tprecision highp float;\n\t\tuniform sampler2D input_frame;\n\t\tuniform vec2 input_frame_area;\n\t\tvarying vec2 v_uv;\n\t\t\n\t\tvoid main(void){\n\t\t\tvec2 p = v_uv * input_frame_area;\n\t\t\tfloat wave = 0.0;\n\t\t\tfor(int i = 0; i < 128; i++) {\n\t\t\t\tvec4 key = texture2D(input_frame, vec2(float(i) / 127.0, 0.0));\n\t\t\t\tfloat hz = 440.0 * pow(2.0, (float(i) - 69.0) / 12.0);\n\t\t\t\tfloat len = 44100.0;\n\t\t\t\tfloat pi = 3.14159265;\n\t\t\t\tif (key.r != 0.0) wave += 0.3 * key.r * sin(hz * 2.0 * pi * 1024.0 * (key.g + p.x) / len);\n\t\t\t}\n\t\t\tgl_FragColor = vec4(wave - 0.0, 0.0, 0.0, 1.0);\n\t\t}\n\t\",\n\t\"output_width\": 1024,\n\t\"output_height\": 1,\n\t\"output_type\": \"FLOAT\",\n\t\"preview\": \"\n\t\tprecision highp float;\n\t\tuniform sampler2D output_frame;\n\t\tuniform vec2 output_frame_area;\n\t\tvarying vec2 v_uv;\n\t\t\n\t\tvoid main(void){\n\t\t\tvec2 p = v_uv * output_frame_area;\n\t\t\tfloat wave = texture2D(output_frame, p).r / 2.0;\n\t\t\tp.y = (p.y * 2.0) - 1.0;\n\t\t\tfloat g = (p.y > wave) ? 1.0 : 0.0;\n\t\t\tgl_FragColor = vec4(vec3(g), 1.0);\n\t\t}\n\t\"\n}","error":"","latency":500}},"inputs":[{"srcNodeId":2,"srcParamName":"output frame","thisParamName":"input_frame"}]},{"unique_id":4,"type":"create","name":"💪😀💪やぁ","x":280,"y":330,"w":140,"h":24,"inpus":[],"custom":{},"inputs":[]}]);

		/*
		let node1 = this.nodeCanvas.add(new ShaderAndFrameNode("copy", 30 + 250 * 1, 150, 500));

		this.nodeCanvas.add(new CreateEmptyNodeButton(280, 330));

		node1.setCode(
`{
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

		node1.setInput(this.nodeCanvas.midiInput, "output frame", "input_frame");
		this.nodeCanvas.audioOutput.setInput(node1, "output frame", "input frame");

		console.log(JSON.stringify(this.nodeCanvas.save()));
		*/
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
