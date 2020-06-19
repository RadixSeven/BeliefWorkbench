export enum CommandType {
  NoOp,
  StartEditingNode,
  CancelEditingNode,
  FinishEditingNode,
  MoveNode,
  LinkNodes,
  UnlinkNodes,
  DeleteNode,
}

export interface Command {
  type: CommandType;
}

export interface StartNodeEditCommand extends Command {
  type: CommandType.StartEditingNode;
  toEdit: string;
}

export interface CancelNodeEditCommand extends Command {
  type: CommandType.CancelEditingNode;
}

export interface FinishNodeEditCommand extends Command {
  type: CommandType.FinishEditingNode;
}

export interface MoveNodeCommand extends Command {
  type: CommandType.MoveNode;
  nodeId: string;
  newCoords: number[];
}

export interface LinkNodesCommand extends Command {
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

export interface UnlinkNodesCommand extends Command {
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

export interface DeleteNodeCommand extends Command {
  type: CommandType.DeleteNode;
  /**
   * The node at whose output the link starts
   */
  nodeIdToDelete: string;
}
