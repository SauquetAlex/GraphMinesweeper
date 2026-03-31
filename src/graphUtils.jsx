import {
  forceSimulation,
  forceLink,
  // forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";

import { Delaunay } from "d3-delaunay";

export const MIN_WIDTH = 800;
export const MIN_HEIGHT = 600;
export const PAD = 25;

// function forceBoundBox(width, height, strength = 0.3) {
//   let nodes;
//   function force() {
//     for (const n of nodes) {
//       if (n.x < PAD) n.vx += (PAD - n.x) * strength;
//       if (n.x > width - PAD) n.vx -= (n.x - (width - PAD)) * strength;
//       if (n.y < PAD) n.vy += (PAD - n.y) * strength;
//       if (n.y > height - PAD) n.vy -= (n.y - (height - PAD)) * strength;
//     }
//   }
//   force.initialize = (n) => {
//     nodes = n;
//   };
//   return force;
// }

/*
 * Random connected graph generator which uses d3-force simulation to get positions.
 * ~4 degree per node
 *
 * @param {number} nodesCount - Number of nodes to generate.
 * @returns {{nodes: Array, links: Array}} - Object containing nodes and links arrays.
 */
export function generateGraph(nodesCount, width, height) {
  if (nodesCount === 0) return { nodes: [], links: [] };

  const nodes = Array.from({ length: nodesCount }, (_, i) => ({
    id: i,
    x: Math.random() * (width - 2 * PAD) + PAD,
    y: Math.random() * (height - 2 * PAD) + PAD,
    neighbors: [],
    isMine: false,
    isRevealed: false,
    isFlagged: false,
    adjacentMines: 0,
  }));

  const edgeSet = new Set();
  const links = [];
  const deg = new Array(nodesCount).fill(0);

  // Returns if edge was successfully added
  function addEdge(source, target) {
    if (source === target) return false;
    [source, target] = source < target ? [source, target] : [target, source];
    const key = source * nodesCount + target;
    if (edgeSet.has(key)) return false;
    if (deg[source] >= 8 || deg[target] >= 8) return false;

    edgeSet.add(key);
    links.push({ source: source, target: target });
    nodes[source].neighbors.push(target);
    nodes[target].neighbors.push(source);
    deg[source]++;
    deg[target]++;
    return true;
  }

  const delaunay = Delaunay.from(
    nodes,
    (n) => n.x,
    (n) => n.y,
  );
  for (let i = 0; i < nodesCount; i++) {
    for (const j of delaunay.neighbors(i)) {
      if (j > i) addEdge(i, j);
    }
  }

  // Remove some edges to make it more interesting


  // Simulation
  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink(links)
        .id((d) => d.id)
        .distance(40),
    )
    // .force("charge", forceManyBody().strength(-150))
    .force("center", forceCenter(width / 2, height / 2))
    .force("collide", forceCollide(30))
    // .force("bounds", forceBoundBox(width, height, 1))
    .stop();

  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }

  for (const n of nodes) {
    n.vx = 0;
    n.vy = 0;
  }

  simulation.force("link", null);
  simulation.force("charge", null);
  simulation.force("center", null);
  simulation.force("collide", forceCollide(20));

  // for (let i = 0; i < 50; i++) {
  //   simulation.tick();
  // }

  simulation.alpha(0.3).restart();

  let xMin = Infinity,
    xMax = -Infinity,
    yMin = Infinity,
    yMax = -Infinity;
  for (const n of nodes) {
    if (n.x < xMin) xMin = n.x;
    if (n.x > xMax) xMax = n.x;
    if (n.y < yMin) yMin = n.y;
    if (n.y > yMax) yMax = n.y;
  }
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  for (const n of nodes) {
    n.x = PAD + ((n.x - xMin) / xSpan) * (width - 2 * PAD);
    n.y = PAD + ((n.y - yMin) / ySpan) * (height - 2 * PAD);
  }

  return { nodes, links, simulation };
}

export function attachSimTick(simulation, width, height, onTick) {
  if (!simulation) return;
  simulation.on("tick", () => {
    const simNodes = simulation.nodes();
    for (const n of simNodes) {
      n.x = Math.max(PAD, Math.min(width - PAD, n.x));
      n.y = Math.max(PAD, Math.min(height - PAD, n.y));
    }
    onTick(simNodes.map((n) => ({ ...n })));
  });
}

export function dragNode(simulation, nodeId, x, y, width, height) {
  if (!simulation) return;
  const node = simulation.nodes()[nodeId];
  node.fx = Math.max(PAD, Math.min(width - PAD, x));
  node.fy = Math.max(PAD, Math.min(height - PAD, y));
  simulation.alpha(0.3).restart();
}

export function releaseNode(simulation, nodeId) {
  if (!simulation) return;
  const node = simulation.nodes()[nodeId];
  node.fx = null;
  node.fy = null;
}

export function syncSimNodes(simulation, updatedNodes) {
  if (!simulation) return;
  const simNodes = simulation.nodes();
  for (let i = 0; i < updatedNodes.length; i++) {
    simNodes[i].isMine = updatedNodes[i].isMine;
    simNodes[i].isRevealed = updatedNodes[i].isRevealed;
    simNodes[i].isFlagged = updatedNodes[i].isFlagged;
    simNodes[i].adjacentMines = updatedNodes[i].adjacentMines;
  }
}
