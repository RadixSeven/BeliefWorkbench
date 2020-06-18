import * as Network from "./nodes_type";

/**
 * The state of the Node editor form.
 */
export type EditorState = {
  title: string;
  justification: string;
  type: Network.NodeType;
  distribution: Network.DistributionType;
  function: Network.FunctionType;
  visualization: Network.VisualizationType;
  value: Network.PrimitiveActualType;
};
