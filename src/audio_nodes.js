import { HydrangeaJS } from "../3rdparty/HydrangeaJS/src/hydrangea.js";

const FrameNode = HydrangeaJS.Extra.ShaderNode.FrameNode;
const ValueNodeParam = HydrangeaJS.Extra.ShaderNode.ValueNodeParam;

export const AudioBufferNode = class extends FrameNode {
	constructor(name, x, y, audioBuffer) {
		super(
			name,
			x, y, 4096, 4096
		);
		this.type = "audio frame";
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
			this.frameBufferState.width, this.frameBufferState.height,
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
	constructor(x, y, array_length) {
		super(
			"audio input",
			x, y, array_length, 1
		);
		this.type = "audio input frame";
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
export const AudioOutputNode = class extends FrameNode {
	constructor(x, y, array_length) {
		super(
			"audio output",
			x, y, array_length, 1
		);
		this.type = "audio output frame";
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
};
export const MidiInputNode = class extends FrameNode {
	constructor(x, y, midi) {
		super(
			"midi input",
			x, y, 128, 1
		);
		this.type = "midi input frame";
		this.midi = midi;
		this.midiState = new Float32Array(128 * 4);
	}
	setup() {
		super.setup();
		this.resize(60.0, 480.0);
		this.resizeFrame(
			this.frameBufferState.width, this.frameBufferState.height,
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
	vec2 p = vec2(v_uv.y, 1.0 - v_uv.x);
	p.x *= 128.0 / 12.0;

	int keyType = getKeyType(p);
	vec3 col;
	if (keyType == -1) col = vec3(0.2);
	if (keyType == 0) col = vec3(1.0);
	if (keyType == 1) col = vec3(0.2);

	int keyIndex = getKeyIndex(p);
	float key = texture2D(texture, vec2(float(keyIndex) / 128.0, 0.0)).r;
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