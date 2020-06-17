import React, { useReducer } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "beautiful-react-diagrams/styles.css";
import Editor from "./Editor";
import nodes from "./nodes";
import * as Network from "./nodes_type";

const Immutable = require("seamless-immutable");

type WorkbenchState = {
  /** The beliefs being edited */
  beliefs: {
    nodes: Network.Nodes;
    language: string;
    modelName: string;
  };
  /** The key of the node currently being edited (or null if not
   *  editing a node.) */
  currentlyEditing: string | null;
  /** The URL for storing the current beliefs */
  currentURL: string | null;
};

const initialState: WorkbenchState = Immutable({
  beliefs: {
    nodes: nodes,
    language: "en-US",
    modelName: "Demo Model",
  },
  currentlyEditing: null,
  currentURL: null,
});

enum CommandType {
  NoOp,
  StartEditingNode,
  MoveNode,
  LinkNodes,
  UnlinkNodes,
  DeleteNode,
}
interface Command {
  type: CommandType;
}

type WorkbenchReducer = (
  state: WorkbenchState,
  action: Command
) => WorkbenchState;

interface StartNodeEditCommand extends Command {
  type: CommandType.StartEditingNode;
  toEdit: string;
}

interface MoveNodeCommand extends Command {
  type: CommandType.MoveNode;
  nodeId: string;
  newCoords: number[];
}

interface LinkNodesCommand extends Command {
  type: CommandType.LinkNodes;
  /**
   * The node at whose output the link starts
   */
  fromNodeId: string;
  /**
   * The node at whose input the link terminates
   */
  toNodeId: string;
  /**
   * The id of the input at which the link terminates
   */
  toInputId: string;
}

interface UnlinkNodesCommand extends Command {
  type: CommandType.UnlinkNodes;
  /**
   * The node at whose output the link starts
   */
  fromNodeId: string;
  /**
   * The node at whose input the link terminates
   */
  toNodeId: string;
  /**
   * The id of the input at which the link terminates
   */
  toInputId: string;
}

interface DeleteNodeCommand extends Command {
  type: CommandType.DeleteNode;
  /**
   * The node at whose output the link starts
   */
  nodeIdToDelete: string;
}

const startNodeEdit: WorkbenchReducer = (oldState, action) =>
  Immutable.merge(oldState, {
    currentlyEditing: (action as StartNodeEditCommand).toEdit,
  });

const moveNode: WorkbenchReducer = (oldState, action) => {
  const a = action as MoveNodeCommand;
  return Immutable.setIn(
    oldState,
    ["beliefs", "nodes", a.nodeId, "coords"],
    a.newCoords
  );
};

const linkNode: WorkbenchReducer = (oldState, action) => {
  const a = action as LinkNodesCommand;
  const child = oldState.beliefs.nodes[a.toNodeId];
  if ("parents" in child && a.toInputId in child.parents) {
    const parentIds = child.parents[a.toInputId];
    if (!parentIds.includes(a.fromNodeId)) {
      return Immutable.setIn(
        oldState,
        ["beliefs", "nodes", a.toNodeId, "parents", a.toInputId],
        parentIds.concat(a.fromNodeId)
      );
    }
  }
  return oldState;
};

const unlinkNode: WorkbenchReducer = (oldState, action) => {
  const a = action as LinkNodesCommand;
  const child = oldState.beliefs.nodes[a.toNodeId];
  if ("parents" in child && a.toInputId in child.parents) {
    const parentIds = child.parents[a.toInputId];
    if (parentIds.includes(a.fromNodeId)) {
      return Immutable.setIn(
        oldState,
        ["beliefs", "nodes", a.toNodeId, "parents", a.toInputId],
        parentIds.filter((nodeId) => nodeId !== a.fromNodeId)
      );
    }
  }
  return oldState;
};

const deleteNode: WorkbenchReducer = (oldState, action) => {
  const a = action as DeleteNodeCommand;
  const oldBranch = oldState.beliefs.nodes;
  const newBranch = Immutable.without(oldBranch, a.nodeIdToDelete);
  const withoutNode = Immutable.setIn(
    oldState,
    ["beliefs", "nodes"],
    newBranch
  );

  const deleteFromParentsList = (parentList: Array<string>) =>
    parentList.filter((parent: string) => parent !== a.nodeIdToDelete);

  const deleteFromDescendantWithParents = (
    node: Network.NodeWithParents
  ): Network.Node =>
    Immutable.set(
      node,
      "parents",
      Immutable.asObject(
        Object.entries(node.parents).map(
          ([portId, parentList]: [string, Array<string>]) => {
            return [portId, deleteFromParentsList(parentList)];
          }
        )
      )
    );

  const deleteFromDescendant = (node: Network.Node): Network.Node =>
    "parents" in node ? deleteFromDescendantWithParents(node) : node;

  return Immutable.setIn(
    withoutNode,
    ["beliefs", "nodes"],
    Immutable.asObject(
      (Object.entries(withoutNode.beliefs.nodes) as Array<
        [string, Network.Node]
      >).map(([nodeId, node]: [string, Network.Node]) => [
        nodeId,
        deleteFromDescendant(node),
      ])
    )
  );
};

type DispatchTable = WorkbenchReducer[];
const dispatchTable = createDispatchTable();
function createDispatchTable() {
  let dispatchTable: DispatchTable = [];
  dispatchTable[CommandType.NoOp] = (state, _action) => state;
  dispatchTable[CommandType.StartEditingNode] = startNodeEdit;
  dispatchTable[CommandType.MoveNode] = moveNode;
  dispatchTable[CommandType.LinkNodes] = linkNode;
  dispatchTable[CommandType.UnlinkNodes] = unlinkNode;
  dispatchTable[CommandType.DeleteNode] = deleteNode;
  return dispatchTable;
}

function log(message: string) {
  console.log(message);
}

function createDispatchers(dispatch: React.Dispatch<Command>) {
  return {
    dispatchStartNodeEdit: (toEdit: string) => {
      const cmd: StartNodeEditCommand = {
        type: CommandType.StartEditingNode,
        toEdit: toEdit,
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
    dispatchLinkNodes: (
      fromNodeId: string,
      toNodeId: string,
      toInputId: string
    ) => {
      const cmd: LinkNodesCommand = {
        fromNodeId: fromNodeId,
        toNodeId: toNodeId,
        toInputId: toInputId,
        type: CommandType.LinkNodes,
      };
      return dispatch(cmd);
    },
    dispatchUnlinkNodes: (
      fromNodeId: string,
      toNodeId: string,
      toInputId: string
    ) => {
      const cmd: UnlinkNodesCommand = {
        fromNodeId: fromNodeId,
        toNodeId: toNodeId,
        toInputId: toInputId,
        type: CommandType.UnlinkNodes,
      };
      return dispatch(cmd);
    },
    dispatchDeleteNode: (nodeIdToDelete: string) => {
      const cmd: DeleteNodeCommand = {
        type: CommandType.DeleteNode,
        nodeIdToDelete: nodeIdToDelete,
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
          version="v0.0.1"
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
