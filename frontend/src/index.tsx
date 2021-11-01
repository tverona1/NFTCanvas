import React from "react";
import ReactDOM from "react-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { HashRouter as Router } from "react-router-dom";
import { Routes } from "./components/Routes";

// Entry point of application
ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Routes/>
      </Router>
  </React.StrictMode>,
  document.getElementById("root")
);