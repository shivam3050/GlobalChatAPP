


export const startChromeOfflineVoiceRecognition = async (transcriptExportLocation) => {

    // this function will never stop by itsself so external stopping will be required
    transcriptExportLocation.transcriptinput=""
    if (!window.webkitSpeechRecognition) {
        throw new Error("webkitSpeechRecognition not supported");
    }

    const recog = new webkitSpeechRecognition();
    recog.continuous = true;
    // this was for, not stopping it for little pauses or one sentence
    recog.lang = 'en-US';

    let silenceTimer = null;

    const resetSilenceTimer = () => {
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
            recog.stop(); 
            console.log("Stop bcz of silence.");
        }, 5000);
    };

    
    return new Promise((resolve,reject)=>{
        recog.onresult = (event) => {
        const index = event.resultIndex;
        console.log("just cheching something: ",event.results)
        transcriptExportLocation.transcriptinput += event.results[index][0].transcript;

        console.log("You said:", transcriptExportLocation.transcriptinput);
        resetSilenceTimer();

    };

    recog.onerror = (e) => {
        transcriptExportLocation.transcriptinput = "";
        console.error("Error:", e.error);
        reject(e)
    };

    recog.onstart = () => {
        console.log("Recognition started.");
        resetSilenceTimer();
    };

    recog.onend = () => {
        clearTimeout(silenceTimer);
        console.log("Recognition ended.");
       
        recog.start()
        
    };

    recog.start();
    })
}



export function speakWithChromeOfflineSynthesizer(textToSpeak) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        throw new Error("Speech synthesis not supported");
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak.replace(/\*/g, '').trim());
    utterance.lang = 'en-US';
    utterance.rate = 1;     // Normal speed
    utterance.pitch = 1;    // Normal pitch
    utterance.volume = 1;   // Max volume

    utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e.error);
    };

    window.speechSynthesis.speak(utterance);
}

