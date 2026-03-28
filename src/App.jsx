
import { useState, useRef, useCallback, useEffect } from "react";
import { MIN_WIDTH, MIN_HEIGHT, generateGraph } from "./graphUtils";

export default function App() {
  const [nodeCount, setNodeCount] = useState(30);
  const [mineCount, setMineCount] = useState(5);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [boardSize, setBoardSize] = useState({ w: MIN_WIDTH, h: MIN_HEIGHT });
  const boardRef = useRef(null);
  const svgRef = useRef(null);

  function handleClick(id) {
    console.log(id);
  }

  const measureBoard = useCallback(() => {
      if (!boardRef.current) return;
      const rect = boardRef.current.getBoundingClientRect();
      setBoardSize({
        w: Math.max(MIN_WIDTH, rect.width),
        h: Math.max(MIN_HEIGHT, rect.height),
      });
    }, []);

  useEffect(() => {
      measureBoard();
      window.addEventListener("resize", measureBoard);
      return () => window.removeEventListener("resize", measureBoard);
    }, [measureBoard]);

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
                Math.min(1000, Number(e.target.value)),
              );
              setNodeCount(nodesCount);
              setMineCount(Math.min(mineCount, nodesCount - 1));
            }}
            min="0"
            max="1000"
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
        <button
          onClick={() => {
            const rect = boardRef.current.getBoundingClientRect();
            const w = Math.max(MIN_WIDTH, rect.width);
            const h = Math.max(MIN_HEIGHT, rect.height);
            const { nodes, links } = generateGraph(nodeCount, w, h);
            setNodes(nodes);
            setLinks(links);
            setBoardSize({ w, h });
          }}
        >
          Generate
        </button>
      </nav>

      <div className="board-section" ref={boardRef}>
        <svg
          ref={svgRef}
          className="board"
          viewBox={`0 0 ${boardSize.w} ${boardSize.h}`}
        >
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
