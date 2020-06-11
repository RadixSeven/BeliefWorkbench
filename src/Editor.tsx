import React from "react";
import * as Network from "./nodes_type"
import './Editor.css';

type Nodes = Network.Nodes;
type Node = Network.Node;
type DistributionType = Network.DistributionType;
type Distribution = Network.Distribution;

const GraphDisplay = ({nodes, selectedNodeId, language} : {nodes: Nodes, selectedNodeId: string, language: string})  =>
    <section className="graphDisplay">
        <ul> {
            Object.entries(nodes).map(([nodeId, nodeVal]) => {
                const classN = (nodeId === selectedNodeId) ? "selected" : "notSelected";
                return <li key={nodeId} className={classN} lang={language}>
                    {nodeVal.title}
                </li>;
            })
        }</ul>
    </section>;

type DistributionPropertyMap = {
    [distributionType in DistributionType]: {
        name: string;
    };
};

const distributions : DistributionPropertyMap = {
    "discreteUniform": {
        "name": "Discrete Uniform"
    },
    "continuousUniform": {
        "name": "Continuous Uniform"
    }
};

const distName = (distId: DistributionType) =>
    distributions[distId].name;

const DistributionOptions = () =>
    <React.Fragment>{
        Object.keys(distributions).map(
            (distId) =>
                <option value={distId} key={distId}>
                    {distName(distId as DistributionType)}</option>)
    }</React.Fragment>;

const NodeDistributionEditor = ({distribution}:{distribution: Distribution}) =>
    <React.Fragment>
        <label htmlFor="distribution">Distribution</label>
        <select name="distribution" id="distribution"
                defaultValue={distribution.type}>
            <DistributionOptions/>
        </select>
    </React.Fragment>

const NodeEditor = ({node, language}:{node:Node, language: string}) =>
    <section className="nodeEditor">
        <form>
            <NodeDistributionEditor distribution={node.distribution}/>
            <label htmlFor="nodeTitle">Title</label>
            <input type="text" lang={language} id="nodeTitle"
                   defaultValue={node.title}/>
            <label htmlFor="nodeJustification">Justification</label>
            <textarea lang={language} id="nodeTitle"
                   defaultValue={node.justification}/>
        </form>
    </section>;

const Editor = ({nodes, language, modelName, selection, version}: {nodes: Nodes, language: string, modelName: string, selection: string, version: string}) =>
    <main className="editor">
        <header className="mainHead" lang={language}>{modelName}: Belief Workbench {version}</header>
        <GraphDisplay nodes={nodes} selectedNodeId={selection} language={language}/>
        <NodeEditor node={nodes[selection]} language={language} />
        <footer className="mainFooter">Copyright 2020 Eric Moyer. License: <a href={"https://www.gnu.org/licenses/gpl-3.0.en.html"}>GPL 3.0</a> </footer>
    </main>;

export default Editor;
