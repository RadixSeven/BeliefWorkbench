import {
  Command,
  DeleteNodeCommand,
  LinkNodesCommand,
  MoveNodeCommand,
  StartNodeEditCommand,
  UpdateEditorStateCommand,
} from "./commands";
import { checkConstantValue, EditorState } from "./editor-state";
import { mapParents, WorkbenchState } from "./workbench-state";
import * as Network from "./nodes_type";
import {
  ConstantNode,
  ConstraintNode,
  DistributionNode,
  FunctionNode,
  nodeProps,
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
    case "ConstantNode": {
      const nodeVal = (node as ConstantNode).value;
      const strVal: string =
        typeof nodeVal === "number"
          ? "" + nodeVal
          : typeof nodeVal === "string"
          ? nodeVal
          : JSON.stringify(nodeVal);
      return {
        ...baseValues,
        valueType: (node as ConstantNode).valueType,
        value: strVal,
      };
    }
    case "ConstraintNode": {
      const nodeVal = (node as ConstraintNode).value;
      const strVal: string =
        typeof nodeVal === "number"
          ? "" + nodeVal
          : typeof nodeVal === "string"
          ? nodeVal
          : JSON.stringify(nodeVal);
      return {
        ...baseValues,
        valueType: (node as ConstraintNode).valueType,
        value: strVal,
      };
    }
    case "VisualizationNode":
      return {
        ...baseValues,
        visualization: (node as VisualizationNode).visualization,
      };
  }
}

/**
 * Return the new properties for a node, given the edited version
 * @param node The original editorState of the node
 * @param edited The edited node
 */
function newNodeProperties(
  node: Network.Node,
  edited: EditorState
): { newNodeVal: Network.Node | null; errorMessages: string[] } {
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

  const { isValid, parsedValue, messages } = checkConstantValue(
    edited.value,
    edited.valueType
  );
  if (nodeProps[edited.type].hasValueField && !isValid) {
    console.error(
      `Invalid node value specified by editor. ${edited.value} is not an example of the "${edited.valueType}" type. Specific errors:\n` +
        messages.join("\n")
    );
    return { newNodeVal: null, errorMessages: messages };
  }
  switch (edited.type) {
    case "ConstraintNode":
      return {
        newNodeVal: {
          type: edited.type,
          justification: edited.justification,
          coords: node.coords,
          parents: parents(),
          valueType: edited.valueType,
          value: parsedValue,
        },
        errorMessages: [],
      };
    case "DistributionNode":
      return {
        newNodeVal: {
          type: edited.type,
          justification: edited.justification,
          coords: node.coords,
          parents: parents(),
          distribution: edited.distribution,
        },
        errorMessages: [],
      };
    case "FunctionNode":
      return {
        newNodeVal: {
          type: edited.type,
          justification: edited.justification,
          coords: node.coords,
          parents: parents(),
          function: edited.function,
        },
        errorMessages: [],
      };
    case "ConstantNode":
      return {
        newNodeVal: {
          type: edited.type,
          justification: edited.justification,
          coords: node.coords,
          valueType: edited.valueType,
          value: parsedValue,
        },
        errorMessages: [],
      };
    case "VisualizationNode":
      return {
        newNodeVal: {
          type: edited.type,
          justification: edited.justification,
          coords: node.coords,
          parents: parents(),
          visualization: edited.visualization,
        },
        errorMessages: [],
      };
  }
  // This should be unreachable
  console.warn(
    `Editor returning unknown node type: ${node.type} Coercing to ` +
      "constant node."
  );
  return {
    newNodeVal: {
      type: "ConstantNode",
      justification: edited.justification,
      coords: node.coords,
      valueType: edited.valueType,
      value: edited.value,
    },
    errorMessages: [`Editor returning unknown node type: ${node.type}`],
  };
}

export type WorkbenchReducer = (
  state: WorkbenchState,
  action: Command
) => WorkbenchState;

function defaultNodeWithUniqueTitle(
  state: WorkbenchState
): { newNode: Network.Node; newNodeTitle: string } {
  const extantTitles = Object.keys(state.beliefs.nodes);
  let i = 0;
  let newNodeTitle;
  do {
    i += 1;
    newNodeTitle = `Node ${i}`;
  } while (extantTitles.includes(newNodeTitle));
  return {
    newNode: {
      justification: "",
      type: "ConstantNode",
      coords: [100, 100],
      valueType: "Number",
      value: 0,
    },
    newNodeTitle: newNodeTitle,
  };
}

export const addNode: WorkbenchReducer = (oldState, _action) => {
  const { newNode, newNodeTitle } = defaultNodeWithUniqueTitle(oldState);
  return Immutable.merge(oldState, {
    currentlyEditing: newNodeTitle,
    newProperties: {
      ...editorProperties(newNode),
      title: newNodeTitle,
    },
    beliefs: Immutable.merge(oldState.beliefs, {
      nodes: Immutable.merge(oldState.beliefs.nodes, {
        [newNodeTitle]: newNode,
      }),
    }),
  });
};

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
  const { newNodeVal, errorMessages } = newNodeProperties(
    oldState.beliefs.nodes[toEdit],
    edited
  );
  if (edited.title !== toEdit && edited.title in oldState.beliefs.nodes) {
    console.error(
      `Attempt to change the title to one already in the network: ${edited.title}.`
    );
    return oldState;
  }
  if (newNodeVal === null) {
    console.error(
      `An unusable edit got past the node validation and submit was called. Ignoring. The program will remain in edit mode. The value of the bad node was ${JSON.stringify(
        toEdit
      )}\nError messages: ${JSON.stringify(errorMessages)}`
    );
    return oldState;
  }
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

export const updateEditorState: WorkbenchReducer = (oldState, action) => {
  return Immutable.merge(oldState, {
    newProperties: (action as UpdateEditorStateCommand).newState,
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
  valueType: "Number",
  value: "0",
};
