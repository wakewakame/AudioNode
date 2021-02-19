import { HydrangeaJS } from "../3rdparty/HydrangeaJS/src/index.js";
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
			value: 'console.log("Hello, world")',
			language: 'text',
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

		//this.nodeCanvas.load([{"unique_id":0,"type":"midi input frame","name":"midi input","x":491.7445373535156,"y":-135.88151550292966,"w":142.69856431189766,"h":137.8424916265285,"inpus":[],"custom":{"frameBufferState":{"width":128,"height":1,"format":6408,"type":5126}},"inputs":[]},{"unique_id":1,"type":"audio frame","name":"music.mp3","x":490.84729003906256,"y":77.01803588867192,"w":140,"h":140.2860613268469,"inpus":[],"custom":{"frameBufferState":{"width":4096,"height":4096,"format":6408,"type":5126}},"inputs":[]},{"unique_id":2,"type":"time","name":"time","x":464.35430908203125,"y":359.5350341796875,"w":40,"h":50,"inpus":[],"custom":{},"inputs":[]},{"unique_id":3,"type":"filter","name":"sigma","x":1558.381744384766,"y":226.14247131347656,"w":140,"h":140.2860613268469,"inpus":[],"custom":{"frameBufferState":{"width":1024,"height":1,"type":5126},"compileState":{"initialized":true,"lastChangeTime":1582248477021,"isCompiled":true,"code":"{\n    \"name\": \"sigma\",\n\t\"output_width\": 1024,\n\t\"output_height\": 1,\n\t\"output_type\": \"FLOAT\",\n\t\"code\": \"\n\n\n\nprecision highp float;\nuniform sampler2D texture;\nvarying vec2 v_uv;\n\nconst float len = 1024.0;\n\nvoid main(void){\n    vec2 sum = vec2(0.0);\n    for(int i = 0; i < int(len); i++) {\n        vec2 p = vec2(v_uv.x, (float(i) + 0.5) / len);\n        sum += texture2D(texture, p).rg;\n    }\n\tgl_FragColor = vec4(sum, 0.0, 1.0);\n}\n\n\n\n\t\",\n\t\"preview\": \"\n\t\tprecision highp float;\n\t\tuniform sampler2D output_frame;\n\t\tuniform vec2 output_frame_area;\n\t\tvarying vec2 v_uv;\n\t\t\n\t\tvoid main(void){\n\t\t\tvec2 p = v_uv * output_frame_area;\n\t\t\tfloat wave = texture2D(output_frame, p).r / 2.0;\n\t\t\tp.y = (p.y * 2.0) - 1.0;\n\t\t\tfloat g = (p.y > wave) ? 1.0 : 0.0;\n\t\t\tgl_FragColor = vec4(vec3(g), 1.0);\n\t\t}\n\t\"\n}","error":"","latency":500}},"inputs":[{"srcNodeId":4,"srcParamName":"output frame","thisParamName":"texture"}]},{"unique_id":4,"type":"filter","name":"convolution","x":1307.6477982754027,"y":163.38116096262385,"w":140,"h":140.2860613268469,"inpus":[],"custom":{"frameBufferState":{"width":1024,"height":1024,"type":5126},"compileState":{"initialized":true,"lastChangeTime":1582248469955,"isCompiled":true,"code":"{\n    \"name\": \"convolution\",\n\t\"output_width\": 1024,\n\t\"output_height\": 1024,\n\t\"output_type\": \"FLOAT\",\n\t\"code\": \"\n\n\n\nprecision highp float;\nuniform sampler2D audio2;\nuniform sampler2D audio;\nvarying vec2 v_uv;\nvarying vec4 v_color;\n\nvoid main(void){\n\tvec2 wave = texture2D(audio, vec2(v_uv.y, 0.0)).rg;\n\tfloat output_wave = wave.r;\n\toutput_wave *= texture2D(audio2, v_uv).r;\n\tgl_FragColor = vec4(output_wave, 0.0, 0.0, 1.0);\n}\n\n\n\n\t\",\n\t\"preview\": \"\n\t\tprecision highp float;\n\t\tuniform sampler2D output_frame;\n\t\tuniform vec4 output_frame_area;\n\t\tvarying vec2 v_uv;\n\n\t\tvoid main(void){\n\t\t\tgl_FragColor = texture2D(output_frame, v_uv * output_frame_area.xy);\n\t\t}\n\t\"\n}","error":"","latency":500}},"inputs":[{"srcNodeId":6,"srcParamName":"output frame","thisParamName":"audio2"},{"srcNodeId":7,"srcParamName":"output frame","thisParamName":"audio"}]},{"unique_id":5,"type":"filter","name":"filter generator","x":826.9661160772579,"y":228.64530394088692,"w":140,"h":140.2860613268469,"inpus":[],"custom":{"frameBufferState":{"width":1024,"height":1024,"type":5126},"compileState":{"initialized":true,"lastChangeTime":1582248464590,"isCompiled":true,"code":"{\n    \"name\": \"filter generator\",\n\t\"output_width\": 1024,\n\t\"output_height\": 1024,\n\t\"output_type\": \"FLOAT\",\n\t\"code\": \"\n\n\n\nprecision highp float;\nuniform sampler2D audio;\nvarying vec2 v_uv;\nvarying vec4 v_color;\n\nconst float sample_rate = 1024.0;\nint samples = int(sample_rate);\nfloat hz1 = 0.0;\nfloat hz2 = sample_rate * 0.5;\n\nconst float PI = 3.14159265358979;\n\nvec2 iexp(float theta) {\n    return vec2(cos(theta), sin(theta));\n}\n\nvoid main(void){\n\tfloat wave = texture2D(audio, vec2(v_uv.y, 0.0)).r;\n\tfloat hz = hz1 * (1.0 - v_uv.x) + hz2 * v_uv.x;\n\tvec2 dft = wave * iexp(0.0 - hz * (v_uv.y * float(samples) / float(sample_rate)) * (2.0 * PI));\n\tgl_FragColor = vec4(dft, 0.0, 1.0);\n}\n\n\n\n\t\",\n\t\"preview\": \"\n\t\tprecision highp float;\n\t\tuniform sampler2D output_frame;\n\t\tuniform vec4 output_frame_area;\n\t\tvarying vec2 v_uv;\n\n\t\tvoid main(void){\n\t\t\tgl_FragColor = texture2D(output_frame, v_uv * output_frame_area.xy);\n\t\t}\n\t\"\n}","error":"","latency":500}},"inputs":[{"srcNodeId":8,"srcParamName":"output frame","thisParamName":"audio"}]},{"unique_id":6,"type":"filter","name":"wave logger","x":1064.9663772583008,"y":61.1641845703125,"w":140,"h":140.2860613268469,"inpus":[],"custom":{"frameBufferState":{"width":1024,"height":1024,"type":5126},"compileState":{"initialized":true,"lastChangeTime":1582248433764,"isCompiled":true,"code":"{\n    \"name\": \"wave logger\",\n\t\"output_width\": 1024,\n\t\"output_height\": 1024,\n\t\"output_type\": \"FLOAT\",\n\t\"code\": \"\n\n\n\nprecision highp float;\nuniform sampler2D current;\nuniform sampler2D back;\nvarying vec2 v_uv;\n\nconst float w_len = 1024.0;\nconst float f_len = 1024.0;\n\nvoid main(void){\n    float index = v_uv.x - (v_uv.y * f_len / w_len);\n    float wave = 0.0;\n    if (index < 0.0) {\n        index += 1.0;\n        wave = texture2D(back, vec2(index, 0.0)).r;\n    }\n    else {\n        wave = texture2D(current, vec2(index, 0.0)).r;\n    }\n\tgl_FragColor = vec4(wave, 0.0, 0.0, 1.0);\n}\n\n\n\n\t\",\n\t\"preview\": \"\n\t\tprecision highp float;\n\t\tuniform sampler2D output_frame;\n\t\tuniform vec4 output_frame_area;\n\t\tvarying vec2 v_uv;\n\n\t\tvoid main(void){\n\t\t\tgl_FragColor = texture2D(output_frame, v_uv * output_frame_area.xy);\n\t\t}\n\t\"\n}","error":"","latency":500}},"inputs":[{"srcNodeId":9,"srcParamName":"output frame","thisParamName":"current"},{"srcNodeId":9,"srcParamName":"previous output frame","thisParamName":"back"}]},{"unique_id":7,"type":"filter","name":"sigma","x":1061.1817092895508,"y":271.64880371093744,"w":140,"h":140.2860613268469,"inpus":[],"custom":{"frameBufferState":{"width":1024,"height":1,"type":5126},"compileState":{"initialized":true,"lastChangeTime":1582248401381,"isCompiled":true,"code":"{\n    \"name\": \"sigma\",\n\t\"output_width\": 1024,\n\t\"output_height\": 1,\n\t\"output_type\": \"FLOAT\",\n\t\"code\": \"\n\n\n\nprecision highp float;\nuniform sampler2D texture;\nvarying vec2 v_uv;\n\nconst float len = 1024.0;\n\nvoid main(void){\n    vec2 sum = vec2(0.0);\n    for(int i = 0; i < int(len); i++) {\n        vec2 p = vec2(v_uv.x, (float(i) + 0.5) / len);\n        sum += texture2D(texture, p).rg;\n    }\n    sum /= len;\n\tgl_FragColor = vec4(sum, 0.0, 1.0);\n}\n\n\n\n\t\",\n\t\"preview\": \"\n\t\tprecision highp float;\n\t\tuniform sampler2D output_frame;\n\t\tuniform vec4 output_frame_area;\n\t\tvarying vec2 v_uv;\n\n\t\tvoid main(void){\n\t\t\tgl_FragColor = texture2D(output_frame, v_uv * output_frame_area.xy);\n\t\t\tgl_FragColor.rg *= 100000.0;\n\t\t}\n\t\"\n}","error":"","latency":500}},"inputs":[{"srcNodeId":5,"srcParamName":"output frame","thisParamName":"texture"}]},{"unique_id":8,"type":"filter","name":"filter shape","x":604.9067993164064,"y":278.91687011718744,"w":140,"h":140.2860613268469,"inpus":[],"custom":{"frameBufferState":{"width":1024,"height":1,"type":5126},"compileState":{"initialized":true,"lastChangeTime":1582248167646,"isCompiled":true,"code":"{\n    \"name\": \"filter shape\",\n\t\"output_width\": 1024,\n\t\"output_height\": 1,\n\t\"output_type\": \"FLOAT\",\n\t\"code\": \"\n\n\n\nprecision highp float;\nuniform float time;\nvarying vec2 v_uv;\n\nvoid main(void){\n    float z = sin(time * 4.0);\n    z = z * 0.3 + 0.2;\n    float p = 1.0 - smoothstep(0.0, 1.0, (v_uv.x - z) * 4.0);\n\tgl_FragColor = vec4(p, 0.0, 0.0, 1.0);\n}\n\n\n\n\t\",\n\t\"preview\": \"\n\t\tprecision highp float;\n\t\tuniform sampler2D output_frame;\n\t\tuniform vec2 output_frame_area;\n\t\tvarying vec2 v_uv;\n\t\t\n\t\tvoid main(void){\n\t\t\tvec2 p = v_uv * output_frame_area;\n\t\t\tfloat wave = texture2D(output_frame, p).r / 2.0;\n\t\t\twave += 0.25;\n\t\t\tfloat g = (p.y > wave) ? 1.0 : 0.0;\n\t\t\tgl_FragColor = vec4(vec3(g), 1.0);\n\t\t}\n\t\"\n}","error":"","latency":500}},"inputs":[{"srcNodeId":2,"srcParamName":"output time","thisParamName":"time"}]},{"unique_id":9,"type":"filter","name":"music pliayer","x":778.6625823974609,"y":23.90100097656251,"w":140,"h":140.2860613268469,"inpus":[],"custom":{"frameBufferState":{"width":1024,"height":1,"type":5126},"compileState":{"initialized":true,"lastChangeTime":1582248318597,"isCompiled":true,"code":"{\n    \"name\": \"music pliayer\",\n\t\"code\": \"\nprecision highp float;\nuniform sampler2D midi;\nuniform sampler2D audio;\nuniform ivec2 audio_resolution;\n\nvarying vec2 v_uv;\n\nfloat read(float f_index){\n\tfloat index = floor(f_index * 1024.0);\n\tvec2 pos = vec2(\n\t\tfloor(mod(index, 4096.0 * 4.0)) / (4.0 * 4096.0),\n\t\t1.0 - floor(index / (4096.0 * 4.0)) / 4096.0\n\t);\n\tvec4 wave = texture2D(audio, pos);\n\tif (mod(index, 4.0) == 0.0) return wave.r;\n\tif (mod(index, 4.0) == 1.0) return wave.g;\n\tif (mod(index, 4.0) == 2.0) return wave.b;\n\tif (mod(index, 4.0) == 3.0) return wave.a;\n\treturn 0.0;\n}\n\nvoid main(void){\n\tvec2 area = vec2(\n\t\tfloat(audio_resolution.x) / exp2(ceil(log2(float(audio_resolution.x)))),\n\t\tfloat(audio_resolution.y) / exp2(ceil(log2(float(audio_resolution.y))))\n\t);\n\tvec2 p = v_uv;\n\tfloat wave = 0.0;\n\tfor(int i = 0; i < 128; i++) {\n\t\tvec4 key = texture2D(midi, vec2(float(i) / 127.0, 0.0));\n\t\tfloat hz = 440.0 * pow(2.0, (float(i) - 69.0) / 12.0);\n\t\tfloat len = 44100.0;\n\t\tfloat pi = 3.14159265;\n\t\tif (key.r != 0.0) {\n\t\t\twave += read(p.x + key.g);\n\t\t\t//wave += 0.1 * key.r * sin(hz * 2.0 * pi * 1024.0 * (key.g + p.x) / len);\n\t\t}\n\t}\n\tgl_FragColor = vec4(wave, 0.0, 0.0, 1.0);\n}\n\t\",\n\t\"output_width\": 1024,\n\t\"output_height\": 1,\n\t\"output_type\": \"FLOAT\",\n\t\"preview\": \"\n\t\tprecision highp float;\n\t\tuniform sampler2D output_frame;\n\t\tuniform vec2 output_frame_area;\n\t\tvarying vec2 v_uv;\n\t\t\n\t\tvoid main(void){\n\t\t\tvec2 p = v_uv * output_frame_area;\n\t\t\tfloat wave = texture2D(output_frame, p).r / 2.0;\n\t\t\tp.y = (p.y * 2.0) - 1.0;\n\t\t\tfloat g = (p.y > wave) ? 1.0 : 0.0;\n\t\t\tgl_FragColor = vec4(vec3(g), 1.0);\n\t\t}\n\t\"\n}","error":"","latency":500}},"inputs":[{"srcNodeId":0,"srcParamName":"output frame","thisParamName":"midi"},{"srcNodeId":1,"srcParamName":"output frame","thisParamName":"audio"},{"srcNodeId":1,"srcParamName":"output resolution","thisParamName":"audio_resolution"}]},{"unique_id":10,"type":"audio output frame","name":"audio output","x":1810.4908447265623,"y":161.86539077758786,"w":140,"h":140.2860613268469,"inpus":[],"custom":{},"inputs":[{"srcNodeId":3,"srcParamName":"output frame","thisParamName":"input frame"}]},{"unique_id":11,"type":"audio input frame","name":"audio input","x":-400.2824096679687,"y":365.9424743652344,"w":140,"h":140.2860613268469,"inpus":[],"custom":{"frameBufferState":{"width":1024,"height":1,"format":6408,"type":5126},"array_length":1024},"inputs":[]},{"unique_id":12,"type":"create","name":"💪😀💪やぁ","x":-316.54643058776827,"y":601.9142131805419,"w":219.01977710645113,"h":77.3262299491388,"inpus":[],"custom":{},"inputs":[]}]);

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
