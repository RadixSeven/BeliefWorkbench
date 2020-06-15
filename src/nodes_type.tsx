import {
  ImmutableTypedMap as Immutable,
  createTypedMap,
} from "./immutable-typed-map";
import { List as IList, Map as IMap } from "immutable";

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

interface NodeBaseMutable {
  // The unique title string (which is also the node id) is the key in the Nodes map
  type: NodeType;
  justification: string;
  //  coords: IList<number>;
  coords: number[];
}

export type NodeBase = Immutable<NodeBaseMutable>;

export type InputId = string;
export type NodeId = string;

/**
 * The parents of the given node ... along with which parameter
 * they attach to.
 *
 * I made parents part of the node structure rather than having
 * separate edge objects because I think it will be easier
 * to follow in the Github diffs
 */
interface NodeWithParentsMutable extends NodeBaseMutable {
  /** Parent ids: Key is the name of the input and the values are the */
  parents: IMap<InputId, IList<NodeId>>;
}
export type NodeWithParents = Immutable<NodeWithParentsMutable>;

interface DistributionNodeMutable extends NodeWithParentsMutable {
  type: "DistributionNode";
  distribution: DistributionType;
}
export type DistributionNode = Immutable<DistributionNodeMutable>;

interface FunctionNodeMutable extends NodeWithParentsMutable {
  type: "FunctionNode";
  function: FunctionType;
}
export type FunctionNode = Immutable<FunctionNodeMutable>;

/// The names of the primitive types for the Belief Workbench graph language
export type PrimitiveType = "bool" | "int" | "double" | "string" | "array";

/// The Javascript type of a variable that can hold all PrimitiveType
export type PrimitiveActualType =
  | boolean
  | number
  | string
  | PrimitiveActualType[];

interface ConstantNodeMutable extends NodeBaseMutable {
  type: "ConstantNode";
  value: PrimitiveActualType;
}
export type ConstantNode = Immutable<ConstantNodeMutable>;

export type VisualizationType = "1DHistogram" | "2DColorForProbability";

interface VisualizationNodeMutable extends NodeWithParentsMutable {
  type: "VisualizationNode";
  visualization: VisualizationType;
}
export type VisualizationNode = Immutable<VisualizationNodeMutable>;

export type Node =
  | DistributionNode
  | FunctionNode
  | ConstantNode
  | VisualizationNode;

export type Nodes = IMap<NodeId, Node>;

interface DistributionPropertiesMutable {
  name: string;
  inputs: IMap<InputId, PrimitiveType>;
}
export type DistribtionProperties = Immutable<DistributionPropertiesMutable>;

export type DistributionPropertyMap = IMap<
  DistributionType,
  DistribtionProperties
>;

const foo = createTypedMap<DistributionPropertiesMutable>({
  name: "Discrete Uniform Choice",
  inputs: IMap({
    choices: "array",
  }),
});

export const distributions: DistributionPropertyMap = IMap<
  DistributionType,
  DistribtionProperties
>([
  ["DiscreteUniform", foo],
  [
    "ContinuousUniform",
    createTypedMap<DistributionPropertiesMutable>({
      name: "Continuous Uniform",
      inputs: IMap({
        min: "double",
        max: "double",
      }),
    }),
  ],
]);
