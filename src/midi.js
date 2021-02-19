import { HydrangeaJS } from "../3rdparty/HydrangeaJS/src/index.js";

export const Midi = class extends HydrangeaJS.Utils.EventListener {
	constructor() {
		super();
		this.midiAccess = null;
		try {
			navigator.requestMIDIAccess().then(
				(midiAccess) => {
					this.midiAccess = midiAccess;
					this.midiAccess.inputs.forEach((key, _) => {
						key.onmidimessage = (event) => {
							this.trigger("onMidiMessage", event);
						};
					});
				},
				() => {}
			);
		}
		catch(e) {
			console.log("midi input is not surported");
		}
	}
};
