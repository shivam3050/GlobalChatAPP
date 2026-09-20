import { createRef } from "react";
import {
    webRTCContainerRef as webRTCContainerRefSchema,
    textToSpeechContainerRef as textToSpeechSchema
} from "../controllers/userModel.js";


// These are plain singletons. Nothing in the UI re-renders because of them,
// so they do not belong in React state or props. Any file can import them directly.

// keeps the same `.current` shape as the old useRef(schema), so existing call sites do not change
export const webRTCContainerRef = { current: webRTCContainerRefSchema }

export const textToSpeechContainerRef = { current: textToSpeechSchema }

// DOM refs: attach with ref={chatsDivRef} / ref={rtcbuttonRef} in the JSX
export const chatsDivRef = createRef()

export const rtcbuttonRef = createRef()