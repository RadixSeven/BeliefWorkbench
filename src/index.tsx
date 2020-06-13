import React, {useReducer} from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Editor from './Editor';
import nodes from './nodes';
import * as Network from './nodes_type';

type WorkbenchState = {
    /// The beliefs being edited
    beliefs: {
        nodes: Network.Nodes;
        language: string;
        modelName: string;
    }
    /// The key of the currently selected node in beliefs.Nodes
    selection: string | null;
    /// The URL for storing the current beliefs
    currentURL: string | null;
}

const initialState : WorkbenchState = {
    "beliefs": {
        "nodes": nodes,
        "language": "en-US",
        "modelName": "Demo Model"
    },
    "selection": null,
    "currentURL": null
};

enum CommandType {
    NoOp
}
interface Command {
    type: CommandType;
}

type WorkbenchReducer = (state: WorkbenchState, action: Command) => WorkbenchState;
type DispatchTable = WorkbenchReducer[];

const dispatchTable = createDispatchTable();

function createDispatchTable(){
    let dispatchTable: DispatchTable = [];
    dispatchTable[CommandType.NoOp] = (state, _action) => state;
    return dispatchTable;
}

function log(message: string){
    console.log(message);
}

const stateTransition: WorkbenchReducer = (state, action) => {
    if (action.type in dispatchTable) {
        return dispatchTable[action.type](state, action);
    }
    log("Unknown action:" + action.type + " (" + CommandType[action.type] + ") "
        + "Original action:" + action);
    return state;
};

const DispatchContext = React.createContext((_: Command)=>{});

function BeliefWorkbench() {
    const [workbenchState, workbenchDispatch] = useReducer(stateTransition, initialState);
    return <DispatchContext.Provider value={workbenchDispatch}>
        <React.StrictMode>
            <Editor
                nodes={workbenchState.beliefs.nodes}
                language={workbenchState.beliefs.language}
                modelName={workbenchState.beliefs.modelName}
                version="v0.01"
                selection={workbenchState.selection}
            />,
        </React.StrictMode>
    </DispatchContext.Provider>
}

ReactDOM.render(
  <BeliefWorkbench />,
  document.getElementById("react-container")
);
