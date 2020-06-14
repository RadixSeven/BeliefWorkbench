import React, { ReactElement, ReactNode, useContext } from "react";
import * as Network from "./nodes_type";
import "./Editor.css";
import { DispatchContext } from "./";
import Diagram from "beautiful-react-diagrams";
import * as DiagramSchema from "beautiful-react-diagrams/@types/DiagramSchema";

type Nodes = Network.Nodes;

function nodeContent(
  title: string,
  node: Network.Node
): ReactNode | ReactElement {
  switch (node.type) {
    case "DistributionNode":
      return <p>{title}</p>;
    case "FunctionNode":
      return <p>{title}</p>;
    case "ConstantNode": {
      const cn = node as Network.ConstantNode;
      return <p>{title + ": " + JSON.stringify(cn.value)}</p>;
    }
    case "VisualizationNode":
      return <p>{title}</p>;
  }
}

/// Return the name of the input "port" for "paramName" on node "title"
function nodeInputName(title: string, paramName: string): string {
  return `${title}-input-${paramName}`;
}

function nodeInputs(title: string, node: Network.Node): DiagramSchema.Port[] {
  return "parents" in node
    ? Object.keys(node.parents).map((name) => ({
        id: nodeInputName(title, name),
        canLink: () => true,
        alignment: "top",
      }))
    : ([] as DiagramSchema.Port[]);
}

function beautifulDiagramsNode([title, node]: [
  string,
  Network.Node
]): DiagramSchema.Node {
  return {
    id: title,
    coordinates: node.coords,
    content: nodeContent(title, node),
    inputs: nodeInputs(title, node),
    outputs: [{ id: `${title}-output`, canLink: () => true, alignment: "top" }],
  };
}

function beautifulDiagramsNodes(nodes: Nodes): DiagramSchema.Node[] {
  return Object.entries(nodes).map(beautifulDiagramsNode);
}

function beautifulDiagramsLinks(nodes: Nodes): DiagramSchema.Link[] {
  return [];
}

function beautifulDiagramsSchema(nodes: Nodes): DiagramSchema.DiagramSchema {
  return {
    nodes: beautifulDiagramsNodes(nodes),
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

type ChangeHandlerType = (
  oldSchema: DiagramSchema.DiagramSchema,
  dispatchMoveNode: (nodeId: string, newCoords: number[]) => void
) => (schema: DiagramSchema.DiagramSchema) => void;
const changeHandler: ChangeHandlerType = (oldSchema, dispatchMoveNode) => {
  return (newSchema) => {
    const nodeMoves = nodeMovements(oldSchema, newSchema);
    nodeMoves.forEach((m) => dispatchMoveNode(m.nodeId, m.newCoords));
  };
};

const GraphDisplay = ({
  nodes,
  selectedNodeId,
  language,
}: {
  nodes: Nodes;
  selectedNodeId: string | null;
  language: string;
}) => {
  const { dispatchSelectNode, dispatchMoveNode } = useContext(DispatchContext);
  const schema = beautifulDiagramsSchema(nodes);
  return (
    <section className="graphDisplay">
      <Diagram
        schema={schema}
        onChange={changeHandler(schema, dispatchMoveNode)}
      />
    </section>
  );
};

const Editor = ({
  nodes,
  language,
  modelName,
  selection,
  version,
}: {
  nodes: Nodes;
  language: string;
  modelName: string;
  selection: string | null;
  version: string;
}) => {
  if (selection != null && !(selection in nodes)) {
    selection = null;
  }

  return (
    <main className="editor">
      <header className="mainHead" lang={language}>
        {modelName}: Belief Workbench {version}
      </header>
      <GraphDisplay
        nodes={nodes}
        selectedNodeId={selection}
        language={language}
      />
      <footer className="mainFooter">
        Copyright 2020 Eric Moyer. License:{" "}
        <a href={"https://www.gnu.org/licenses/gpl-3.0.en.html"}>GPL 3.0</a>
      </footer>
    </main>
  );
};
export default Editor;
