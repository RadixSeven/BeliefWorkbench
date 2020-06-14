import React, { useReducer } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "beautiful-react-diagrams/styles.css";
import Editor from "./Editor";
import nodes from "./nodes";
import * as Network from "./nodes_type";

type WorkbenchState = {
  /// The beliefs being edited
  beliefs: {
    nodes: Network.Nodes;
    language: string;
    modelName: string;
  };
  /// The key of the currently selected node in beliefs.Nodes
  selection: string | null;
  /// The URL for storing the current beliefs
  currentURL: string | null;
};

const initialState: WorkbenchState = {
  beliefs: {
    nodes: nodes,
    language: "en-US",
    modelName: "Demo Model",
  },
  selection: null,
  currentURL: null,
};

enum CommandType {
  NoOp,
  SelectNode,
  MoveNode,
}
interface Command {
  type: CommandType;
}

type WorkbenchReducer = (
  state: WorkbenchState,
  action: Command
) => WorkbenchState;

interface SelectNodeCommand extends Command {
  type: CommandType.SelectNode;
  newSelection: string;
}

interface MoveNodeCommand extends Command {
  type: CommandType.MoveNode;
  nodeId: string;
  newCoords: number[];
}

const selectNode: WorkbenchReducer = (oldState, action) => ({
  beliefs: { ...oldState.beliefs },
  ...oldState,
  selection: (action as SelectNodeCommand).newSelection,
});

const moveNode: WorkbenchReducer = (oldState, action) => {
  let newObj: WorkbenchState = {
    beliefs: {
      ...oldState.beliefs,
    },
    ...oldState,
  };
  const a = action as MoveNodeCommand;
  newObj.beliefs.nodes[a.nodeId].coords = a.newCoords;
  return newObj;
};

type DispatchTable = WorkbenchReducer[];
const dispatchTable = createDispatchTable();
function createDispatchTable() {
  let dispatchTable: DispatchTable = [];
  dispatchTable[CommandType.NoOp] = (state, _action) => state;
  dispatchTable[CommandType.SelectNode] = selectNode;
  dispatchTable[CommandType.MoveNode] = moveNode;
  return dispatchTable;
}

function log(message: string) {
  console.log(message);
}

function createDispatchers(dispatch: React.Dispatch<Command>) {
  return {
    dispatchSelectNode: (newSelection: string) => {
      const cmd: SelectNodeCommand = {
        type: CommandType.SelectNode,
        newSelection: newSelection,
      };
      return dispatch(cmd);
    },
    dispatchMoveNode: (nodeId: string, newCoords: number[]) => {
      const cmd: MoveNodeCommand = {
        type: CommandType.MoveNode,
        newCoords: newCoords,
        nodeId: nodeId,
      };
      return dispatch(cmd);
    },
  };
}

const stateTransition: WorkbenchReducer = (state, action) => {
  if (action.type in dispatchTable) {
    return dispatchTable[action.type](state, action);
  }
  log(
    "Unknown action:" +
      action.type +
      " (" +
      CommandType[action.type] +
      ") " +
      "Original action:" +
      action
  );
  return state;
};

export const DispatchContext = React.createContext(
  createDispatchers((_: Command) => {})
);

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
          version="v0.01"
          selection={workbenchState.selection}
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
