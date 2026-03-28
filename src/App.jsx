import { useState, useEffect, useRef } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceX,
  forceY,
} from "d3-force";

const WIDTH = 800;
const HEIGHT = 600;

export default function App() {
  const [nodeCount, setNodeCount] = useState(30);
  const [mineCount, setMineCount] = useState(5);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const svgRef = useRef(null);

  /*
   * Random connected graph generator which uses d3-force simulation to get positions.
   * Adds edges randomly with edgeProbability.
   *
   * @param {number} nodesCount - Number of nodes to generate.
   * @param {number} [edgeProbability=0.08] - Probability of edge creation between nodes.
   * @returns {{nodes: Array, links: Array}} - Object containing nodes and links arrays.
   */
  function generateGraph(nodesCount, edgeProbability = 0.08) {
    if (nodesCount === 0) return { nodes: [], links: [] };

    const nodes = Array.from({ length: nodesCount }, (_, i) => ({
      id: i,
      x: 0,
      y: 0,
      neighbors: [],
    }));

    const edges = new Set();
    const links = [];

    function addEdge(source, target) {
      if (source === target) return;
      if (source > target) {
        [source, target] = [target, source];
      }
      const key = source * nodesCount + target;
      if (edges.has(key)) return;
      edges.add(key);
      links.push({ source, target });
    }

    
    // Spanning tree
    for (let i = 1; i < nodesCount; i++) {
      addEdge(Math.floor(Math.random() * i), i);
    }

    for (let i = 0; i < nodesCount; i++) {
      if (Math.random() < edgeProbability) {
        addEdge(i);
      }
    }
  }

  return (
    <div className="app">
      <nav className="toolbar">
        <label>
          Nodes:
          <input
            type="number"
            value={nodeCount}
            onChange={(e) => {
              const nodesCount = Math.max(
                0,
                Math.min(100, Number(e.target.value)),
              );
              setNodeCount(nodesCount);
              setMineCount(Math.min(mineCount, nodesCount - 1));
            }}
            min="0"
            max="100"
          />
        </label>
        <label>
          Mines:
          <input
            type="number"
            value={mineCount}
            onChange={(e) => {
              const mines = Math.max(
                0,
                Math.min(nodeCount - 1, Number(e.target.value)),
              );
              setMineCount(mines);
            }}
            min="0"
            max={nodeCount - 1}
          />
        </label>
        <button onClick={generateGraph}>Generate</button>
      </nav>

      <div className="board-section">
        <svg ref={svgRef} className="board" viewBox="0 0 800 600">
          {links.map((link, i) => (
            <line
              key={i}
              x1={link.source.x}
              y1={link.source.y}
              x2={link.target.x}
              y2={link.target.y}
              stroke="#999"
              strokeOpacity={0.6}
            />
          ))}
          {nodes.map((node) => (
            <circle
              key={node.id}
              cx={node.x}
              cy={node.y}
              r={12}
              fill="#4a90d9"
              onClick={() => handleClick(node.id)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
