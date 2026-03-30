/*
 * Places mines randomly on the graph, except on a safe starting node.
 */
export function initMines(nodes, mineCount, safeID) {
  const candidates = [];
  for (let i = 0; i < nodes.length; i++) {
    if (i !== safeID) {
      candidates.push(i);
    }
  }

  // Fisher Yates https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  mineCount = Math.min(mineCount, candidates.length);
  const mineSet = new Set(candidates.slice(0, mineCount));
  let updatedNodes = nodes.map((node) => ({
    ...node,
    isMine: mineSet.has(node.id),
    adjacentMines: node.neighbors.reduce(
      (count, nodeId) => count + (mineSet.has(nodeId) ? 1 : 0),
      0,
    ),
  }));

  return updatedNodes;
}

/*
 * Reveals a node and does BFS flood to reveal connected 0 adj mine nodes.
 */
export function revealNode(nodes, id) {
  const node = nodes[id];
  if (node.isRevealed || node.isFlagged) {
    return { nodes, hitMine: false };
  }

  if (node.isMine) {
    const updatedNodes = nodes.map((n) =>
      n.isMine ? { ...n, isRevealed: true } : n,
    );
    return { nodes: updatedNodes, hitMine: true };
  }

  const revealed = new Set();
  const queue = [id];
  revealed.add(id);

  while (queue.length > 0) {
    const cur = queue.shift();
    const curNode = nodes[cur];

    if (curNode.adjacentMines === 0) {
      for (const nodeId of curNode.neighbors) {
        if (!revealed.has(nodeId) && !nodes[nodeId].isMine) {
          queue.push(nodeId);
          revealed.add(nodeId);
        }
      }
    }
  }

  const updatedNodes = nodes.map((n) =>
    revealed.has(n.id) ? { ...n, isRevealed: true, isFlagged: false } : n,
  );

  return { nodes: updatedNodes, hitMine: false };
}

export function toggleFlag(nodes, id) {
  const node = nodes[id];
  if (node.isRevealed) return nodes;
  return nodes.map((n) =>
    n.id === id ? { ...n, isFlagged: !n.isFlagged } : n,
  );
}

export function checkWin(nodes) {
  if (nodes.length === 0) return false;
  return nodes.every((node) => node.isMine || node.isRevealed);
}

export function chordReveal(nodes, id) {
  const node = nodes[id];
  if (!node.isRevealed || node.isMine || node.adjacentMines === 0)
    return { nodes, hitMine: false };

  const flaggedCount = node.neighbors.filter((n) => nodes[n].isFlagged).length;
  if (flaggedCount !== node.adjacentMines) return { nodes, hitMine: false };

  let cur = nodes,
    hit = false;
  for (const nId of node.neighbors) {
    if (!cur[nId].isRevealed && !cur[nId].isFlagged) {
      const res = revealNode(cur, nId);
      cur = res.nodes;
      if (res.hitMine) hit = true;
    }
  }
  return { nodes: cur, hitMine: hit };
}
