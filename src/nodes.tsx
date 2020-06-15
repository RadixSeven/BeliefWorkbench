import { Nodes } from "./nodes_type";
const Immutable = require("seamless-immutable");

const nodes: Nodes = Immutable({
  Zero: {
    justification: "We needed a zero constant",
    type: "ConstantNode",
    coords: [100, 100],
    value: 0,
  },
  One: {
    justification: "We needed a one constant",
    type: "ConstantNode",
    coords: [200, 100],
    value: 1,
  },
  Primes: {
    justification: "List of the smallest primes",
    type: "ConstantNode",
    coords: [300, 100],
    value: [2, 3, 5, 7, 11, 13, 17, 19],
  },
  "The node's title": {
    justification: "A reason for this node",
    type: "DistributionNode",
    coords: [100, 200],
    distribution: "ContinuousUniform",
    parents: {
      min: ["Zero"],
      max: ["One"],
    },
  },
  "A random small prime": {
    justification: "This is the output of the prime generator",
    type: "DistributionNode",
    coords: [250, 200],
    distribution: "DiscreteUniform",
    parents: {
      choices: ["Primes"],
    },
  },
});

export default nodes;
