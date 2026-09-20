import './App.css'
import AllContactsAndNotifications from './routes/AllNotification';
import AllUsers from './routes/AllUsers';
import ChatsRoute from './routes/ChatsRoute';
import { Home } from './routes/home'
import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


function App() {

  useEffect(() => {

    const updateViewportVars = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      const vw = window.visualViewport?.width || window.innerWidth;
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
      document.documentElement.style.setProperty('--app-width', `${vw}px`);
    }

    updateViewportVars()

    window.addEventListener("resize", updateViewportVars)
    window.visualViewport?.addEventListener("resize", updateViewportVars)

    return () => {
      window.removeEventListener("resize", updateViewportVars)
      window.visualViewport?.removeEventListener("resize", updateViewportVars)
    }
  }, [])

  useEffect(() => {

    fetch(import.meta.env.VITE_BACKEND_URL);

  }, [])


  return (

    <Router>
      <Routes>

        <Route path="/" element={<Home />}>

          <Route index element={<AllUsers />} />

          <Route path="users" element={<AllUsers />} />

          <Route path="chats" element={<ChatsRoute />} />

          <Route path="mycontacts-and-notifications" element={<AllContactsAndNotifications />} />

        </Route>

      </Routes>
    </Router>

  )
}

export default App