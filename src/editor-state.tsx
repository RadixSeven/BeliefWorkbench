import * as Network from "./nodes_type";
import {
  ExpectedValueType,
  nodeProps,
  PrimitiveActualType,
} from "./nodes_type";

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

function checkConstantList(
  value: string
): {
  isValid: boolean;
  parsedValue: Network.PrimitiveActualTypeListOnly;
  messages: string[];
} {
  let validParse = false;
  try {
    const v = JSON.parse(value);
    validParse = true;
    Network.PrimitiveActualTypeListOnlyR.check(v);
    return { isValid: true, parsedValue: v, messages: [] };
  } catch (e) {
    if (value.charAt(0) === "[" && value.endsWith("]")) {
      const msg = validParse
        ? ["The list must only contain text, numbers, or other lists."]
        : ["The list is not a valid JSON list."];
      return { isValid: false, parsedValue: [], messages: msg };
    } else {
      return checkConstantList("[" + value + "]");
    }
  }
}

const isNumberRegex = /^\s*(?:[+-]?\d+(?:[+-]?[eE][+-]?\d+)?|[+-]?\d*\.\d+(?:[eE][+-]?\d+)?)\s*$/;

/**
 * Return true if "value" is a valid string representation of "type".
 * @param value The representation being checked
 * @param type The type being checked for
 */
export function checkConstantValue(
  value: string,
  type: ExpectedValueType
): { isValid: boolean; parsedValue: PrimitiveActualType; messages: string[] } {
  switch (type) {
    case "Number":
      const parsed = parseFloat(value);
      const finite = isFinite(parsed);
      const isOnlyNumber = !!value.match(isNumberRegex);
      const valid = finite && isOnlyNumber;
      const msg = isOnlyNumber
        ? ["Must only be a number"]
        : ["Must be a normal number, not infinity or NaN"];
      return { isValid: valid, parsedValue: parsed, messages: msg };
    case "Text":
      return { isValid: true, parsedValue: value, messages: [] };
    case "List":
      return checkConstantList(value);
  }
}

export interface StateValidity {
  isValid: boolean;
  messages: string[];
}

const identityValidity: StateValidity = { isValid: true, messages: [] };

function combineStateValidities(validities: StateValidity[]): StateValidity {
  return validities.reduce(
    (prev, cur) => ({
      isValid: prev.isValid && cur.isValid,
      messages: prev.messages.concat(cur.messages),
    }),
    identityValidity
  );
}

export function checkTitle(
  nodeTitles: string[],
  originalTitle: string,
  newTitle: string
): StateValidity {
  if (originalTitle !== newTitle && nodeTitles.includes(newTitle)) {
    return { isValid: false, messages: ["Title is not unique"] };
  } else {
    return { isValid: true, messages: [] };
  }
}

export function checkEditorState(
  nodeTitles: string[],
  originalTitle: string,
  editorState: EditorState
): StateValidity {
  return combineStateValidities([
    checkTitle(nodeTitles, originalTitle, editorState.title),
    nodeProps[editorState.type].hasValueField
      ? checkConstantValue(editorState.value, editorState.valueType)
      : identityValidity,
  ]);
}
