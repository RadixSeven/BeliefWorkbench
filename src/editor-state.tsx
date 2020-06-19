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

export const stubEditorState: EditorState = {
  title: "Stub Title",
  justification: "Stub justification",
  type: "DistributionNode",
  distribution: "ContinuousUniform",
  function: "Add",
  visualization: "1DHistogram",
  value: 0,
};
