import {
  Union,
  Literal,
  Static,
  Array,
  String,
  Record,
  Dictionary,
  Number,
  Boolean,
} from "runtypes";

export const DistributionTypeR = Union(
  Literal("ContinuousUniform"),
  //    Literal("Gaussian"),
  //    Literal("PiecewiseConstant"), // Sorted list of bin medians, equal probability
  //    Literal("EmpiricalBins"), // Like piecewise constant except that the first and last bins are scaled exponential distributionProps rather than scaled continuous uniform
  Literal("DiscreteUniform")
);
export type DistributionType = Static<typeof DistributionTypeR>;

export const NodeTypeR = Union(
  Literal("DistributionNode"),
  Literal("FunctionNode"),
  Literal("ConstantNode"),
  Literal("ConstraintNode"),
  Literal("VisualizationNode")
);
export type NodeType = Static<typeof NodeTypeR>;

/// Different deterministic functions to apply. All of these should do
/// something reasonable when given inputs of the wrong type. But there
/// should be an optional strict mode that highlights type errors and
/// forces the user to do something about them.
export const FunctionTypeR = Union(
  Literal("Add"), // Add its numeric inputs
  Literal("Multiply"), // Multiply its numeric inputs
  Literal("Divide"), // Divide its numeric inputs by the last one
  Literal("Round"), // Round its numeric inputs to the nearest integer
  Literal("Ceil"), // Round up
  Literal("Floor"), // Round down
  Literal("AreEqual"), // Are its inputs equal
  Literal("MakeArray"), // Return an array made of its inputs. Input arrays are made an entry in the result
  Literal("ConcatArrays"), // Return the array made from concatenating its input arrays
  Literal("ArrayElement"), // Select the given element from its input array - can perform the function of if to make mixture distributionProps
  Literal("ArrayLength"), // Return the length of the input array
  Literal("IntRange")
); // Generate a vector of integers from first, size, step
export type FunctionType = Static<typeof FunctionTypeR>;

export const VisualizationTypeR = Union(
  Literal("1DHistogram"),
  Literal("2DColorForProbability")
);
export type VisualizationType = Static<typeof VisualizationTypeR>;

export const DistributionNodeR = Record({
  // The unique title string (which is also the node id) is the key in the Nodes map
  justification: String,
  coords: Array(Number),
  /// The parents of the given node ... along with which parameter
  /// they attach to.
  ///
  /// I made parents part of the node structure rather than having
  /// separate edge objects because I think it will be easier
  /// to follow in the Github diffs
  parents: Dictionary(Array(String), "string"),
  type: Literal("DistributionNode"),
  distribution: DistributionTypeR,
});
export type DistributionNode = Static<typeof DistributionNodeR>;

export const FunctionNodeR = Record({
  // The unique title string (which is also the node id) is the key in the Nodes map
  justification: String,
  coords: Array(Number),
  /// The parents of the given node ... along with which parameter
  /// they attach to.
  ///
  /// I made parents part of the node structure rather than having
  /// separate edge objects because I think it will be easier
  /// to follow in the Github diffs
  parents: Dictionary(Array(String), "string"),
  type: Literal("FunctionNode"),
  function: FunctionTypeR,
});
export type FunctionNode = Static<typeof FunctionNodeR>;

/// The names of the primitive types for the Belief Workbench graph language
export const PrimitiveTypeR = Union(
  Literal("bool"),
  Literal("int"),
  Literal("double"),
  Literal("string"),
  Literal("array")
);
export type PrimitiveType = Static<typeof PrimitiveTypeR>;

/// The Javascript type of a variable that can hold all PrimitiveType
export const PrimitiveActualTypeR0 = Union(Boolean, Number, String);
export const PrimitiveActualTypeR1 = Union(
  PrimitiveActualTypeR0,
  Array(PrimitiveActualTypeR0)
);
export const PrimitiveActualTypeR2 = Union(
  PrimitiveActualTypeR1,
  Array(PrimitiveActualTypeR1)
);
export const PrimitiveActualTypeR3 = Union(
  PrimitiveActualTypeR2,
  Array(PrimitiveActualTypeR2)
);
export const PrimitiveActualTypeR4 = Union(
  PrimitiveActualTypeR3,
  Array(PrimitiveActualTypeR3)
);
export const PrimitiveActualTypeR5 = Union(
  PrimitiveActualTypeR4,
  Array(PrimitiveActualTypeR4)
);
export const PrimitiveActualTypeR6 = Union(
  PrimitiveActualTypeR5,
  Array(PrimitiveActualTypeR5)
);
export const PrimitiveActualTypeR = Union(
  PrimitiveActualTypeR6,
  Array(PrimitiveActualTypeR6)
);
export type PrimitiveActualType = Static<typeof PrimitiveActualTypeR>;

export const ConstantNodeR = Record({
  // The unique title string (which is also the node id) is the key in the Nodes map
  justification: String,
  coords: Array(Number),
  type: Literal("ConstantNode"),
  value: PrimitiveActualTypeR,
});
export type ConstantNode = Static<typeof ConstantNodeR>;

export const VisualizationNodeR = Record({
  // The unique title string (which is also the node id) is the key in the Nodes map
  justification: String,
  coords: Array(Number),
  /// The parents of the given node ... along with which parameter
  /// they attach to.
  ///
  /// I made parents part of the node structure rather than having
  /// separate edge objects because I think it will be easier
  /// to follow in the Github diffs
  parents: Dictionary(Array(String), "string"),
  type: Literal("VisualizationNode"),
  visualization: VisualizationTypeR,
});
export type VisualizationNode = Static<typeof VisualizationNodeR>;

export const NodeWithParentsR = Union(
  DistributionNodeR,
  FunctionNodeR,
  VisualizationNodeR
);
export type NodeWithParents = Static<typeof NodeWithParentsR>;

export const NodeR = Union(NodeWithParentsR, ConstantNodeR);
export type Node = Static<typeof NodeR>;

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

export type NodePropertyMap = {
  [type in NodeType]: {
    name: string;
  };
};

export const nodeProps: NodePropertyMap = {
  DistributionNode: { name: "Distribution" },
  FunctionNode: { name: "Function" },
  VisualizationNode: { name: "Visualization" },
  ConstantNode: { name: "Assumed Value" },
  ConstraintNode: { name: "Constraint" },
};

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
