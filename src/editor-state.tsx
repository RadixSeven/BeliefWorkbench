import * as Network from "./nodes_type";
import { Literal, String, Union, Boolean, Number } from "runtypes";
import { PrimitiveActualTypeR } from "./nodes_type";

export const ExpectedValueTypeR = Union(
  Literal("Number"),
  Literal("Text"),
  Literal("List")
);
export type ExpectedValueType = "Number" | "Text" | "List"; //= Static<typeof ExpectedValueTypeR>;

export type ExpectedValueTypePropertyMap = {
  [t in ExpectedValueType]: { name: string };
};

export const expectedValueTypeProps: ExpectedValueTypePropertyMap = {
  Number: { name: "Number" },
  Text: { name: "Text" },
  List: { name: "List" },
};

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
  valueType: ExpectedValueType;
  value: string;
};

export const stubEditorState: EditorState = {
  title: "Stub Title",
  justification: "Stub justification",
  type: "DistributionNode",
  distribution: "ContinuousUniform",
  function: "Add",
  visualization: "1DHistogram",
  valueType: "Number",
  value: "0",
};

function isValidList(value: string): boolean {
  try {
    const v = JSON.parse(value);
    Network.PrimitiveActualTypeListOnlyR.check(v);
  } catch (e) {
    if (value.charAt(0) === "[" && value.endsWith("]")) {
      return false;
    } else {
      return isValidList("[" + value + "]");
    }
  }
  return true;
}

const isNumberRegex = /^\s*(?:[+-]?\d+(?:[+-]?[eE][+-]?\d+)?|[+-]?\d*\.\d+(?:[eE][+-]?\d+)?)\s*$/;

/**
 * Return true if "value" is a valid string representation of "type"
 * @param value The representation being checked
 * @param type The type being checked for
 */
export function isValidValue(value: string, type: ExpectedValueType): boolean {
  switch (type) {
    case "Number":
      return isFinite(parseFloat(value)) && !!value.match(isNumberRegex);
    case "Text":
      return true;
    case "List":
      return isValidList(value);
  }
}
