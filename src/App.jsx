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
  const [hoveredNodeID, setHoveredNodeID] = useState(null);

  const hoveredNode = hoveredNodeID !== null ? nodes[hoveredNodeID] : null;
  const hoveredNeighors = hoveredNode ? hoveredNode.neighbors : [];

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
          {links.map((link, i) => {
            const sourceID = link.source.id;
            const targetID = link.target.id;
            const highlighted =
              sourceID === hoveredNodeID || targetID === hoveredNodeID;
            return (
              <line
                key={i}
                x1={link.source.x}
                y1={link.source.y}
                x2={link.target.x}
                y2={link.target.y}
                stroke={highlighted ? "var(--nord0)" : "var(--nord1)"}
                strokeWidth={highlighted ? 2.5 : 1}
                strokeOpacity={1}
                style={{ transition: "all 0.05s ease" }}
              />
            );
          })}
          {nodes.map((node) => {
            const isHovered = node.id === hoveredNodeID;
            const isNeighbor = hoveredNeighors.includes(node.id);
            return (
              <circle
                key={node.id}
                cx={node.x}
                cy={node.y}
                r={isHovered ? 14 : isNeighbor ? 13 : 12}
                fill="var(--nord10)"
                stroke={
                  isHovered || isNeighbor ? "var(--nord0)" : "var(--nord1)"
                }
                strokeWidth={isHovered || isNeighbor ? 3 : 1}
                style={{
                  transition:
                    "r 0.05s ease, stroke 0.05s ease, stroke-width 0.05s ease",
                }}
                onClick={() => handleClick(node.id)}
                onMouseEnter={() => setHoveredNodeID(node.id)}
                onMouseLeave={() => setHoveredNodeID(null)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
