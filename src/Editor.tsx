import React, { useContext } from "react";
import * as Network from "./nodes_type";
import "./Editor.css";
import { DispatchContext } from "./";

type Nodes = Network.Nodes;

const GraphDisplay = ({
  nodes,
  selectedNodeId,
  language,
}: {
  nodes: Nodes;
  selectedNodeId: string | null;
  language: string;
}) => {
  const { dispatchSelectNode } = useContext(DispatchContext);
  return (
    <section className="graphDisplay">
      <ul>
        {" "}
        {Object.keys(nodes).map((nodeTitle) => {
          const classN =
            nodeTitle === selectedNodeId ? "selected" : "notSelected";
          return (
            <li key={nodeTitle} className={classN} lang={language}>
              <button onClick={() => dispatchSelectNode(nodeTitle)}>
                {nodeTitle}
              </button>
            </li>
          );
        })}
      </ul>
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
