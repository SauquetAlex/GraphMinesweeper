import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";

export const MIN_WIDTH = 800;
export const MIN_HEIGHT = 600;
export const PAD = 20;

function forceBoundBox(width, height, strength = 0.3) {
  let nodes;
  function force() {
    for (const n of nodes) {
      if (n.x < PAD) n.vx += (PAD - n.x) * strength;
      if (n.x > width - PAD) n.vx -= (n.x - (width - PAD)) * strength;
      if (n.y < PAD) n.vy += (PAD - n.y) * strength;
      if (n.y > height - PAD) n.vy -= (n.y - (height - PAD)) * strength;
    }
  }
  force.initialize = (n) => {
    nodes = n;
  };
  return force;
}

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
    x: width / 2,
    y: height / 2,
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

  // Spanning tree
  for (let i = 1; i < nodesCount; i++) {
    let success = false;
    while (!success) {
      success = addEdge(Math.floor(Math.random() * i), i);
    }
  }

  // Extra edges
  const extraEdges = nodesCount + 1;
  let added = 0;
  let attempts = 0;
  let maxAttempts = extraEdges * 5; // To ensure we have enough extra edges.

  while (added < extraEdges && attempts < maxAttempts) {
    attempts++;
    const source = Math.floor(Math.random() * nodesCount);
    const target = Math.floor(Math.random() * nodesCount);
    if (addEdge(source, target)) {
      added++;
    }
  }

  // Simulation
  const simulation = forceSimulation(nodes)
    .force(
      "link",
      forceLink(links)
        .id((d) => d.id)
        .distance(40),
    )
    .force("charge", forceManyBody().strength(-150))
    .force("center", forceCenter(width / 2, height / 2))
    .force("collide", forceCollide(30))
    .force("bounds", forceBoundBox(width, height, 1))
    .stop();

  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }

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

  return { nodes, links };
}
