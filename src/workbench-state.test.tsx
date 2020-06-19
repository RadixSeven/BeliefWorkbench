import React from "react";
import { WorkbenchState, mapParents } from "./workbench-state";
import { stubEditorState } from "./editor-state";
import * as Network from "./nodes_type";

const Immutable = require("seamless-immutable");

const stubState: WorkbenchState = {
  beliefs: {
    nodes: {},
    language: "en-US",
    modelName: "Stub model",
  },
  currentlyEditing: null,
  newProperties: stubEditorState,
  currentURL: null,
};

function stubWithNodes(newNodes: Network.Nodes): WorkbenchState {
  return Immutable({
    ...stubState,
    beliefs: {
      ...stubState.beliefs,
      nodes: newNodes,
    },
  });
}

test("mapParents maps over nodes without parents", () => {
  const simple = stubWithNodes({
    Zero: {
      justification: "We needed a zero constant",
      type: "ConstantNode",
      coords: [100, 100],
      value: 0,
    },
  });
  const result = mapParents(simple, (_nodeId, _portId, parents) => parents);
  expect(result).toStrictEqual(simple);
});

test("mapParents maps over both nodes with and without parents", () => {
  const heroRepeatsZero = stubWithNodes({
    Zero: {
      justification: "The additive identity",
      type: "ConstantNode",
      coords: [100, 100],
      value: 0,
    },
    One: {
      justification: "The multiplicative identity",
      type: "ConstantNode",
      coords: [150, 100],
      value: 1,
    },
    Hero: {
      justification: "With one parent, add is just repetition",
      type: "FunctionNode",
      coords: [100, 100],
      function: "Add",
      parents: {
        toAdd: ["Zero"],
      },
    },
  });
  const heroRepeatsOne = stubWithNodes({
    Zero: {
      justification: "The additive identity",
      type: "ConstantNode",
      coords: [100, 100],
      value: 0,
    },
    One: {
      justification: "The multiplicative identity",
      type: "ConstantNode",
      coords: [150, 100],
      value: 1,
    },
    Hero: {
      justification: "With one parent, add is just repetition",
      type: "FunctionNode",
      coords: [100, 100],
      function: "Add",
      parents: {
        toAdd: ["One"],
      },
    },
  });
  const result = mapParents(heroRepeatsZero, (_nodeId, _portId, parents) =>
    parents.map((value) => (value === "Zero" ? "One" : value))
  );
  expect(result).toStrictEqual(heroRepeatsOne);
});
