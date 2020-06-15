export type DistributionType =
  | "ContinuousUniform"
  //    "Gaussian" |
  //    "PiecewiseConstant" | // Sorted list of bin medians, equal probability
  //    "EmpiricalBins" | // Like piecewise constant except that the first and last bins are scaled exponential distributions rather than scaled continuous uniform
  | "DiscreteUniform";

export type NodeType =
  | "DistributionNode"
  | "FunctionNode"
  | "ConstantNode"
  | "ConstraintNode"
  | "VisualizationNode";

/// Different deterministic functions to apply. All of these should do
/// something reasonable when given inputs of the wrong type. But there
/// should be an optional strict mode that highlights type errors and
/// forces the user to do something about them.
export type FunctionType =
  | "Plus" // Add its numeric inputs
  | "Multiply" // Multiply its numeric inputs
  | "Divide" // Divide its numeric inputs by the last one
  | "Round" // Round its numeric inputs to the nearest integer
  | "Ceil" // Round up
  | "Floor" // Round down
  | "AreEqual" // Are its inputs equal
  | "MakeArray" // Return an array made of its inputs. Input arrays are made an entry in the result
  | "ConcatArrays" // Return the array made from concatenating its input arrays
  | "ArrayElement" // Select the given element from its input array - can perform the function of if to make mixture distributions
  | "ArrayLength" // Return the length of the input array
  | "IntRange"; // Generate a vector of integers from first, size, step

export interface NodeBase {
  // The unique title string (which is also the node id) is the key in the Nodes map
  type: NodeType;
  justification: string;
  coords: number[];
}

export interface NodeWithParents extends NodeBase {
  /// The parents of the given node ... along with which parameter
  /// they attach to.
  ///
  /// I made parents part of the node structure rather than having
  /// separate edge objects because I think it will be easier
  /// to follow in the Github diffs
  parents: {
    [inputName: string]: string[]; //Parent ids
  };
}

export interface DistributionNode extends NodeWithParents {
  type: "DistributionNode";
  distribution: DistributionType;
}

export interface FunctionNode extends NodeWithParents {
  type: "FunctionNode";
  function: FunctionType;
}

/// The names of the primitive types for the Belief Workbench graph language
export type PrimitiveType = "bool" | "int" | "double" | "string" | "array";

/// The Javascript type of a variable that can hold all PrimitiveType
export type PrimitiveActualType =
  | boolean
  | number
  | string
  | PrimitiveActualType[];

export interface ConstantNode extends NodeBase {
  type: "ConstantNode";
  value: PrimitiveActualType;
}

export type VisualizationType = "1DHistogram" | "2DColorForProbability";

export interface VisualizationNode extends NodeWithParents {
  type: "VisualizationNode";
  visualization: VisualizationType;
}

export type Node =
  | DistributionNode
  | FunctionNode
  | ConstantNode
  | VisualizationNode;

export interface Nodes {
  [node_id: string]: Node;
}

export type DistributionPropertyMap = {
  [distributionType in DistributionType]: {
    name: string;
    inputs: {
      [input_name: string]: PrimitiveType;
    };
  };
};

// export const distributions: DistributionPropertyMap = {
//   DiscreteUniform: {
//     name: "Discrete Uniform Choice",
//     inputs: {
//       choices: "array",
//     },
//   },
//   ContinuousUniform: {
//     name: "Continuous Uniform",
//     inputs: {
//       min: "double",
//       max: "double",
//     },
//   },
// };
