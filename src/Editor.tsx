import React from "react";
import * as Network from "./nodes_type"
import './Editor.css';

type Nodes = Network.Nodes;
type Node = Network.Node;
type DistributionType = Network.DistributionType;
const distributions = Network.distributions;

const GraphDisplay = ({nodes, selectedNodeId, language} : {nodes: Nodes, selectedNodeId: string|null, language: string})  =>
    <section className="graphDisplay">
        <ul> {
            Object.keys(nodes).map((nodeTitle) => {
                const classN = (nodeTitle === selectedNodeId) ? "selected" : "notSelected";
                return <li key={nodeTitle} className={classN} lang={language}>
                    {nodeTitle}
                </li>;
            })
        }</ul>
    </section>;


const distName = (distId: DistributionType) =>
    distributions[distId].name;

const DistributionOptions = () =>
    <React.Fragment>{
        Object.keys(distributions).map(
            (distId) =>
                <option value={distId} key={distId}>
                    {distName(distId as DistributionType)}</option>)
    }</React.Fragment>;

const NodeDistributionEditor = ({distribution}:{distribution: DistributionType}) =>
    <React.Fragment>
        <label htmlFor="distribution">Distribution</label>
        <select name="distribution" id="distribution"
                defaultValue={distribution}>
            <DistributionOptions/>
        </select>
    </React.Fragment>;

const NodeEditor = ({nodeTitle, node, language}:{nodeTitle: string, node:Node, language: string}) =>
    <section className="nodeEditor">
        <form>
            <label htmlFor="nodeTitle">Title</label>
            <input type="text" lang={language} id="nodeTitle"
                   defaultValue={nodeTitle}/>
            <label htmlFor="nodeJustification">Justification</label>
            <textarea lang={language} id="nodeTitle"
                   defaultValue={node.justification}/>
            {
                (node.type === "DistributionNode")  &&
                <NodeDistributionEditor distribution={
                    (node as Network.DistributionNode).distribution}/>
            }
        </form>
    </section>;


const Editor = ({nodes, language, modelName, selection, version}: {nodes: Nodes, language: string, modelName: string, selection: string|null, version: string}) => {
    if (selection != null && !(selection in nodes)) {
        selection = null;
    }
    const editor = (selection == null) ?
        <section className="nodeEditor"><p>Nothing Selected</p></section>
        :
        <NodeEditor nodeTitle={selection} node={nodes[selection]} language={language}/>;

    return <main className="editor">
        <header className="mainHead" lang={language}>{modelName}: Belief
            Workbench {version}</header>
        <GraphDisplay nodes={nodes} selectedNodeId={selection}
                      language={language}/>
        {editor}
        <footer className="mainFooter">Copyright 2020 Eric Moyer.
            License: <a
                href={"https://www.gnu.org/licenses/gpl-3.0.en.html"}>GPL
                3.0</a></footer>
    </main>;
}
export default Editor;
