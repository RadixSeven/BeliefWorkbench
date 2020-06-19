import { Set as ISet, Record, List } from "immutable";
import React, { ReactElement, ReactNode, useContext } from "react";
import * as Network from "./nodes_type";
import "./Editor.css";
import { DispatchContext } from "./";
import Diagram from "beautiful-react-diagrams";
import * as DiagramSchema from "beautiful-react-diagrams/@types/DiagramSchema";
import { EditorState } from "./editor-state";
import { NodeTypeR } from "./nodes_type";

type Nodes = Network.Nodes;

function nodeContent(
  title: string,
  node: Network.Node,
  dispatchSelectNode: (newSelection: string) => void,
  dispatchDeleteNode: (idToDelete: string) => void
): ReactNode | ReactElement {
  const editIcon = (
    <span className="edit-icon" onClick={(_event) => dispatchSelectNode(title)}>
      &#9998;
    </span>
  );
  const deleteIcon = (
    <span
      className="delete-icon"
      onClick={(_event) => dispatchDeleteNode(title)}
    >
      &#128465;
    </span>
  );

  const addButtons = (text: string) => (
    <div className="node-contents">
      <p className="node-text">{text}</p>
      <div className="node-controls">
        {deleteIcon}
        {editIcon}
      </div>
    </div>
  );

  const justTitle = addButtons(title);

  switch (node.type) {
    case "DistributionNode":
      return justTitle;
    case "FunctionNode":
      return justTitle;
    case "ConstantNode": {
      const cn = node as Network.ConstantNode;
      return addButtons(title + ": " + JSON.stringify(cn.value));
    }
    case "VisualizationNode":
      return justTitle;
  }
}

/// Return the name of the input "port" for "paramName" on node "title"
function nodeInputPortName(title: string, paramName: string): string {
  return `${encodeURIComponent(title)}:input:${encodeURIComponent(paramName)}`;
}

const matchesInputPortRegex = /^[^:]+:input:[^:]+$/;
function isInputPort(portName: string): boolean {
  return !!portName.match(matchesInputPortRegex);
}

/**
 * Extract a string encoded in the port name and return its decoded version or
 * null if it can't find it.
 *
 * @param portName the name of the Port being used by beautiful-react-diagrams
 * @param regex the regex applied to portName to do the extraction. It should only use delimiters that won't be in the result of encodeURIComponent
 * @param groupName the name of a capturing group from the regex. The regex should ensure that this group will be there
 * @param whatLookingFor a text string to be included in the error message "Could not find ${whatLookingFor}"
 */
function extractFromPortName(
  portName: string,
  regex: RegExp,
  groupName: string,
  whatLookingFor: string
): string | null {
  const matches = portName.match(regex);
  return matches &&
    "groups" in matches &&
    matches.groups &&
    groupName in matches.groups
    ? decodeURIComponent(matches.groups[groupName])
    : null;
}

const captureEncodedNodeIdFromInputPortName = /^(?<nodeId>.*):input:/;

/**
 * Return the node ID encoded in portName (or null if it can't find it)
 *
 * @param portName the port to decode
 */
function nodeIdFromInputPortName(portName: string): string | null {
  return extractFromPortName(
    portName,
    captureEncodedNodeIdFromInputPortName,
    "nodeId",
    "node ID"
  );
}

const captureEncodedInputIdFromInputPortName = /:input:(?<inputId>.*)$/;

/**
 * Return the input ID encoded in portName  (or null if it can't find
 * it)
 *
 * @param portName the port to decode
 */
function inputIdFromInputPortName(portName: string): string | null {
  return extractFromPortName(
    portName,
    captureEncodedInputIdFromInputPortName,
    "inputId",
    "input ID"
  );
}

function nodeOutputPortName(title: string): string {
  return `${encodeURIComponent(title)}:output`;
}
const matchesOutputPortRegex = /^[^:]+:output$/;
function isOutputPort(portName: string): boolean {
  return !!portName.match(matchesOutputPortRegex);
}

const captureNodeIdFromOutputPortName = /^(?<nodeId>.*):output$/;

/**
 * Return the output ID encoded in portName  (or null if it can't find
 * it)
 *
 * @param portName the port to decode
 */
function nodeIdFromOutputPortName(portName: string): string | null {
  return extractFromPortName(
    portName,
    captureNodeIdFromOutputPortName,
    "nodeId",
    "node ID"
  );
}

function nodeInputs(title: string, node: Network.Node): DiagramSchema.Port[] {
  return "parents" in node
    ? Object.keys(node.parents).map((name) => ({
        id: nodeInputPortName(title, name),
        canLink: () => true,
        alignment: "top",
      }))
    : ([] as DiagramSchema.Port[]);
}

function beautifulDiagramsNode(
  [title, node]: [string, Network.Node],
  dispatchSelectNode: (newSelection: string) => void,
  dispatchDeleteNode: (nodeIdToDelete: string) => void
): DiagramSchema.Node {
  return {
    id: title,
    coordinates: node.coords,
    content: nodeContent(title, node, dispatchSelectNode, dispatchDeleteNode),
    inputs: nodeInputs(title, node),
    // Note: there is a typo in DiagramSchema.ts, you need to add the [] for
    // the definition ouf outputs
    outputs: [
      { id: nodeOutputPortName(title), canLink: () => true, alignment: "top" },
    ],
  };
}

/**
 * Return the links generated by one input
 * @param parentNames the parents linking to that input
 * @param title The title/id of the node whose parents link to that input
 * @param inputName The name of the input being linked to
 */
function beautifulDiagramsNodeInputLinks(
  parentNames: string[],
  title: string,
  inputName: string
): DiagramSchema.Link[] {
  return parentNames.map((parentName) => ({
    input: nodeOutputPortName(parentName),
    output: nodeInputPortName(title, inputName),
    readonly: false,
    label: parentNames.length > 1 ? `${inputName}(${parentName})` : inputName,
  }));
}

function beautifulDiagramsNodeLinks([title, node]: [
  string,
  Network.Node
]): DiagramSchema.Link[] {
  return "parents" in node
    ? Object.entries(node.parents).flatMap(([inputName, parentNames]) =>
        beautifulDiagramsNodeInputLinks(parentNames, title, inputName)
      )
    : [];
}

function beautifulDiagramsNodes(
  nodes: Nodes,
  dispatchSelectNode: (newSelection: string) => void,
  dispatchDeleteNode: (nodeIdToDelete: string) => void
): DiagramSchema.Node[] {
  return Object.entries(nodes).map((param) =>
    beautifulDiagramsNode(param, dispatchSelectNode, dispatchDeleteNode)
  );
}

function beautifulDiagramsLinks(nodes: Nodes): DiagramSchema.Link[] {
  return Object.entries(nodes).flatMap(beautifulDiagramsNodeLinks);
}

function beautifulDiagramsSchema(
  nodes: Nodes,
  dispatchSelectNode: (newSelection: string) => void,
  dispatchDeleteNode: (nodeIdToDelete: string) => void
): DiagramSchema.DiagramSchema {
  return {
    nodes: beautifulDiagramsNodes(
      nodes,
      dispatchSelectNode,
      dispatchDeleteNode
    ),
    links: beautifulDiagramsLinks(nodes),
  };
}

type NodeMovement = {
  nodeId: string;
  newCoords: number[];
};

function nodeMovements(
  oldSchema: DiagramSchema.DiagramSchema,
  newSchema: DiagramSchema.DiagramSchema
): NodeMovement[] {
  const oldCoords = Object.fromEntries(
    oldSchema.nodes.map((node) => [node.id, node.coordinates])
  );
  const newCoords = Object.fromEntries(
    newSchema.nodes.map((node) => [node.id, node.coordinates])
  );
  const movedNodeIds = Object.keys(oldCoords).filter(
    (id) => id in oldCoords && oldCoords[id] !== newCoords[id]
  );
  return movedNodeIds.map((id) => ({
    nodeId: id,
    newCoords: newCoords[id] as number[],
  }));
}

type Linkage = {
  fromNodeId: string;
  toNodeId: string;
  toInputId: string;
};

const linkageRecordDefaults: Linkage = {
  fromNodeId: "",
  toNodeId: "",
  toInputId: "",
};
const LinkageRecord = Record(linkageRecordDefaults);

/**
 * Given two ports sort them into a pair for link input and output. If they
 * cannot be sorted, (i.e. they are both inputs or both outputs),
 * set bad to true in the result.
 * @param port1 the first port
 * @param port2 the second port
 */
function sortInputsAndOutputs(
  port1: string,
  port2: string
): { input: string; output: string; bad: boolean } {
  if (isOutputPort(port1)) {
    if (isInputPort(port2)) {
      return { input: port1, output: port2, bad: false };
    } else {
      return { input: port1, output: port2, bad: true };
    }
  } else if (isOutputPort(port2) && isInputPort(port1)) {
    return { input: port2, output: port1, bad: false };
  } else {
    return { input: port1, output: port2, bad: true };
  }
}

/**
 * Extracts parameters of Linkage from DiagramSchema.Link
 * On success, returns a singleton array containing the extracted
 * value. Otherwise, returns an empty array. This can be flat-mapped
 * over to eliminate the bad extractions. (Ideally there will be none
 * but we're encoding and decoding metadata in id strings which is
 * error-prone, so I'm trying to make this a little more robust.)
 * @param link the link from which to extract the parameters
 */
function linkToLinkage(link: DiagramSchema.Link): List<Record<Linkage>> {
  // Reverse inputs and outputs if the user connected them backward.
  const { input, output, bad } = sortInputsAndOutputs(link.input, link.output);
  if (bad) {
    return List();
  }

  // Create the Linkage record
  const fromNodeId = nodeIdFromOutputPortName(input);
  const toNodeId = nodeIdFromInputPortName(output);
  const toInputId = inputIdFromInputPortName(output);
  if (toNodeId && fromNodeId && toInputId) {
    return List([
      LinkageRecord({
        fromNodeId: fromNodeId,
        toInputId: toInputId,
        toNodeId: toNodeId,
      }),
    ]);
  }
  console.warn(
    `Could not extract linkage from ${JSON.stringify(
      link
    )}. Skipping. This could result in link deletions or additions.`
  );
  return List();
}

function linkagesArray(
  schema: DiagramSchema.DiagramSchema
): List<Record<Linkage>> {
  return "links" in schema && schema.links
    ? List(schema.links).flatMap(linkToLinkage)
    : List();
}

function linkages(schema: DiagramSchema.DiagramSchema): ISet<Record<Linkage>> {
  return ISet(linkagesArray(schema));
}

type ChangeHandlerType = (
  oldSchema: DiagramSchema.DiagramSchema,
  dispatchMoveNode: (nodeId: string, newCoords: number[]) => void,
  dispatchLinkNodes: (
    fromNodeId: string,
    toNodeId: string,
    toInputId: string
  ) => void,
  dispatchUnlinkNodes: (
    fromNodeId: string,
    toNodeId: string,
    toInputId: string
  ) => void
) => (schema: DiagramSchema.DiagramSchema) => void;

const changeHandler: ChangeHandlerType = (
  oldSchema,
  dispatchMoveNode,
  dispatchLinkNodes,
  dispatchUnlinkNodes
) => {
  return (newSchema) => {
    const nodeMoves = nodeMovements(oldSchema, newSchema);
    nodeMoves.forEach((m) => dispatchMoveNode(m.nodeId, m.newCoords));
    const oldLinks = linkages(oldSchema);
    const newLinks = linkages(newSchema);
    const addedLinks = newLinks.subtract(oldLinks);
    addedLinks.forEach((l) =>
      dispatchLinkNodes(
        l.get("fromNodeId"),
        l.get("toNodeId"),
        l.get("toInputId")
      )
    );
    const removedLinks = oldLinks.subtract(newLinks);
    removedLinks.forEach((l) =>
      dispatchUnlinkNodes(
        l.get("fromNodeId"),
        l.get("toNodeId"),
        l.get("toInputId")
      )
    );
  };
};

const NodeEditor = ({
  language,
  editorState,
}: {
  language: string;
  editorState: EditorState;
}) => {
  const {
    dispatchCancelNodeEdit,
    dispatchFinishNodeEdit,
    dispatchUpdateEditorState,
  } = useContext(DispatchContext);
  function fieldUpdater(fieldName: string) {
    return (
      e:
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLSelectElement>
    ) => {
      const newState: EditorState = { ...editorState };
      switch (fieldName) {
        case "title":
          newState["title"] = e.target.value;
          break;
        case "justification":
          newState["justification"] = e.target.value;
          break;
        case "type":
          newState["type"] = NodeTypeR.check(e.target.value);
          break;
      }
      dispatchUpdateEditorState(newState);
    };
  }
  return (
    <section
      className="nodeEditor"
      onSubmit={(_event) => {
        _event.preventDefault();
        dispatchFinishNodeEdit();
      }}
    >
      <form>
        <label>
          Title
          <input
            lang={language}
            value={editorState.title}
            onChange={fieldUpdater("title")}
          />
        </label>
        <label>
          Justification
          <textarea
            lang={language}
            value={editorState.justification}
            onChange={fieldUpdater("justification")}
          />
        </label>
        <label>
          Type
          <select value={editorState.type} onChange={fieldUpdater("type")}>
            {Network.NodeTypeR.alternatives.map((nodeType) => (
              <option value={nodeType.value}>
                {Network.nodeProps[nodeType.value].name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Submit</button>
        <button onClick={() => dispatchCancelNodeEdit()}>Cancel</button>
      </form>
    </section>
  );
};

function GraphEditor({
  language,
  nodes,
}: {
  language: string;
  nodes: Network.Nodes;
}) {
  const {
    dispatchStartNodeEdit,
    dispatchMoveNode,
    dispatchLinkNodes,
    dispatchUnlinkNodes,
    dispatchDeleteNode,
  } = useContext(DispatchContext);
  const schema = beautifulDiagramsSchema(
    nodes,
    dispatchStartNodeEdit,
    dispatchDeleteNode
  );
  return (
    <section className="graphDisplay" lang={language}>
      <Diagram
        schema={schema}
        onChange={changeHandler(
          schema,
          dispatchMoveNode,
          dispatchLinkNodes,
          dispatchUnlinkNodes
        )}
      />
    </section>
  );
}

const MainEditWindow = ({
  nodes,
  singleNodeToEdit,
  editorState,
  language,
}: {
  nodes: Nodes;
  singleNodeToEdit: string | null;
  editorState: EditorState;
  language: string;
}) => {
  const diagram = () => <GraphEditor language={language} nodes={nodes} />;
  const nodeEditor = () => (
    <NodeEditor language={language} editorState={editorState} />
  );
  return singleNodeToEdit ? nodeEditor() : diagram();
};

function graphDisplayHeight(nodes: Network.Nodes): number {
  const topRightYCoord = (node: Network.Node) =>
    node.coords.length > 1 ? node.coords[1] : 0;
  return 150 + Math.max(...Object.values(nodes).map(topRightYCoord));
}

const Editor = ({
  nodes,
  language,
  modelName,
  singleNodeToEdit,
  editorState,
  version,
}: {
  nodes: Nodes;
  language: string;
  modelName: string;
  singleNodeToEdit: string | null;
  editorState: EditorState;
  version: string;
}) => {
  if (singleNodeToEdit != null && !(singleNodeToEdit in nodes)) {
    singleNodeToEdit = null;
  }

  return (
    <main
      className="editor"
      style={{ gridTemplateRows: `15px ${graphDisplayHeight(nodes)}px 15px` }}
    >
      <header className="mainHead" lang={language}>
        {modelName}: Belief Workbench {version}
      </header>
      <MainEditWindow
        nodes={nodes}
        singleNodeToEdit={singleNodeToEdit}
        language={language}
        editorState={editorState}
      />
      <footer className="mainFooter">
        Copyright 2020 Eric Moyer. License:{" "}
        <a href={"https://www.gnu.org/licenses/gpl-3.0.en.html"}>GPL 3.0</a>
      </footer>
    </main>
  );
};
export default Editor;
