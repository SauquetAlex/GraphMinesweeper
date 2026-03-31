import { useState, useRef, useCallback, useEffect } from "react";
import { fireworks as fx } from "fireworks";
import {
  MIN_WIDTH,
  MIN_HEIGHT,
  PAD,
  generateGraph,
  attachSimTick,
  dragNode,
  releaseNode,
  syncSimNodes,
} from "./graphUtils";
import {
  initMines,
  revealNode,
  checkWin,
  toggleFlag,
  chordReveal,
} from "./gameUtils";

import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const MINE_COUNT_COLORS = [
  null, // 0
  "#1a4a8a", // 1
  "#1d7a2f", // 2
  "#c42525", // 3
  "#5e1a8a", // 4
  "#8e2a0a", // 5
  "#0e706e", // 6
  "#2a1640", // 7
  "#555555", // 8
];

const DIFFICULTIES = [
  { label: "Easy", nodeCount: 64, mines: 12 },
  { label: "Medium", nodeCount: 128, mines: 24 },
  { label: "Hard", nodeCount: 256, mines: 48 },
  { label: "Expert", nodeCount: 512, mines: 96 },
  { label: "Working with Team Conquer", nodeCount: 1024, mines: 192 },
];

export default function App() {
  // const [nodeCount, setNodeCount] = useState(30);
  // const [mineCount, setMineCount] = useState(5);
  const [activeMineCount, setActiveMineCount] = useState(0);
  const [diffLevel, setDiffLevel] = useState(1); // Default medium
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [boardSize, setBoardSize] = useState({ w: MIN_WIDTH, h: MIN_HEIGHT });
  const [gameState, setGameState] = useState("idle"); // idle, playing, won, lost
  const [hoveredNodeID, setHoveredNodeID] = useState(null);
  const boardRef = useRef(null);
  const svgRef = useRef(null);
  const simRef = useRef(null);

  const dragRef = useRef({
    active: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    moved: false,
  });

  const nodeCount = DIFFICULTIES[diffLevel].nodeCount;
  const mineCount = DIFFICULTIES[diffLevel].mines;

  const hoveredNode = hoveredNodeID !== null ? nodes[hoveredNodeID] : null;
  const hoveredNeighors = hoveredNode ? hoveredNode.neighbors : [];

  const flagCount = nodes.filter((node) => node.isFlagged).length;

  const displayMineCount =
    gameState === "idle" && nodes.length === 0 ? mineCount : activeMineCount;

  function syncGameNodes(updatedNodes) {
    syncSimNodes(simRef.current, updatedNodes);
    setNodes(updatedNodes);
  }

  function handleClick(id) {
    if (gameState === "won" || gameState === "lost") return;

    if (nodes[id] && nodes[id].isRevealed) {
      const { nodes: updatedNodes, hitMine } = chordReveal(nodes, id);
      syncGameNodes(updatedNodes);
      if (hitMine) setGameState("lost");
      else if (checkWin(updatedNodes)) setGameState("won");
      return;
    }

    let currentNodes = nodes;

    if (nodes[id] && nodes[id].isFlagged) return;

    if (gameState === "idle") {
      currentNodes = initMines(currentNodes, activeMineCount, id);
      setGameState("playing");
    }

    const { nodes: updatedNodes, hitMine } = revealNode(currentNodes, id);
    syncGameNodes(updatedNodes);

    if (hitMine) {
      setGameState("lost");
    } else if (checkWin(updatedNodes)) {
      setGameState("won");
    }
  }

  function handleRightClick(e, id) {
    e.preventDefault();
    if (activeMineCount - flagCount <= 0 && !nodes[id].isFlagged) return;
    if (gameState === "won" || gameState === "lost") return;
    syncGameNodes(toggleFlag(nodes, id));
  }

  function onPointerDown(e) {
    const id = e.target.dataset?.nodeId;
    if (id == null) return;
    const { x, y } = screenToSVG(e.clientX, e.clientY);
    dragRef.current = {
      active: true,
      nodeId: Number(id),
      startX: x,
      startY: y,
      moved: false,
    };
    e.target.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    const d = dragRef.current;
    if (!d.active) return;
    const { x, y } = screenToSVG(e.clientX, e.clientY);
    const dx = x - d.startX;
    const dy = y - d.startY;

    if (!d.moved && dx * dx + dy * dy > 9) {
      d.moved = true;
    }
    if (!d.moved) return;

    dragNode(simRef.current, d.nodeId, x, y, boardSize.w, boardSize.h);
  }

  function onPointerUp(e) {
    const d = dragRef.current;
    if (!d.active) return;
    const wasDrag = d.moved;
    const nodeId = d.nodeId;
    d.active = false;

    releaseNode(simRef.current, nodeId);

    if (!wasDrag) {
      if (e.button === 2) {
        handleRightClick(e, nodeId);
      } else {
        handleClick(nodeId);
      }
    }
  }

  function startGame() {
    if (simRef.current) simRef.current.stop();

    const rect = boardRef.current.getBoundingClientRect();
    const w = Math.max(MIN_WIDTH, rect.width);
    const h = Math.max(MIN_HEIGHT, rect.height);
    const { nodes, links, simulation } = generateGraph(nodeCount, w, h);

    attachSimTick(simulation, w, h, setNodes);

    simRef.current = simulation;
    setNodes(nodes);
    setLinks(links);
    setBoardSize({ w, h });
    setActiveMineCount(mineCount);
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

  useEffect(() => {
    return () => {
      if (simRef.current) simRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (gameState !== "won") return;

    document.body.style.overflow = "hidden";

    const colors = [
      "#88C0D0",
      "#A3BE8C",
      "#EBCB8B",
      "#B48EAD",
      "#BF616A",
      "#D08770",
    ];
    const rect = boardRef.current.getBoundingClientRect();
    const pad = 100;

    const id = setInterval(() => {
      for (let i = 0; i < 5; i++) {
        const colW = (rect.width - 2 * pad) / 5;
        fx({
          x: rect.left + pad + colW * (i + 0.15 + Math.random() * 0.7),
          y: rect.top + pad + 0.8 * Math.random() * (rect.height - 2 * pad),
          colors,
          particleTimeout: 2000,
        });
      }
    }, 700);

    const timeout = setTimeout(() => clearInterval(id), 3000);

    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [gameState]);

  function screenToSVG(clientX, clientY) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: svgPt.x, y: svgPt.y };
  }

  return (
    <div className="app">
      <nav className="toolbar">
        <div className="toolbar-row">
          <div className="difficulty-slider">
            <Slider
              min={0}
              max={DIFFICULTIES.length - 1}
              step={null}
              marks={Object.fromEntries(
                DIFFICULTIES.map((d, i) => [i, d.label]),
              )}
              value={diffLevel}
              onChange={setDiffLevel}
            />
          </div>
          <button onClick={startGame}>
            {gameState === "won" || gameState === "lost"
              ? "New Game"
              : "Start Game"}
          </button>

          {nodes.length > 0 && (
            <span className="status">
              {gameState === "won" && "| 🎉 You win!"}
              {gameState === "lost" && "| 💥 Game over!"}
              {(gameState === "idle" || gameState === "playing") &&
                `| Remaining Mines: ${displayMineCount - flagCount}`}
            </span>
          )}
        </div>
      </nav>
      <div className="board-section" ref={boardRef}>
        <svg
          ref={svgRef}
          className="board"
          viewBox={`0 0 ${boardSize.w} ${boardSize.h}`}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {links.map((link, i) => {
            const sourceID =
              typeof link.source === "object" ? link.source.id : link.source;
            const targetID =
              typeof link.target === "object" ? link.target.id : link.target;
            const sNode = nodes[sourceID];
            const tNode = nodes[targetID];
            if (!sNode || !tNode) return null;

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
            else if (node.isFlagged) fill = "var(--nord12)";

            return (
              <g key={node.id}>
                <circle
                  key={node.id}
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? 14 : isNeighbor ? 13 : 12}
                  fill={fill}
                  data-node-id={node.id}
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
                  // onClick={() => handleClick(node.id)}
                  // onContextMenu={(e) => handleRightClick(e, node.id)}
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
                  >
                    {node.adjacentMines}
                  </text>
                )}

                {node.isRevealed && node.isMine && (
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    pointerEvents="none"
                  >
                    💣
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
