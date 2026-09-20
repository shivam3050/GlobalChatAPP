import { useLayoutEffect, useState, useEffect } from "react";
import { chatStore } from "../zustand/chatStore";
import { userStore } from "../zustand/userStore";

export const ChatSection = (props) => {

  const [availableChatsInUI, setAvailableChatsInUI] = useState([])

  useEffect(() => {
    setAvailableChatsInUI(chatStore.getState().availableChats)
  }, [props.refreshChatsFlag])

  function theseMessagesAreByAI(item, createdAt) {
    let startCode = false;
    let blockId = -1;
    const lines = (item.content || "").split("\n");

    return (
      <div style={{ alignSelf: "flex-start", maxWidth: "90%" }}>
        <div style={{ display: "flex", flexDirection: "column", rowGap: "0" }}>
          {lines.map((originalLine, idx) => {
            let line = originalLine;

            if (line.length === 0) return null;

            // Code block start
            if (!startCode && line.startsWith("```")) {
              startCode = true;
              blockId += 1;
              const thisBlock = blockId;

              return (
                <legend
                  onClick={(e) => {
                    let text = ""
                    for (let code of e.currentTarget.parentElement.querySelectorAll(`.codeBlock-${thisBlock}`)) {
                      text += code.textContent + "\n"
                    }
                    window.navigator.clipboard.writeText(text);
                  }}
                  key={idx}
                  className="codeLine copylegend"
                >
                  {"Copy"}
                </legend>
              );
            }

            // Code block end
            if (startCode && line.startsWith("```") && line.length === 3) {
              startCode = false;
              return null;
            }

            // Inside code block
            if (startCode) {
              let indexOfComment = line.indexOf("//");
              if (indexOfComment !== -1) {
                line = line.slice(0, indexOfComment);
              }
              return (
                <div key={idx} className={`codeLine codeBlock-${blockId}`}>
                  {line}
                </div>
              );
            }

            // Normal non-code line
            return (
              <div key={idx}>
                {line}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function shortFilename(longname) {
    function nthIndex(str, char, n) {
      let i = -1;
      while (n-- && i++ < str.length) {
        i = str.indexOf(char, i);
        if (i === -1) break;
      }
      return i;
    }
    const idx = nthIndex(longname, "_", 3);
    return longname.slice(idx + 1);
  }

  useLayoutEffect(() => {
    const chatDiv = props.chatsDivRef?.current;
    if (!chatDiv) return;
    chatDiv.scrollTo({
      top: chatDiv.scrollHeight,
      behavior: "smooth"
    });
  }, [availableChatsInUI]);

  if (!availableChatsInUI || availableChatsInUI.length === 0) {
    return (
      <div id="chats-div" ref={props.chatsDivRef} style={{
        display: "flex", flexDirection: "column", justifyContent: "start", alignItems: "center"
      }}>
        <div className="any-label" style={{
          borderRadius: "calc(10*var(--med-border-radius))",
          textAlign: "center"
        }}>
          No chats there
        </div>
      </div>
    )
  }

  return (
    <div id="chats-div" ref={props.chatsDivRef}>
      {
        availableChatsInUI.map((item, index) => {
          const myId = userStore.getState().id;
          const aiId = userStore.getState().yourGlobalStarAiReference?.id;

          const originalTimestamp = new Date(Number(item.createdAt))
          const createdAt = originalTimestamp.toLocaleTimeString("en", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })

          const isMine = item.senderId === myId;
          const isFromAi = !isMine && item.senderId === aiId;

          return (
            <div
              className={isMine ? "background-gradient-in-chat" : ""}
              style={{
                alignSelf: isMine ? "flex-end" : "flex-start"
              }}
              key={`${item.senderId}-${item.createdAt}-${index}`}
            >
              {
                !isFromAi ? (
                  <>
                    <p
                      className={`main-chat-text pre ${item.isLink ? "isLink" : ""}`}
                      onClick={item.isLink ? (async () => {

                        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/download-file`, {
                          method: "POST",
                          headers: {
                            "X-Modified-Filename": item.content,
                            "X-Custom-Access-Token": userStore.getState().customAccessToken,
                            "X-Sender-Id": item.senderId,
                            "X-Receiver-Id": item.receiverId,
                            "X-Created-At": createdAt
                          }
                        })

                        if (!response.ok) {
                          const msg = await response.text();
                          console.log(msg)
                          return
                        }

                        try {
                          const handle = await window.showSaveFilePicker({
                            suggestedName: shortFilename(item.content)
                          });

                          const writable = await handle.createWritable();
                          const reader = response.body.getReader();

                          while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            await writable.write(value);
                          }

                          await writable.close();
                          alert("Download complete!");
                        } catch (err) {
                          console.error("Download failed:", err);
                          alert("Download failed: " + err.message);
                        }

                      }) : undefined}
                    >
                      {item.isLink ? (
                        <>
                          <span> {shortFilename(item.content)}</span> <br />
                          <span>
                            {(item.fileSize < 1024)
                              ? (Math.trunc(item.fileSize * 100) / 100 + " B")
                              : ((item.fileSize < 1048576)
                                ? (Math.trunc((item.fileSize / 1024) * 100) / 100 + " KB")
                                : (Math.trunc((item.fileSize / 1048576) * 100) / 100 + " MB"))
                            }
                          </span>
                        </>
                      ) : (
                        <>
                          {item.content}
                          <span
                            className="hovereffectbtn playAnyMessageBtn"
                            onClick={() => props.textToSpeechContainerRef?.current?.forceSpeakFunction(item.content)}
                          >
                            ▶
                          </span>
                        </>
                      )}
                    </p>

                    <div className="chatTextStatus">
                      {isMine ? `✔ ${createdAt}` : createdAt}
                    </div>
                  </>
                ) : (
                  theseMessagesAreByAI(item, createdAt)
                )
              }
            </div>
          )
        })
      }
    </div>
  )
}