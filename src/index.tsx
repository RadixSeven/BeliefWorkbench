import React, { useReducer } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "beautiful-react-diagrams/styles.css";
import Editor from "./Editor";
import nodes from "./nodes";
import { WorkbenchState } from "./workbench-state";
import { Command } from "./commands";
import { defaultEditorState } from "./workbench-reducers";
import { createDispatchers, stateTransition } from "./dispatchers";

export const DispatchContext = React.createContext(
  createDispatchers((_: Command) => {})
);

const initialState: WorkbenchState = {
  beliefs: {
    nodes: nodes,
    language: "en-US",
    modelName: "Demo Model",
  },
  currentlyEditing: null,
  newProperties: defaultEditorState,
  currentURL: null,
};

function BeliefWorkbench() {
  const [workbenchState, workbenchDispatch] = useReducer(
    stateTransition,
    initialState
  );
  return (
    <DispatchContext.Provider value={createDispatchers(workbenchDispatch)}>
      <React.StrictMode>
        <Editor
          nodes={workbenchState.beliefs.nodes}
          language={workbenchState.beliefs.language}
          modelName={workbenchState.beliefs.modelName}
          version="v0.0.1"
          editorState={workbenchState.newProperties}
          singleNodeToEdit={workbenchState.currentlyEditing}
        />
        ,
      </React.StrictMode>
    </DispatchContext.Provider>
  );
}

ReactDOM.render(
  <BeliefWorkbench />,
  document.getElementById("react-container")
);
