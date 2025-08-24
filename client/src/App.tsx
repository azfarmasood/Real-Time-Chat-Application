import React from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Join from "./components/Join/Join";
import Chat from "./components/Chart/Chat";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" Component={Join} />
        <Route path="/chat" Component={Chat} />
      </Routes>
    </Router>
  )
}

export default App;
