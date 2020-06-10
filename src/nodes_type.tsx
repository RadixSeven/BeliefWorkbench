type DistributionType = "continuousUniform" | "discreteUniform";

export interface Node = {
    distribution: {
        type: DistributionType,
        outputType: "double" | "int",
        min?: double,
        max?: double,
        choices?: int[] | string[] | double[],
    }
    title: string,
    justification: string
};

export interface Nodes = {
    [node_id: string]: Node
};

export = DistributionType;
