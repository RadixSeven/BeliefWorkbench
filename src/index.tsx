import React, { useReducer } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import "beautiful-react-diagrams/styles.css";
import Editor from "./Editor";
import nodes from "./nodes";
import * as Network from "./nodes_type";
import {
  ConstantNode,
  DistributionNode,
  FunctionNode,
  VisualizationNode,
} from "./nodes_type";
import { EditorState } from "./editor-state";
import { mapParents, WorkbenchState } from "./workbench-state";

const Immutable = require("seamless-immutable");

const defaultEditorState: EditorState = {
  title: "",
  justification: "",
  type: "ConstantNode",
  distribution: "DiscreteUniform",
  function: "Add",
  visualization: "1DHistogram",
  value: 0,
};

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

enum CommandType {
  NoOp,
  StartEditingNode,
  CancelEditingNode,
  FinishEditingNode,
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

interface CancelNodeEditCommand extends Command {
  type: CommandType.CancelEditingNode;
}

interface FinishNodeEditCommand extends Command {
  type: CommandType.FinishEditingNode;
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

function editorProperties(node: Network.Node): EditorState {
  const baseValues = {
    ...defaultEditorState,
    type: node.type,
    justification: node.justification,
  };
  switch (node.type) {
    case "DistributionNode":
      return {
        ...baseValues,
        distribution: (node as DistributionNode).distribution,
      };
    case "FunctionNode":
      return {
        ...baseValues,
        function: (node as FunctionNode).function,
      };
    case "ConstantNode":
      return {
        ...baseValues,
        value: (node as ConstantNode).value,
      };
    case "VisualizationNode":
      return {
        ...baseValues,
        visualization: (node as VisualizationNode).visualization,
      };
  }
}

/**
 * Return the new properties for a node, given the edited version
 * @param node The original value of the node
 * @param edited The edited node
 */
function newNodeProperties(
  node: Network.Node,
  edited: EditorState
): Network.Node {
  const parents = () =>
    edited.type === node.type
      ? (node as Network.NodeWithParents).parents
      : // Right now, we remove all parents if we change node type.
        // In the future, we can try to match old and new parents better.
        // For example, if there is only one input and it is the same
        // type, we can just reuse it.
        Network.emptyParentsMember(
          edited.type,
          edited.distribution,
          edited.function,
          edited.visualization
        ).parents;

  switch (edited.type) {
    case "DistributionNode":
      return {
        type: edited.type,
        justification: edited.justification,
        coords: node.coords,
        parents: parents(),
        distribution: edited.distribution,
      };
    case "FunctionNode":
      return {
        type: edited.type,
        justification: edited.justification,
        coords: node.coords,
        parents: parents(),
        function: edited.function,
      };
    case "ConstantNode":
      return {
        type: edited.type,
        justification: edited.justification,
        coords: node.coords,
        value: edited.value,
      };
    case "VisualizationNode":
      return {
        type: edited.type,
        justification: edited.justification,
        coords: node.coords,
        parents: parents(),
        visualization: edited.visualization,
      };
  }
  // This should be unreachable
  console.warn(
    `Editor returning unknown node type: ${node.type} Coercing to ` +
      "constant node."
  );
  return {
    type: "ConstantNode",
    justification: edited.justification,
    coords: node.coords,
    value: edited.value,
  };
}

const startNodeEdit: WorkbenchReducer = (oldState, action) => {
  const toEdit = (action as StartNodeEditCommand).toEdit;
  return Immutable.merge(oldState, {
    currentlyEditing: toEdit,
    newProperties: {
      ...editorProperties(oldState.beliefs.nodes[toEdit]),
      title: toEdit,
    },
  });
};

const finishNodeEdit: WorkbenchReducer = (oldState, _action) => {
  const toEdit = oldState.currentlyEditing;
  if (!(toEdit && toEdit in oldState.beliefs.nodes)) {
    console.error(
      "Tried to finish editing but the record of the node being " +
        "edited was corrupted. It read: " +
        JSON.stringify(toEdit)
    );
    // Cancel the bad edit
    return Immutable.merge(oldState, {
      currentlyEditing: null,
    });
  }
  const edited = oldState.newProperties;
  const newNodeVal = newNodeProperties(oldState.beliefs.nodes[toEdit], edited);
  const withCorrectTitle =
    edited.title === toEdit
      ? oldState
      : (() => {
          // Rename this node in all its descendants
          const renamed = mapParents(oldState, (nodeId, portId, parentIds) =>
            parentIds.map((id: string) => (id === toEdit ? edited.title : id))
          );
          // Remove the node with the old title
          return Immutable.setIn(
            renamed,
            ["beliefs", "nodes"],
            Immutable.without(renamed.beliefs.nodes, toEdit)
          );
        })();
  const newBeliefs = Immutable.setIn(
    withCorrectTitle,
    ["beliefs", "nodes", edited.title],
    newNodeVal
  );

  return Immutable.merge(newBeliefs, {
    currentlyEditing: null,
  });
};

const cancelNodeEdit: WorkbenchReducer = (oldState, _action) => {
  return Immutable.merge(oldState, {
    currentlyEditing: null,
  });
};

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

  return mapParents(withoutNode, (nodeId, portId, parentIds) =>
    parentIds.filter((id) => id !== a.nodeIdToDelete)
  );
};

type DispatchTable = WorkbenchReducer[];
const dispatchTable = createDispatchTable();
function createDispatchTable() {
  let dispatchTable: DispatchTable = [];
  dispatchTable[CommandType.NoOp] = (state, _action) => state;
  dispatchTable[CommandType.StartEditingNode] = startNodeEdit;
  dispatchTable[CommandType.CancelEditingNode] = cancelNodeEdit;
  dispatchTable[CommandType.FinishEditingNode] = finishNodeEdit;
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
    dispatchCancelNodeEdit: () => {
      const cmd: CancelNodeEditCommand = {
        type: CommandType.CancelEditingNode,
      };
      return dispatch(cmd);
    },
    dispatchFinishNodeEdit: () => {
      const cmd: FinishNodeEditCommand = {
        type: CommandType.FinishEditingNode,
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
