window.onload = init;

//var source;
//var audioBuffer;
var audioContext;

// var kick_det;
// var vu;
var m_BeatTimer = 0;
var m_BeatCounter = 0;
var aspect = 1.0;
var clearClr = [0, 0, 1];
var ftimer = 0;


var fft = null;
var signal;
var bufferSize = 0;
//var channels = 0;
var rate = 0;
var frameBufferLength = 0;

var beatdetector; //object for beatdetektor.js

var beatProcessingNode;

function init() {
	try {
		getMicInput();
	    // Fix up for prefixing
	    //window.AudioContext = window.AudioContext||window.webkitAudioContext;
	    audioContext = new AudioContext();

	    console.log("audio context initialized");

	    //source = audioContext.createBufferSource();

	    //channels = source.channelCount;
        //rate = audioContext.sampleRate;
        
        //frameBufferLength = channels*1024;

        //bufferSize = frameBufferLength / channels;

        rate = 44100;
        bufferSize = 1024;
	    fft = new FFT(bufferSize, rate);
        signal = new Float32Array(bufferSize);

	    beatProcessingNode = audioContext.createScriptProcessor(bufferSize, 2, 2);

		beatProcessingNode.onaudioprocess = function(e) {
			var inputL = e.inputBuffer.getChannelData(0);
			var inputR = e.inputBuffer.getChannelData(1);
			processSample(inputL, inputR);
		}

	    beatdetector = new BeatDetektor(110,140);
	}
	catch(e) {
	    alert('Web Audio API is not supported in this browser');
	}

	
}


function getMicInput() {
	//x-browser
	navigator.getUserMedia = (navigator.getUserMedia || 
							  navigator.webkitGetUserMedia || 
							  navigator.mozGetUserMedia || 
							  navigator.msGetUserMedia);

	if (navigator.getUserMedia ) {
		navigator.getUserMedia(
			{audio: true}, 
			function(stream) {
				//get mic input and connect to node for processing
				microphone = audioContext.createMediaStreamSource(stream);
				microphone.connect(beatProcessingNode);
				beatProcessingNode.connect(audioContext.destination);
				console.log("connected mic to processing node");
			},
			// errorCallback
			function(err) {
				alert("The following error occured: " + err);
			}
		);	
	} else {
		alert("Could not getUserMedia");
	}
}

function processSample(inputL, inputR) {

        if (fft == null) return;

        for (var i = 0, fbl = bufferSize; i < fbl; i++) {
            // split and merge into a stero-mix mono signal
            signal[i] = (inputL[i] + inputR[i]) / 2;
        }
        
        fft.forward(signal);

        timestamp = microphone.context.currentTime;

        beatdetector.process(timestamp, fft.spectrum);

        //update front-end text every 200 ms
        setInterval(function() {
			document.getElementById("bpm").innerHTML=beatdetector.win_bpm_int_lo;
		}, 300);
}