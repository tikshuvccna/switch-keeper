/** Small network diagrams: generated at random, counted by the rules of the lesson, and drawn as SVG (coloured by domain). */
export type NodeType = 'pc' | 'sw' | 'hub' | 'rt';
export interface TNode { id: number; t: NodeType; x: number; y: number; label?: string }
export interface Topo { nodes: TNode[]; links: [number, number][] }

/** Collision domain of every link: a hub joins all its links into one domain; every other link is a domain of its own. */
export function collisionOf(t: Topo): number[] {
  const parent = t.links.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (const n of t.nodes.filter((x) => x.t === 'hub')) {
    const mine = t.links.map((l, i) => (l[0] === n.id || l[1] === n.id ? i : -1)).filter((i) => i >= 0);
    for (let k = 1; k < mine.length; k++) parent[find(mine[k])] = find(mine[0]);
  }
  const roots = [...new Set(t.links.map((_, i) => find(i)))];
  return t.links.map((_, i) => roots.indexOf(find(i)));
}
export const collisionCount = (t: Topo): number => new Set(collisionOf(t)).size;

/** Broadcast domain of every node except routers: the pieces left when the routers are removed. A router joins none of them. */
export function broadcastOf(t: Topo): Map<number, number> {
  const comp = new Map<number, number>();
  let c = 0;
  for (const n of t.nodes) {
    if (n.t === 'rt' || comp.has(n.id)) continue;
    const stack = [n.id];
    comp.set(n.id, c);
    while (stack.length) {
      const cur = stack.pop() as number;
      for (const [a, b] of t.links) {
        const o = a === cur ? b : b === cur ? a : -1;
        if (o < 0 || comp.has(o) || t.nodes[o].t === 'rt') continue;
        comp.set(o, c); stack.push(o);
      }
    }
    c++;
  }
  return comp;
}
export const broadcastCount = (t: Topo): number => new Set(broadcastOf(t).values()).size;

const COLORS = ['#e4572e', '#1fa89a', '#f2b134', '#6b3fa0', '#2f6fd1', '#7cc24a', '#d2509b', '#8a5a34'];
export const domainColor = (i: number): string => COLORS[i % COLORS.length];

// ------------------------------------------------------------------ building
interface Seg { root: TNode; ids: number[] }
class Builder {
  nodes: TNode[] = [];
  links: [number, number][] = [];
  add(t: NodeType, x = 0, y = 0): TNode { const n = { id: this.nodes.length, t, x, y }; this.nodes.push(n); return n; }
  link(a: TNode, b: TNode): void { this.links.push([a.id, b.id]); }
  /** A switch or hub with some PCs. */
  seg(kind: 'sw' | 'hub', pcs: number): Seg {
    const root = this.add(kind), ids = [root.id];
    for (let i = 0; i < pcs; i++) { const p = this.add('pc'); this.link(root, p); ids.push(p.id); }
    return { root, ids };
  }
}

type Rnd = () => number;
/** level 1: one switch or hub; 2: two devices joined; 3: a router with two or three segments. */
export function randomTopo(level: number, r: Rnd): Topo {
  const b = new Builder();
  const pcs = () => 2 + Math.floor(r() * 3);
  if (level <= 1) b.seg(r() < 0.6 ? 'sw' : 'hub', pcs());
  else if (level === 2) {
    const a = b.seg('sw', 1 + Math.floor(r() * 3));
    const second = b.seg(r() < 0.5 ? 'hub' : 'sw', 2 + Math.floor(r() * 2));
    b.link(a.root, second.root);
  } else {
    const rt = b.add('rt'), n = 2 + (r() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) { const s = b.seg(r() < 0.7 ? 'sw' : 'hub', 1 + Math.floor(r() * 3)); b.link(rt, s.root); }
  }
  const t: Topo = { nodes: b.nodes, links: b.links };
  layout(t);
  return t;
}
/** Place the nodes as a tree: the root at the top (a router, else the first device), children spread below it. */
export function layout(t: Topo, w = 520, h = 260): void {
  const adj = new Map<number, number[]>();
  for (const n of t.nodes) adj.set(n.id, []);
  for (const [a, b] of t.links) { adj.get(a)?.push(b); adj.get(b)?.push(a); }
  const root = t.nodes.find((n) => n.t === 'rt') ?? t.nodes[0];
  const kids = new Map<number, number[]>(), depth = new Map<number, number>([[root.id, 0]]);
  const q = [root.id];
  while (q.length) { const c = q.shift() as number; kids.set(c, []); for (const o of adj.get(c) ?? []) if (!depth.has(o)) { depth.set(o, (depth.get(c) as number) + 1); kids.get(c)?.push(o); q.push(o); } }
  const leaves = (id: number): number => { const k = kids.get(id) ?? []; return k.length ? k.reduce((a, c) => a + leaves(c), 0) : 1; };
  const total = leaves(root.id), maxD = Math.max(...depth.values());
  const place = (id: number, x0: number, x1: number): void => {
    const n = t.nodes[id]; n.x = (x0 + x1) / 2; n.y = 34 + (maxD === 0 ? 0 : ((h - 68) * (depth.get(id) as number)) / maxD);
    let cur = x0;
    for (const c of kids.get(id) ?? []) { const wd = ((x1 - x0) * leaves(c)) / Math.max(1, leaves(id)); place(c, cur, cur + wd); cur += wd; }
  };
  place(root.id, 20, w - 20);
  void total;
}

// ------------------------------------------------------------------ drawing
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag: string, attrs: Record<string, string | number>, parent?: Element): SVGElement => {
  const e = document.createElementNS(NS, tag);
  for (const k of Object.keys(attrs)) e.setAttribute(k, String(attrs[k]));
  parent?.appendChild(e);
  return e as SVGElement;
};
/** Draw a diagram. colorBy 'collision' colours the links by collision domain, 'broadcast' colours the devices by broadcast domain. */
export function drawTopo(t: Topo, colorBy: 'none' | 'collision' | 'broadcast' = 'none', w = 520, h = 260, hot?: Set<number>): SVGElement {
  const svg = sv('svg', { viewBox: `0 0 ${w} ${h}`, class: 'topo' });
  const col = colorBy === 'collision' ? collisionOf(t) : null;
  const bc = colorBy === 'broadcast' ? broadcastOf(t) : null;
  t.links.forEach(([a, b], i) => {
    const A = t.nodes[a], B = t.nodes[b];
    sv('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: '#1d1a33', 'stroke-width': 9, 'stroke-linecap': 'round' }, svg);
    sv('line', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: hot ? (hot.has(i) ? '#ff3d7f' : '#d9b98a') : col ? domainColor(col[i]) : '#d9b98a', 'stroke-width': hot && hot.has(i) ? 7 : 5, 'stroke-linecap': 'round' }, svg);
  });
  for (const n of t.nodes) {
    const fill = bc && n.t !== 'rt' ? domainColor(bc.get(n.id) ?? 0) : { pc: '#fff4dc', sw: '#7fb7e8', hub: '#f2b134', rt: '#d4402e' }[n.t];
    const g = sv('g', { transform: `translate(${n.x},${n.y})` }, svg);
    if (n.t === 'pc') { sv('rect', { x: -17, y: -13, width: 34, height: 24, rx: 4, fill, stroke: '#1d1a33', 'stroke-width': 3 }, g); sv('rect', { x: -10, y: -7, width: 20, height: 12, fill: '#1d1a33', opacity: 0.8 }, g); sv('rect', { x: -9, y: 13, width: 18, height: 4, fill: '#1d1a33' }, g); }
    else if (n.t === 'sw') { sv('rect', { x: -26, y: -13, width: 52, height: 26, rx: 5, fill, stroke: '#1d1a33', 'stroke-width': 3 }, g); for (let i = 0; i < 4; i++) sv('rect', { x: -19 + i * 10, y: -3, width: 6, height: 8, fill: '#1d1a33' }, g); }
    else if (n.t === 'hub') { sv('polygon', { points: '-24,0 -12,-15 12,-15 24,0 12,15 -12,15', fill, stroke: '#1d1a33', 'stroke-width': 3 }, g); sv('circle', { r: 4, fill: '#1d1a33' }, g); }
    else { sv('circle', { r: 20, fill, stroke: '#1d1a33', 'stroke-width': 3 }, g); sv('path', { d: 'M-10 0H10M4 -6L10 0L4 6M-4 -6L-10 0L-4 6', stroke: '#fff4dc', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g); }
  }
  return svg;
}
export const TOPO_KEY = 'מקרא: מחשב · מתג (כחול) · רכזת (כתום, משושה) · נתב (אדום, עגול)';

/** A tiny fixed topology: one device in the middle with four PCs around it (used by the hub-versus-switch picture). */
export function star(kind: 'hub' | 'sw'): Topo {
  const nodes: TNode[] = [{ id: 0, t: kind, x: 130, y: 100 }, { id: 1, t: 'pc', x: 40, y: 40, label: 'A' }, { id: 2, t: 'pc', x: 220, y: 40, label: 'B' }, { id: 3, t: 'pc', x: 40, y: 170, label: 'C' }, { id: 4, t: 'pc', x: 220, y: 170, label: 'D' }];
  return { nodes, links: [[0, 1], [0, 2], [0, 3], [0, 4]] };
}
