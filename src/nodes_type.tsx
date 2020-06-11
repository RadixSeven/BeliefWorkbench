export type DistributionType = "continuousUniform" | "discreteUniform";

export interface Distribution {
    type: DistributionType,
    outputType: "double" | "int",
    min?: number,
    max?: number,
    choices?: number[] | string[]
}

export interface Node {
    distribution: Distribution,
    title: string,
    justification: string
}

export interface Nodes {
    [node_id: string]: Node
}
