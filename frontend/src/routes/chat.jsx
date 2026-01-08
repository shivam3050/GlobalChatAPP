import { useLayoutEffect, useState } from "react";
import { useEffect } from "react";


export const ChatSection = (props) => {



  const [availableChatsInUI, setAvailableChatsInUI] = useState([])

  useEffect(() => {

    setAvailableChatsInUI(props.chatRef.current.availableChats)

  }, [props.refreshChatsFlag])



  // function theseMessagesAreByAI(chatsDiv, item, createdAt) {
  //     // NEW CONCEPT

  //     const chatField = document.createElement("div")
  //     chatField.style.alignSelf = "flex-start"
  //     chatField.style.maxWidth = "90%"
  //     const chatTextField = document.createElement("pre")

  //     chatTextField.style.display = "flex"
  //     chatTextField.style.flexDirection = "column"
  //     chatTextField.style.rowGap = "0"



  //     let startCode = false



  //     for (let line of item.content.split("\n")) {


  //         if (line.length === 0) continue; //ignore

  //         if (startCode === false && line.startsWith("```")) {// code start now
  //             const strong = document.createElement("strong")
  //             strong.textContent = line.slice(3)

  //             strong.classList.add("codeLine")
  //             strong.style.marginTop = "var(--max-padding)"
  //             strong.style.paddingBottom = "var(--max-padding)"
  //             strong.style.borderTopLeftRadius = "10px"
  //             strong.style.borderTopRightRadius = "10px"
  //             strong.style.color = "white"
  //             strong.display = "inline"
  //             chatTextField.appendChild(strong)

  //             startCode = true
  //             continue
  //         }

  //         if (startCode && line.startsWith("```") && line.length === 3) {// code end here

  //             startCode = false
  //             continue
  //         }
  //         if (startCode) { // code still , this will go in code part
  //             const codeLine = document.createElement("div")
  //             codeLine.classList.add("codeLine")
  //             let indexOfComment = line.indexOf("//")
  //             let comment = ""
  //             if (indexOfComment !== -1) {
  //                 comment = line.slice(indexOfComment)
  //                 line = line.slice(0, indexOfComment)
  //             }
  //             codeLine.textContent = line
  //             chatTextField.appendChild(codeLine)

  //             continue
  //         }

  //         if (line.length === 1 && startCode === false) { // one char only

  //             const strong = document.createElement("strong")
  //             strong.textContent = line
  //             chatTextField.appendChild(strong)
  //             continue
  //         }

  //         if (startCode === false) {

  //             const strong = document.createElement("strong")
  //             strong.textContent = line
  //             chatTextField.appendChild(strong)
  //             continue
  //         }









  //     }

  //     chatField.appendChild(chatTextField)

  //     const chatStatusField = document.createElement("div")
  //     chatStatusField.textContent = createdAt
  //     chatStatusField.style.marginTop = "var(--max-margin)"
  //     chatField.appendChild(chatStatusField)


  //     chatsDiv.appendChild(chatField)

  //     chatsDiv?.scrollTo({ top: chatsDiv?.scrollHeight, behavior: 'smooth' })

  //     //NEW CONCEPT END
  // }
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
        {/* <div style={{ marginTop: "var(--max-margin)" }}>{createdAt}</div> */}
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
    const chatDiv = props.chatsDivRef.current//document.getElementById("chats-div");
    chatDiv?.scrollTo({
      top: chatDiv.scrollHeight,
      behavior: "smooth"
    });
  }, [availableChatsInUI]);

  // if (!props.chatRef.current || props.chatRef.current.availableChats.length === 0) {

  //     return (<div id="chats-div" className="" style={{
  //         display: "flex", flexDirection: "column", justifyContent: "start", alignItems: "center"

  //     }}>
  //         <div className="any-label" style={{
  //             borderRadius: "calc(10*var(--med-border-radius))",
  //             textAlign: "center"
  //         }}>
  //             No chats there
  //         </div>
  //     </div>)
  // }

  // else {
  return <div id="chats-div" ref={props.chatsDivRef}>
    {
      availableChatsInUI.map((item, index) => {   //  senderId: data.sender.id, receiverId: data.receiver.id, content: data.msg, createdAt: data.createdAt
        const originalTimestamp = new Date(Number(item.createdAt))
        const createdAt = originalTimestamp.toLocaleTimeString(
          "en", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        }
        )

        return (
          <div

            className={(item.senderId === props.userRef.current.id) ? "background-gradient-in-chat" : ""}
            style={
              {

                alignSelf: (item.senderId === props.userRef.current.id) ? ("flex-end") : ("flex-start")
              }
            } key={index}>

            {
              (item.senderId === props.userRef.current.id || item.senderId !== props.userRef.current.yourGlobalStarAiReference.id) ? (
                <>
                  <p className={`main-chat-text pre ${item.isLink ? "isLink" : ""}`} onClick={(item.isLink) ? (async() => {
                    // if (props.socketContainer.current.isStillDownloading) {
                    //   console.error("wait a file is already downloading")
                    //   return
                    // }
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/download-file`, {
                                    method: "POST",
                                    headers: {


                                        "X-Modified-Filename": item.content,
                                        "X-Custom-Access-Token": props.userRef.current.customAccessToken,
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
                                    // Ask user where to save file
                                    const handle = await window.showSaveFilePicker({
                                        suggestedName: shortFilename(item.content)
                                        //types: [{ description: 'ZIP files', accept: { 'application/zip': ['.zip'] } }]
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
                    // props.socketContainer.current.send(JSON.stringify(
                    //   {
                    //     type: "download-file-request-from-client",
                    //     sender: item.senderId,
                    //     receiver: item.receiverId,
                    //     fileMetaDataInfo: { upcomingFilename: item.content, fileSize: item.fileSize } 
                    //   }
                    // ))

                  }) : (null)}>
                    {item.isLink ? (<><span> {shortFilename(item.content)}</span> <br></br>
                      <span> {
                        (item.fileSize < 1024) ? (Math.trunc(item.fileSize * 100) / 100 + " B") : ((item.fileSize < 1048576) ? (Math.trunc((item.fileSize / 1024) * 100) / 100 + " KB") : (Math.trunc((item.fileSize / 1048576) * 100) / 100 + " MB"))
                      }</span></>) : (<>{item.content}<span className="hovereffectbtn playAnyMessageBtn" onClick={()=> props.textToSpeechContainerRef.current.forceSpeakFunction(item.content)}></span></>)}



                  </p>


                  <div className="chatTextStatus">

                    {(item.senderId === props.userRef.current.id) ? (`✔ ${createdAt}`) : (createdAt)}
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
  // }
}
