export const userRef = {

    username: "",
    id: "",
    customAccessToken: "",
    // age: null,
    // gender: "",
    country: "",
    yourGlobalStarAiReference: {
        username: "",
        id: "",
        // age: null,
        // gender: "",
        country: "",
        isAiCallingOn: { instance: null, flag: false },
        unread: false
    },
    availableConnectedUsersUnreadLength: 0,

    availableConnectedUsers: [
        {
            username: "",
            id: "",
            // age: null,
            // gender: "",
            country: "",
            transcriptinput: "",
            textoutput: "",
            unread: false
        }
    ],
    availableUsers: [
        {
            username: "",
            id: "",
            // age: null,
            // gender: "",
            country: "",
            unread: false
        }
    ],
    focusedContact: {

        username: "",
        id: "",
        // age: null,
        // gender: "",
        country: "",
        unread: false

    }

}


export const chatsRef = {
    sender: {
        username: "",
        id: "",
        // age: null,
        // gender: "",
        country: "",
    },
    receiver: {
        username: "",
        id: "",
        // age: null,
        // gender: "",
        country: "",
    },
    filesToBeSent: {
        //filename: {fileObject}          // optional unique ID per file
    },
    availableChats: [
        {
            senderId: "",
            receiverId: "",
            content: "",
            createdAt: ""
        }
    ],
    starAiRecentChatContextStack: [
        // {
        //     "role": "user",
        //     "parts": [{ "text": "" }]
        // }
    ],
    starAiRecentVoiceContextStack: [
        // {
        //     "role": "user",
        //     "parts": [{ "text": "" }]
        // }
    ]
}

export const webRTCContainerRef = {

    senderPC: null,

    senderStreamsObject: null,
    senderTracksContainerArray: [],

    senderDC: null,


    senderTC: null,


    streamElementAtSender: null,
    streamElementParentAtSender: null,

    streamElementAtReceiver: null,
    streamElementParentAtReceiver: null,

    webRTCStartFunction: null,
    webRTCStopFunction: null,



    iceQueue: null,




}
export const recogniserStreamObject = {


    recogniser: null,
    stoppedByUser: false,
    finalText: "",
    isARequestMadeBySTT: false


}
export const textToSpeechContainerRef = {

    audioCtx: null,
    dest: null,
    ttsAudioEl: null,
    source: null,
    outputStream: null,
    incomingTrackIdOfTTS: null,
    // isActive: false,

    cleanUp: function () {
        try {
            // Stop TTS playback
            if (this.ttsAudioEl) {
                this.ttsAudioEl.pause();
                this.ttsAudioEl.src = "";
                this.ttsAudioEl = null;
            }

            // Stop outputStream tracks
            if (this.outputStream) {
                this.outputStream.getTracks().forEach(track => track.stop());
                this.outputStream = null;
            }

            // Disconnect source
            if (this.source) {
                this.source.disconnect();
                this.source = null;
            }

            // Close AudioContext
            if (this.audioCtx) {
                this.audioCtx.close();
                this.audioCtx = null;
            }

            // Reset destination
            this.dest = null;

            // Reset TTS track ID
            this.incomingTrackIdOfTTS = null;

            console.log("TTS resources cleaned up successfully");
        } catch (err) {
            console.error("Error cleaning TTS resources:", err);
        }
    },

    initAudioCaptureFunction: async function () {
    if (
        this.audioCtx &&
        this.dest &&
        this.ttsAudioEl &&
        this.source &&
        this.outputStream
    ) {
        return { success: true, reusing: true }; // already initialized
    }

    try {
        this.audioCtx = new AudioContext();
        await this.audioCtx.resume();

        this.dest = this.audioCtx.createMediaStreamDestination();
        this.ttsAudioEl = new Audio();
        this.ttsAudioEl.autoplay = true;

        this.source = this.audioCtx.createMediaElementSource(this.ttsAudioEl);
        this.source.connect(this.dest);

        // Optional: sender hears TTS locally (loopback)
        this.source.connect(this.audioCtx.destination);

        this.outputStream = this.dest.stream;
        
        return { success: true, reusing: false }; // Fixed!
    } catch (error) {
        console.error("TTS initialization error:", error); // Add logging
        return { success: false, reusing: false };
    }
},

    forceSpeakFunction: function speak(text, customOptions = {}) {

        speechSynthesis.cancel();


        const utterance = new SpeechSynthesisUtterance(text);

        // Settings apply karo
        // utterance.rate = customOptions.rate || defaultSettings.rate;
        // utterance.pitch = customOptions.pitch || defaultSettings.pitch;
        // utterance.volume = customOptions.volume || defaultSettings.volume;
        // utterance.lang = customOptions.lang || defaultSettings.lang;


        speechSynthesis.speak(utterance);
    },
    forceSpeakWithCaptureAndStream: function (text, customOptions = {}) {
        if (!this.ttsAudioEl) {
            console.error('Audio capture is not initialized! Call initAudioCaptureFunction() first.');

            return;
        }

        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Settings apply karo
        utterance.rate = customOptions.rate || 1;
        utterance.pitch = customOptions.pitch || 1;
        utterance.volume = customOptions.volume || 1;
        utterance.lang = customOptions.lang || 'en-US';

        // Route TTS through dummy audio element (critical for capture)
        utterance.onstart = () => {
            this.ttsAudioEl.src = "";
        };

        speechSynthesis.speak(utterance);
    },
    getStream: function () {
        return this.outputStream;
    }

}
