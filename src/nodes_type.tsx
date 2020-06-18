export type DistributionType =
  | "ContinuousUniform"
  //    "Gaussian" |
  //    "PiecewiseConstant" | // Sorted list of bin medians, equal probability
  //    "EmpiricalBins" | // Like piecewise constant except that the first and last bins are scaled exponential distributionProps rather than scaled continuous uniform
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
  | "Add" // Add its numeric inputs
  | "Multiply" // Multiply its numeric inputs
  | "Divide" // Divide its numeric inputs by the last one
  | "Round" // Round its numeric inputs to the nearest integer
  | "Ceil" // Round up
  | "Floor" // Round down
  | "AreEqual" // Are its inputs equal
  | "MakeArray" // Return an array made of its inputs. Input arrays are made an entry in the result
  | "ConcatArrays" // Return the array made from concatenating its input arrays
  | "ArrayElement" // Select the given element from its input array - can perform the function of if to make mixture distributionProps
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

/**
 * Return true if this type of node has parents. Type reflection would
 * be better, but it is so clunky in Javascript that I'm just going
 * to deal with the maintenance headaches of not having it
 * @param type The type being queried
 */
export function hasParents(type: NodeType) {
  return type !== "ConstantNode";
}

export interface Nodes {
  [node_id: string]: Node;
}

export interface TypeProperties {
  name: string;
  inputs: {
    [input_name: string]: PrimitiveType;
  };
}

function emptyParentsMemberFromProperties(props: TypeProperties) {
  return {
    parents: Object.fromEntries(
      Object.keys(props.inputs).map((inputName) => [inputName, []])
    ),
  };
}

export type DistributionPropertyMap = {
  [type in DistributionType]: TypeProperties;
};

export const distributionProps: DistributionPropertyMap = {
  DiscreteUniform: {
    name: "Discrete Uniform Choice",
    inputs: {
      choices: "array",
    },
  },
  ContinuousUniform: {
    name: "Continuous Uniform",
    inputs: {
      min: "double",
      max: "double",
    },
  },
};

export type FunctionPropertyMap = {
  [type in FunctionType]: TypeProperties;
};

export const functionProps: FunctionPropertyMap = {
  Add: { name: "Add", inputs: { toAdd: "array" } },
  Multiply: { name: "Multiply", inputs: { toMultiply: "array" } },
  Divide: {
    name: "Divide",
    inputs: { numerator: "array", denominator: "double" },
  },
  Round: { name: "Round", inputs: { toRound: "array" } },
  Ceil: { name: "Ceil", inputs: { toCeil: "array" } },
  Floor: { name: "Floor", inputs: { toFloor: "array" } },
  AreEqual: { name: "Are Equal", inputs: { toCheck: "array" } },
  MakeArray: { name: "Make Array", inputs: { toCombine: "array" } },
  ConcatArrays: { name: "Concatenate Arrays", inputs: { toConcat: "array" } },
  ArrayElement: {
    name: "Array Element",
    inputs: { array: "array", index: "int" },
  },
  ArrayLength: { name: "Array Length", inputs: { array: "array" } },
  IntRange: {
    name: "Integer Range",
    inputs: { first: "int", size: "int", step: "int" },
  },
};

export type VisualizationPropertyMap = {
  [type in VisualizationType]: TypeProperties;
};

export const visualizationProps: VisualizationPropertyMap = {
  "1DHistogram": { name: "1-D Histogram", inputs: { variables: "array" } },
  "2DColorForProbability": {
    name: "2-D Color for Probability ",
    inputs: { variable1: "array", variable2: "array" },
  },
};

type EmptyParentType = { parents: { [inputName: string]: string[] } };

export function emptyParentsMember(
  type: NodeType,
  distribution: DistributionType,
  func: FunctionType,
  visualization: VisualizationType
): EmptyParentType {
  switch (type) {
    case "FunctionNode":
      return emptyParentsMemberFromProperties(functionProps[func]);
    case "ConstantNode": {
      console.error(
        "emptyParentsMember called for a constant node (they do not have parents)"
      );
      return { parents: {} };
    }
    case "ConstraintNode":
      return { parents: { toConstrain: [] } };
    case "VisualizationNode":
      return emptyParentsMemberFromProperties(
        visualizationProps[visualization]
      );
    case "DistributionNode":
      return emptyParentsMemberFromProperties(distributionProps[distribution]);
  }
  console.warn(`emptyParentsMember called for unknown node type: "${type}"`);
  return { parents: {} };
}
