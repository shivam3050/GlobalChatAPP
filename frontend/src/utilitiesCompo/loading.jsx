import { useEffect, useState } from "react"


function Loading(props) {

  const [i, setI] = useState(30)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setI((prev) => prev - 1);
    }, 1000);

    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
    }, 30000);


    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, []);




  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: props.size, height: props.size,
      borderWidth: `calc(${props.size} / 8)`,

      borderStyle: "solid",
      borderColor: "var(--light-grey)",

      borderTopStyle: "solid",
      borderTopColor: "white",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      // display: "inline-block",
      padding:"2px"


    }} className="resizable-loading-spinner">
      <div style={{
        animation: "antiSpin 1s linear infinite",
        color: "white",
        margin: "0",
        fontSize: "10px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        
      }}>
        {i}
      </div>

    </div>
  )

}

export default Loading
