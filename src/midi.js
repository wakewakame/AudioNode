import { HydrangeaJS } from "../3rdparty/HydrangeaJS/src/hydrangea.js";

export const Midi = class extends HydrangeaJS.Utils.EventListener {
	constructor() {
		super();
		this.midiAccess = null;
		navigator.requestMIDIAccess().then(
			(midiAccess) => {
				this.midiAccess = midiAccess;
				this.midiAccess.inputs.forEach((key, port) => {
					key.onmidimessage = (event) => {
						this.trigger("onMidiMessage", event);
					};
				});
			},
			() => {}
		);
	}
};
