


export const startChromeOfflineVoiceRecognition = async (transcriptExportLocation) => {

    transcriptExportLocation.current.yourGlobalStarAiReference.transcriptinput = ""
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
            
            
        }, 3000);
    };


    return new Promise((resolve, reject) => {

        let currentRecognisedSpeech = ""

        recog.onresult = (event) => {
            const index = event.resultIndex;
            currentRecognisedSpeech = ""
            currentRecognisedSpeech =  event.results[index][0].transcript;
            transcriptExportLocation.current.yourGlobalStarAiReference.transcriptinput += currentRecognisedSpeech

            console.log("You said:", transcriptExportLocation.current.yourGlobalStarAiReference.transcriptinput);
            resetSilenceTimer();

        };

        recog.onerror = (e) => {
            transcriptExportLocation.current.yourGlobalStarAiReference.transcriptinput = "";
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

            if(currentRecognisedSpeech){
                resolve()
            }else{
                reject()
            }

        };

        recog.start();
    })
}



export async function speakWithChromeOfflineSynthesizer(textToSpeak) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
        throw new Error("Speech synthesis not supported");
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak.replace(/\*/g, '').trim());
    utterance.lang = 'en-US';
    utterance.rate = 1;     // Normal speed
    utterance.pitch = 1;    // Normal pitch
    utterance.volume = 1;   // Max volume


    return new Promise((resolve, reject) => {
        utterance.onend = () => {
            resolve()
        }
        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e.error);
            reject(e)
        };


        window.speechSynthesis.speak(utterance);
    })

}

