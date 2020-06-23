import * as Network from "./nodes_type";
import { EditorState } from "./editor-state";

const Immutable = require("seamless-immutable");

export type WorkbenchState = {
  /** The beliefs being edited */
  beliefs: {
    nodes: Network.Nodes;
    language: string;
    modelName: string;
  };
  /** The current key of the node currently being edited (or null if not
   *  editing a node.) */
  currentlyEditing: string | null;
  /**
   * The properties the edited node will have (if it is the right type)
   *
   * This is also the state of the node editor form.
   */
  newProperties: EditorState;
  /** The URL for storing the current beliefs */
  currentURL: string | null;
};

/**
 * Map over all ports in all nodes, returning a copy that replaces the list of parents for
 * a given port with the return editorState for a the callback
 * @param oldState The state to be modified
 * @param callback The callback that updates the parents list
 */
export function mapParents(
  oldState: WorkbenchState,
  callback: (nodeId: string, portId: string, parents: string[]) => string[]
): WorkbenchState {
  return Immutable.setIn(
    oldState,
    ["beliefs", "nodes"],
    Immutable.asObject(
      Object.entries(oldState.beliefs.nodes).map(([nodeId, node]) => [
        nodeId,
        "parents" in node
          ? Immutable.merge(node, {
              parents: Immutable.asObject(
                Object.entries(node.parents).map(([portId, parentIds]) => [
                  portId,
                  callback(nodeId, portId, parentIds),
                ])
              ),
            })
          : node,
      ])
    )
  );
}
