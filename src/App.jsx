import { useState, useRef, useCallback, useEffect } from "react";
import { MIN_WIDTH, MIN_HEIGHT, generateGraph } from "./graphUtils";
import { initMines, revealNode, checkWin, toggleFlag } from "./gameUtils";

const MINE_COUNT_COLORS = [
  null,           // 0
  "#1a4a8a",      // 1
  "#1d7a2f",      // 2
  "#c42525",      // 3
  "#5e1a8a",      // 4
  "#8e2a0a",      // 5
  "#0e706e",      // 6
  "#2a1640",      // 7
  "#555555",      // 8
];


export default function App() {
  const [nodeCount, setNodeCount] = useState(30);
  const [mineCount, setMineCount] = useState(5);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [boardSize, setBoardSize] = useState({ w: MIN_WIDTH, h: MIN_HEIGHT });
  const [gameState, setGameState] = useState("idle"); // idle, playing, won, lost
  const boardRef = useRef(null);
  const svgRef = useRef(null);
  const [hoveredNodeID, setHoveredNodeID] = useState(null);

  const hoveredNode = hoveredNodeID !== null ? nodes[hoveredNodeID] : null;
  const hoveredNeighors = hoveredNode ? hoveredNode.neighbors : [];

  const flagCount = nodes.filter((node) => node.isFlagged).length;

  function handleClick(id) {
    if (gameState === "won" || gameState === "lost") return;

    let currentNodes = nodes;

    if (nodes[id] && nodes[id].isFlagged) return;


    if (gameState === "idle") {
      currentNodes = initMines(currentNodes, mineCount, id);
      setGameState("playing");
    }

    const { nodes: updatedNodes, hitMine } = revealNode(currentNodes, id);
    setNodes(updatedNodes);

    if (hitMine) {
      setGameState("lost");
    } else if (checkWin(updatedNodes)) {
      setGameState("won");
    }
  }

  function handleRightClick(e, id) {
    e.preventDefault();
    if (mineCount - flagCount <= 0 && !nodes[id].isFlagged) return;
    if (gameState === "won" || gameState === "lost") return;
    setNodes(toggleFlag(nodes, id));
  }

  function startGame() {
    const rect = boardRef.current.getBoundingClientRect();
    const w = Math.max(MIN_WIDTH, rect.width);
    const h = Math.max(MIN_HEIGHT, rect.height);
    const { nodes, links } = generateGraph(nodeCount, w, h);
    setNodes(nodes);
    setLinks(links);
    setBoardSize({ w, h });
    setGameState("idle");
    setHoveredNodeID(null);
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
        <button onClick={startGame}>
          {gameState === "won" || gameState === "lost"
            ? "New Game"
            : "Start Game"}
        </button>

        {/* TODO: Redo this */}
        <span className="debug">Game State: {gameState}</span>
        {nodes.length > 0 && (
          <span className="status">
            {gameState === "won" && "🎉 You win!"}
            {gameState === "lost" && "💥 Game over!"}
            {(gameState === "idle" || gameState === "playing") &&
              `| Remaining Mines: ${mineCount - flagCount}`}
          </span>
        )}
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

            let fill = "var(--nord10)";
            if (node.isRevealed && node.isMine) fill = "var(--nord11)";
            else if (node.isRevealed) fill = "#afc1d6";
            else if (node.isFlagged) fill = "var(--nord7)";

            return (
              <g key={node.id}>
                <circle
                  key={node.id}
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? 14 : isNeighbor ? 13 : 12}
                  fill={fill}
                  stroke={
                    isHovered || isNeighbor ? "var(--nord0)" : "var(--nord1)"
                  }
                  strokeWidth={isHovered || isNeighbor ? 3 : 1}
                  style={{
                    transition:
                      "r 0.05s ease, stroke 0.05s ease, stroke-width 0.05s ease",
                    cursor:
                      gameState === "won" || gameState === "lost"
                        ? "default"
                        : "pointer",
                  }}
                  onClick={() => handleClick(node.id)}
                  onContextMenu={(e) => handleRightClick(e, node.id)}
                  onMouseEnter={() => setHoveredNodeID(node.id)}
                  onMouseLeave={() => setHoveredNodeID(null)}
                />

                {node.isRevealed && !node.isMine && node.adjacentMines > 0 && (
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={MINE_COUNT_COLORS[node.adjacentMines]}
                    fontSize="14"
                    fontWeight="bold"
                    pointerEvents="none"
                  >{node.adjacentMines}</text>
                )}

                {node.isRevealed && node.isMine && (
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    pointerEvents="none"
                  >💣</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
