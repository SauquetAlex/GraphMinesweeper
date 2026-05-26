# Graph Minesweeper

Minesweeper, but the board is a random graph instead of a grid. Nodes are connected by edges derived from a Delaunay triangulation, laid out by a D3 force simulation. The graph is live — you can drag nodes around while you play.

## How to play

The rules are the same as classic Minesweeper, adapted to a graph:

- **Left-click** a node to reveal it. The number shown is how many of its direct neighbors are mines.
- **Right-click** a node to place or remove a flag.
- **Left-click a revealed node** to chord-reveal: if the number of flagged neighbors matches the node's mine count, all unflagged neighbors are revealed at once.
- **Drag** a node to reposition it. The simulation keeps the graph tidy as you move things around.

Your first click is always safe — mines are placed after the first reveal.

You win when every non-mine node is revealed.

## Difficulties

| Level | Nodes | Mines |
|---|---|---|
| Easy | 64 | 12 |
| Medium | 128 | 24 |
| Hard | 256 | 48 |
| Expert | 512 | 96 |
| Working with Team Conquer | 1024 | 224 |

## Running locally

```bash
npm install
npm run dev
```

## Tech

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [d3-force](https://d3js.org/d3-force) for node layout and drag physics
- [d3-delaunay](https://d3js.org/d3-delaunay) to generate the graph edges
- [rc-slider](https://slider-react-component.vercel.app/) for the difficulty picker
