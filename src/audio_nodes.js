import { HydrangeaJS } from "../3rdparty/HydrangeaJS/src/index.js";

const ConvertibleNode = HydrangeaJS.GUI.Templates.ConvertibleNode;
const FrameNode = HydrangeaJS.Extra.ShaderNode.FrameNode;
const ValueNodeParam = HydrangeaJS.Extra.ShaderNode.ValueNodeParam;

export const AudioBufferNode = class extends FrameNode {
	constructor(name, url, x, y, audioBuffer) {
		super();
		this.type = "audio frame";
		this.name = name;
		this.x = x;
		this.y = y;
		this.json["custom"].frameBufferState.width = 4096;
		this.json["custom"].frameBufferState.height = 4096;
		this.json["custom"].url = url;
		this.audioBuffer = audioBuffer;
		this.audioArray = new Float32Array(4096*4096*4);
		for(let i = 0; i < this.audioBuffer.numberOfChannels; i++) {
			this.audioArray.set(
				this.audioBuffer.getChannelData(i),
				i * this.audioBuffer.length
			);
		}
		this.outputAudioLengthNodeParam = null;
	}
	setup() {
		super.setup();
		this.resizeFrame(
			this.json["custom"].frameBufferState.width, this.json["custom"].frameBufferState.height,
			this.graphics.gapp.gl.RGBA, this.graphics.gapp.gl.FLOAT
		);
		this.inputs.remove(this.inputShaderNodeParam);
		this.inputs.remove(this.inputResolutionNodeParam);
		this.outputAudioLengthNodeParam = this.outputs.add(new ValueNodeParam("int", "audio length"));
		this.outputAudioLengthNodeParam.value.x = this.audioBuffer.length;
		this.previewShader.loadShader(this.previewShader.default_shader.vertex, `
precision highp float;
uniform sampler2D texture;
uniform ivec2 textureArea;
uniform int audioLength;
varying vec2 v_uv;

float read(float f_index){
	float index = floor(f_index * 1024.0);
	vec2 pos = vec2(
		floor(mod(index, 4096.0 * 4.0)) / (4.0 * 4096.0),
		1.0 - floor(index / (4096.0 * 4.0)) / 4096.0
	);
	vec4 wave = texture2D(texture, pos);
	if (mod(index, 4.0) == 0.0) return wave.r;
	if (mod(index, 4.0) == 1.0) return wave.g;
	if (mod(index, 4.0) == 2.0) return wave.b;
	if (mod(index, 4.0) == 3.0) return wave.a;
	return 0.0;
}

void main(void){
	vec2 p = v_uv;
	float wave = read(p.x * float(audioLength) / 1024.0);
	
	p.y = (p.y * 2.0) - 1.0;
	float g = (wave < p.y) ? 1.0 : 0.3;
	gl_FragColor = vec4(vec3(g), 1.0);
}
		`);
		let tmp_current_shader = this.graphics.current_shader;
		this.graphics.shader(this.previewShader);
		this.previewShader.set("audioLength", this.audioBuffer.length);
		this.graphics.shader(tmp_current_shader);

		this.frameBuffer.texture.update(this.audioArray);
	}
};
export const AudioInputNode = class extends FrameNode {
	constructor(x = 0, y = 0, array_length = 0) {
		super();
		this.type = "audio input frame";
		this.name = "audio input";
		this.x = x;
		this.y = y;
		this.json["custom"].array_length = array_length;
		this.inputWave = null;
	}
	setup() {
		super.setup();
		this.resizeFrame(
			this.json["custom"].array_length, 1,
			this.graphics.gapp.gl.RGBA, this.graphics.gapp.gl.FLOAT
		);
		this.inputs.remove(this.inputShaderNodeParam);
		this.inputs.remove(this.inputResolutionNodeParam);
		this.previewShader.loadShader(this.previewShader.default_shader.vertex, `
precision highp float;
uniform sampler2D texture;
uniform ivec2 textureArea;
varying vec2 v_uv;

void main(void){
	vec2 p = v_uv * vec2(textureArea);
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
export const AudioOutputNode = class extends ConvertibleNode {
	constructor(x = 0, y = 0) {
		super();
		this.type = "audio output frame";
		this.name = "audio output";
		this.x = x;
		this.y = y;
		this.inputFrameNodeParam = null;
		this.previewShader = null;
		this.emptyTexture = null;
	}
	read(array){
		if (this.inputFrameNodeParam.output === null || this.inputFrameNodeParam.output.value.frame === null){
			array.fill(0);
			return;
		}
		const frame = this.inputFrameNodeParam.output.value.frame;
		const width = Math.floor(array.length / 4);
		if (frame.texture.width < width){
			array.fill(0);
			return;
		}
		frame.read(array, 0, 0, width, 1);
	}
	setup() {
		super.setup();
		this.resize(this.w, this.w);
		this.inputFrameNodeParam = this.inputs.add(new ValueNodeParam("frame", "input frame"));
		this.previewShader = this.graphics.createShader();
		this.previewShader.loadShader(this.previewShader.default_shader.vertex, `
precision highp float;
uniform sampler2D texture;
uniform vec2 texture_area;
varying vec2 v_uv;

void main(void){
	vec2 p = v_uv * texture_area;
	float wave = texture2D(texture, p).r / 2.0;
	wave = wave * 0.5 + 0.5;
	float g = (v_uv.y > wave) ? 1.0 : 0.0;
	gl_FragColor = vec4(vec3(g), 1.0);
}
		`);
		this.emptyTexture = this.graphics.createTexture(1, 1);
		this.emptyTexture.update(new Uint8Array([0, 0, 0, 0]));
	}
	deleted(){
		super.deleted();
		this.previewShader.delete();
		this.emptyTexture.delete();
	}
	draw(){
		super.draw();
		let tmp_current_shader = this.graphics.current_shader;
		this.graphics.shader(this.previewShader);
		if (this.inputFrameNodeParam.output !== null && this.inputFrameNodeParam.output.value.frame !== null){
			const texture = this.inputFrameNodeParam.output.value.frame.texture;
			this.previewShader.set("texture", texture);
			this.previewShader.set(
				"texture_area",
				texture.width  / texture.pow2_width,
				texture.height / texture.pow2_height
			);
		}
		else{
			this.previewShader.set("texture", this.emptyTexture);
			this.previewShader.set("texture_area",1, 1);
		}
		this.graphics.shape(this.inner_shape);
		this.graphics.shader(tmp_current_shader);
	}
};
export const MidiInputNode = class extends FrameNode {
	constructor(x, y, midi) {
		super();
		this.type = "midi input frame";
		this.name = "midi input";
		this.x = x;
		this.y = y;
		this.midi = midi;
		this.midiState = new Float32Array(128 * 4);
	}
	setup() {
		super.setup();
		this.resize(140.0, 140.0);
		this.resizeFrame(
			128, 1,
			this.graphics.gapp.gl.RGBA, this.graphics.gapp.gl.FLOAT
		);
		this.inputs.remove(this.inputShaderNodeParam);
		this.inputs.remove(this.inputResolutionNodeParam);
		this.previewShader.loadShader(this.previewShader.default_shader.vertex, `
precision lowp int;
precision mediump float;
uniform sampler2D texture;
uniform ivec2 textureArea;
varying vec2 v_uv;

int getKeyType(vec2 pos) {
	if (pos.y < 0.0 || 1.0 < pos.y || pos.x < 0.0) return -1;
	float loop_x = mod(pos.x, 1.0);
	float a = mod(loop_x * 7.0 + 3.5, 1.0);
	float b = floor(loop_x * 7.0 + 0.5);
	bool c = (pos.y < 0.4 || b == 0.0 || b == 3.0 || b == 7.0);
	float d = c ? 0.03 : 0.26;
	if (abs(0.5 - a) > d) return 0;  // white key
	else if (!c) return 1;  // black key
	else return -1;  // none
}

int getKeyIndex(vec2 pos) {
	if (pos.y < 0.0 || 1.0 < pos.y || pos.x < 0.0) return -1;
	int octave = int(floor(pos.x));
	float p_x = mod(pos.x, 1.0);
	int type = getKeyType(pos);
	type = int(clamp(float(type), 0.0, 1.0));
	int ret = int(floor(p_x * 14.0));
	ret -= type;
	ret = (ret / 2) * 2;
	ret += type;
	if (ret >= 5) ret -= 1;
	ret += octave * 12;
	return ret;
}

void main( void ) {
	vec2 p = v_uv;

	int keyType = getKeyType(p);
	vec3 col;
	if (keyType == -1) col = vec3(0.2);
	if (keyType == 0) col = vec3(1.0);
	if (keyType == 1) col = vec3(0.2);

	float key = 0.0;
	for(int i = 0; i < 11; i++) {
		int keyIndex = getKeyIndex(p) + (i * 12);
		if (keyIndex >= 128) break;
		key += texture2D(texture, vec2(float(keyIndex) / 128.0, 0.0)).r;
	}
	if (keyType != -1 && key > 0.0) col = col * 0.2 + vec3(1.0, 0.1, 0.3) * 0.8;

	gl_FragColor = vec4(col, 1.0);
}
		`);
		this.midi.addEventListener("onMidiMessage", (e) => {
			switch(e.data[0]) {
				case 128:
					this.midiState[e.data[1] * 4 + 0] = 0.0;
					this.midiState[e.data[1] * 4 + 2] = 0.0;
					break;
				case 144:
					this.midiState[e.data[1] * 4 + 0] = e.data[2] / 127.0;
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
