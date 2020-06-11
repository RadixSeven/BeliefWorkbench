import {Nodes} from './nodes_type'

const nodes : Nodes = {
    "xyz": {
        "distribution": {
            "type": "continuousUniform",
            "outputType": "double",
            "min": 0,
            "max": 1
        },
        "title": "The node's title",
        "justification": "A reason for this node"
    },
    "abc":{
        "distribution": {
            "type": "discreteUniform",
            "outputType": "int",
            "choices": [
                2,3,5,7,11,13,17,19
            ]
        },
        "title": "A random small prime",
        "justification": "This is the output of the prime generator"
    }
};

export default nodes;