import {
  cancelNodeEdit,
  deleteNode,
  finishNodeEdit,
  linkNode,
  moveNode,
  startNodeEdit,
  unlinkNode,
  updateEditorState,
  WorkbenchReducer,
} from "./workbench-reducers";
import {
  CancelNodeEditCommand,
  Command,
  CommandType,
  DeleteNodeCommand,
  FinishNodeEditCommand,
  LinkNodesCommand,
  MoveNodeCommand,
  StartNodeEditCommand,
  UnlinkNodesCommand,
  UpdateEditorStateCommand,
} from "./commands";
import React from "react";
import { EditorState } from "./editor-state";

type DispatchTable = WorkbenchReducer[];
const dispatchTable = createDispatchTable();

function createDispatchTable() {
  let dispatchTable: DispatchTable = [];
  dispatchTable[CommandType.NoOp] = (state, _action) => state;
  dispatchTable[CommandType.StartEditingNode] = startNodeEdit;
  dispatchTable[CommandType.CancelEditingNode] = cancelNodeEdit;
  dispatchTable[CommandType.FinishEditingNode] = finishNodeEdit;
  dispatchTable[CommandType.UpdateEditorState] = updateEditorState;
  dispatchTable[CommandType.MoveNode] = moveNode;
  dispatchTable[CommandType.LinkNodes] = linkNode;
  dispatchTable[CommandType.UnlinkNodes] = unlinkNode;
  dispatchTable[CommandType.DeleteNode] = deleteNode;
  return dispatchTable;
}

function log(message: string) {
  console.log(message);
}

export function createDispatchers(dispatch: React.Dispatch<Command>) {
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
    dispatchUpdateEditorState: (newState: EditorState) => {
      const cmd: UpdateEditorStateCommand = {
        type: CommandType.UpdateEditorState,
        newState: newState,
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

export const stateTransition: WorkbenchReducer = (state, action) => {
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
