import {
  Command,
  DeleteNodeCommand,
  LinkNodesCommand,
  MoveNodeCommand,
  StartNodeEditCommand,
} from "./commands";
import { EditorState } from "./editor-state";
import { mapParents, WorkbenchState } from "./workbench-state";
import * as Network from "./nodes_type";
import {
  ConstantNode,
  DistributionNode,
  FunctionNode,
  VisualizationNode,
} from "./nodes_type";

const Immutable = require("seamless-immutable");

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

export type WorkbenchReducer = (
  state: WorkbenchState,
  action: Command
) => WorkbenchState;
export const startNodeEdit: WorkbenchReducer = (oldState, action) => {
  const toEdit = (action as StartNodeEditCommand).toEdit;
  return Immutable.merge(oldState, {
    currentlyEditing: toEdit,
    newProperties: {
      ...editorProperties(oldState.beliefs.nodes[toEdit]),
      title: toEdit,
    },
  });
};
export const finishNodeEdit: WorkbenchReducer = (oldState, _action) => {
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
export const cancelNodeEdit: WorkbenchReducer = (oldState, _action) => {
  return Immutable.merge(oldState, {
    currentlyEditing: null,
  });
};
export const moveNode: WorkbenchReducer = (oldState, action) => {
  const a = action as MoveNodeCommand;
  return Immutable.setIn(
    oldState,
    ["beliefs", "nodes", a.nodeId, "coords"],
    a.newCoords
  );
};
export const linkNode: WorkbenchReducer = (oldState, action) => {
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
export const unlinkNode: WorkbenchReducer = (oldState, action) => {
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
export const deleteNode: WorkbenchReducer = (oldState, action) => {
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
export const defaultEditorState: EditorState = {
  title: "",
  justification: "",
  type: "ConstantNode",
  distribution: "DiscreteUniform",
  function: "Add",
  visualization: "1DHistogram",
  value: 0,
};
