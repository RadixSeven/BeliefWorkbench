import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Editor from './Editor';
import nodes from './nodes';

const language = "en-US";
const modelName = "Demo Model";

ReactDOM.render(
  <React.StrictMode>
    <Editor
        nodes={nodes}
        language={language}
        modelName={modelName}
        version="v0.01"
        selection="xyz"
    />,
  </React.StrictMode>,
  document.getElementById("react-container")
);
