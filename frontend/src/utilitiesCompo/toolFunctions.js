


// export const startChromeOfflineVoiceRecognition = async (transcriptExportLocation) => {

//     transcriptExportLocation.current.yourGlobalStarAiReference.transcriptinput = ""
//     if (!window.webkitSpeechRecognition) {
//         throw new Error("webkitSpeechRecognition not supported");
//     }

//     const recog = new webkitSpeechRecognition();
//     recog.continuous = true;
//     // this was for, not stopping it for little pauses or one sentence
//     recog.lang = 'en-US';

//     let silenceTimer = null;

//     const resetSilenceTimer = () => {
//         clearTimeout(silenceTimer);
//         silenceTimer = setTimeout(() => {
//             recog.stop();
//             console.log("Stop bcz of silence.");
            
            
//         }, 5000);
//     };


//     return new Promise((resolve, reject) => {

//         let currentRecognisedSpeech = ""

//         recog.onresult = (event) => {
//             const index = event.resultIndex;
//             currentRecognisedSpeech = ""
//             currentRecognisedSpeech =  event.results[index][0].transcript;
//             transcriptExportLocation.current.yourGlobalStarAiReference.transcriptinput += currentRecognisedSpeech

//             resetSilenceTimer();

//         };

//         recog.onerror = (e) => {
//             transcriptExportLocation.current.yourGlobalStarAiReference.transcriptinput = "";
//             console.error("Error:", e.error);
//             reject(e)
//         };

//         recog.onstart = () => {
//             console.log("Recognition started.");
//             resetSilenceTimer();
//         };

//         recog.onend = () => {
//             clearTimeout(silenceTimer);
//             console.log("Recognition ended.");

//             if(currentRecognisedSpeech){
//                 resolve()
//             }else{
//                 reject()
                
//             }

//         };

//         recog.start();
//     })
// }











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
            
            
        }, 5000);
    };


    return new Promise((resolve, reject) => {

        

        recog.onresult = (event) => {
            resetSilenceTimer();
            const index = event.resultIndex;
            let currentRecognisedSpeech =  event.results[index][0].transcript;
            transcriptExportLocation.current.yourGlobalStarAiReference.transcriptinput += currentRecognisedSpeech


        };

        recog.onerror = (e) => {
            transcriptExportLocation.current.yourGlobalStarAiReference.transcriptinput = "";
            console.error("Error:", e.error);
            reject(false)
        };

        recog.onstart = () => {
            console.log("Recognition started.");
            resetSilenceTimer();
        };

        recog.onend = () => { // this event is fired when recog.stop() is called
            clearTimeout(silenceTimer); // now no more timer should be there
            console.log("Recognition ended.");

            if(transcriptExportLocation.current.yourGlobalStarAiReference.transcriptinput){
                
                resolve(true)
            }else{
                reject(false)
                
            }

        };

        recog.start();
    })
}





