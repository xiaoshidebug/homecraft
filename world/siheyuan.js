// 四合院建筑群：围墙与月亮门、大门门楼、影壁、可进入的正房、东西厢房与檐廊、倒座房、坡屋顶。
// 长构件按 ~1.5 m 分段摆放：BoxBatch 单位盒每面贴图 0..1，整块大盒子会拉伸 16×16 贴图。
import { BoxBatch } from '@engine/world/blocks.js';
import { COMPOUND, PLATFORM } from './layout.js';

const inRect = (r, x, z) => x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1;

// 主材：青砖、朱红木作、灰瓦（每处不超过三种主材）
const BRICK = { tex: 'white_brick', tint: 0x8a8f95 };
const BRICK_DARK = { tex: 'white_brick', tint: 0x6e737a };
const CAP = { tex: 'roof', tint: 0x6a707a };
const TILE = { tex: 'roof' };
const TILE_RIDGE = { tex: 'roof', tint: 0x767c84 };
const RED = { tex: 'wood_panel', tint: 0x9e3a2a };
const RED_BEAM = { tex: 'paint', tint: 0x9e3a2a };
const RED_DEEP = { tex: 'wood_panel', tint: 0x83301f };
const WOOD_DARK = { tex: 'walnut' };
const STONE = { tex: 'stone', tint: 0x9a9ea3 };
const GLASS = { tex: 'glass', glass: true };

export function defineBlocks(grid) {
  grid.define('brick_grey', { tex: { all: 'white_brick' }, tint: 0x8a8f95, merge: true, map: '#878c92' });
  grid.define('court_brick', { tex: { all: 'pavers' }, tint: 0x9aa0a6, merge: true, map: '#949aa0' });
  grid.define('path_stone', { tex: { all: 'travertine' }, tint: 0xc2c4c6, merge: true, map: '#b9bbbd' });
}

// 院内甬道与前广场石径
const PATHS = [
  { x0: -7.4, x1: -4.6, z0: -6.4, z1: 8.3 },   // 甬道：正房台阶向南
  { x0: 8.7, x1: 11.3, z0: 3, z1: 11 },        // 大门直通院内
  { x0: 4.5, x1: 7.8, z0: 4, z1: 11 },         // 倒座房前过道
  { x0: -1.5, x1: 2.5, z0: 14.5, z1: 21 },     // 出生点前坪
  { x0: -1.5, x1: 13.5, z0: 14.5, z1: 17.5 },  // 前坪连大门
  { x0: 6.5, x1: 13.5, z0: 10, z1: 14.5 },     // 大门前
  { x0: 9.6, x1: 11.4, z0: -21, z1: -13 },     // 月亮门进后花园
];

export function surfaceAt(x, z) {
  if (inRect(COMPOUND.court, x, z)) {
    for (const p of PATHS.slice(0, 3)) if (inRect(p, x, z)) return 'path_stone';
    return 'court_brick';
  }
  for (const p of PATHS.slice(3)) if (inRect(p, x, z)) return 'path_stone';
  return 'grass';
}

export function buildArchitecture({ grid, layer }) {
  const B = new BoxBatch(layer), R = new BoxBatch(layer);
  const W = { N: new BoxBatch(layer), S: new BoxBatch(layer), E: new BoxBatch(layer), W: new BoxBatch(layer) };
  const batches = { static: B, roof: R, wallN: W.N, wallS: W.S, wallE: W.E, wallW: W.W };
  const obstacles = [];
  const foot = (x, z, w, d, level = 0) => obstacles.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, level });

  // 长条分段（horiz: 沿 x 或 z 切）
  const seg = (batch, cx, y, cz, w, h, d, look, opts = {}, len = 1.6, horiz = 'x') => {
    const total = horiz === 'x' ? w : d;
    const n = Math.max(1, Math.round(total / len));
    for (let i = 0; i < n; i++) {
      const t0 = (i * total) / n, t1 = ((i + 1) * total) / n, tm = (t0 + t1) / 2, sl = t1 - t0 + 0.02;
      if (horiz === 'x') batch.box(cx - total / 2 + tm, y, cz, sl, h, d, look, opts);
      else batch.box(cx, y, cz - total / 2 + tm, w, h, sl, look, opts);
    }
  };
  // 双向分段的大体积
  const seg2 = (batch, cx, y, cz, w, h, d, look, opts = {}, len = 1.6) => {
    const nx = Math.max(1, Math.round(w / len)), nz = Math.max(1, Math.round(d / len));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const wx0 = (i * w) / nx, wx1 = ((i + 1) * w) / nx, wz0 = (j * d) / nz, wz1 = ((j + 1) * d) / nz;
      batch.box(cx - w / 2 + (wx0 + wx1) / 2, y, cz - d / 2 + (wz0 + wz1) / 2, wx1 - wx0 + 0.02, h, wz1 - wz0 + 0.02, look, opts);
    }
  };
  // 坡屋面：从屋脊向檐口铺瓦条。axis 'z' 屋脊沿 x（坡向南北），axis 'x' 屋脊沿 z
  const tileSlope = (batch, { c1, ridgeAt, dir, run, yRidge, yEave, w, thick = 0.2, look = TILE, segLen = 1.5, axis = 'z' }) => {
    const rise = yRidge - yEave, len = Math.hypot(run, rise);
    const cosA = run / len, sinA = rise / len, ang = Math.atan2(rise, run);
    const rows = Math.max(1, Math.round(run / segLen)), cols = Math.max(1, Math.round(w / segLen));
    for (let i = 0; i < rows; i++) {
      const u0 = (i * run) / rows, u1 = ((i + 1) * run) / rows, um = (u0 + u1) / 2;
      const yS = yRidge - um * (rise / run), pS = ridgeAt + dir * um, d = (u1 - u0) / cosA + 0.06;
      for (let j = 0; j < cols; j++) {
        const t0 = (j * w) / cols, t1 = ((j + 1) * w) / cols, tm = (t0 + t1) / 2;
        const sw = t1 - t0 + 0.04;
        if (axis === 'z') batch.box(c1 - w / 2 + tm, yS - cosA * thick / 2, pS - dir * sinA * thick / 2, sw, thick, d, look, { rx: dir * ang });
        else batch.box(pS - dir * sinA * thick / 2, yS - cosA * thick / 2, c1 - w / 2 + tm, d, thick, sw, look, { rz: -dir * ang });
      }
    }
  };
  // 木格窗：框 + 玻璃 + 竖条横条，ry 控制朝向
  const latticeWindow = (batch, x, y0, z, w, h, ry = 0, depth = 0.12) => {
    batch.at(x, y0, z, ry, () => {
      const f = 0.13;
      batch.box(0, -f, 0, w + f * 2, f, depth, RED);
      batch.box(0, h, 0, w + f * 2, f, depth, RED);
      batch.box(-w / 2 - f / 2, 0, 0, f, h, depth, RED);
      batch.box(w / 2 + f / 2, 0, 0, f, h, depth, RED);
      batch.box(0, 0, 0, w, h, depth * 0.5, GLASS, { shadow: false });
      const bars = Math.max(2, Math.round(w / 0.45));
      for (let i = 1; i < bars; i++) batch.box(-w / 2 + (i * w) / bars, 0, 0, 0.07, h, depth * 0.7, RED, { shadow: false });
      for (let i = 1; i < 4; i++) batch.box(0, (i * h) / 4, 0, w, 0.07, depth * 0.7, RED, { shadow: false });
    });
  };

  /* ---------- 围墙（体素） + 墙帽 ---------- */
  const cw = COMPOUND.wall, mg = COMPOUND.moonGate, WH = 3;
  for (let x = cw.x0; x < cw.x1; x++) {
    for (let z = cw.z0; z < cw.z1; z++) {
      const onRing = x < -21 || x >= 17 || z < -13 || z >= 11;
      if (!onRing) continue;
      const top = z === -14 && x >= 8 && x < 13 ? 4 : WH;   // 月亮门两侧墙加高，圆洞上方留砖
      for (let y = 0; y < top; y++) {
        if (z >= 11 && x >= COMPOUND.gate.x0 && x < COMPOUND.gate.x1) continue;   // 大门
        if (z === -14 && Math.hypot(x + 0.5 - mg.x, y + 0.5 - mg.y) < mg.r) continue; // 月亮门
        grid.set(x, y, z, 'brick_grey', 'static');
      }
    }
  }
  seg(B, -7, WH, -13.5, 30, 0.22, 1.3, CAP, {}, 1.6);                            // 北墙帽（月亮门西段）
  seg(B, 15.5, WH, -13.5, 5, 0.22, 1.3, CAP, {}, 1.6);                           // 北墙帽（东段）
  seg(B, 10.5, 4, -13.5, 6.2, 0.22, 1.3, CAP, {}, 1.6);                          // 月亮门段墙帽（加高）
  seg(B, -7.4, WH, 11.5, 29.2, 0.22, 1.3, CAP, {}, 1.6);                         // 南墙帽（西段）
  seg(B, 15.3, WH, 11.5, 5.4, 0.22, 1.3, CAP, {}, 1.6);                          // 南墙帽（东段）
  seg(B, -21.5, WH, -1, 1.3, 0.22, 26.6, CAP, {}, 1.6, 'z');                     // 西墙帽
  seg(B, 17.5, WH, -1, 1.3, 0.22, 26.6, CAP, {}, 1.6, 'z');                      // 东墙帽

  /* ---------- 倒座房 ---------- */
  const sb = COMPOUND.southBlock, sbcx = (sb.x0 + sb.x1) / 2, sbcz = (sb.z0 + sb.z1) / 2;
  seg2(B, sbcx, 0, sbcz, sb.x1 - sb.x0, 0.6, sb.z1 - sb.z0, BRICK_DARK);
  seg2(B, sbcx, 0.6, sbcz, sb.x1 - sb.x0, 2.4, sb.z1 - sb.z0, BRICK);
  tileSlope(R, { c1: sbcx, ridgeAt: sbcz, dir: 1, run: 2.3, yRidge: 4.0, yEave: 3.0, w: sb.x1 - sb.x0 + 0.4 });
  tileSlope(R, { c1: sbcx, ridgeAt: sbcz, dir: -1, run: 2.3, yRidge: 4.0, yEave: 3.0, w: sb.x1 - sb.x0 + 0.4 });
  seg(R, sbcx, 3.88, sbcz, sb.x1 - sb.x0 + 0.6, 0.34, 0.6, TILE_RIDGE, {}, 1.6);
  for (const wx of [-17, -12.3, -7.6, -3]) latticeWindow(B, wx, 1.2, sb.z0 - 0.06, 1.2, 1.1, Math.PI, 0.1);
  foot(sbcx, sbcz, sb.x1 - sb.x0 + 0.2, sb.z1 - sb.z0 + 0.1);

  /* ---------- 大门门楼 ---------- */
  const g = COMPOUND.gate, gcx = (g.x0 + g.x1) / 2;
  B.box(g.x0 + 0.25, 0, 11.5, 0.5, 3.0, 0.9, RED);
  B.box(g.x1 - 0.25, 0, 11.5, 0.5, 3.0, 0.9, RED);
  seg(B, gcx, 2.5, 11.5, g.x1 - g.x0 + 0.3, 0.5, 1.0, RED_BEAM, {}, 1.6);         // 门楣
  tileSlope(R, { c1: gcx, ridgeAt: 11.5, dir: 1, run: 2.3, yRidge: 4.6, yEave: 3.6, w: 6.4 });
  tileSlope(R, { c1: gcx, ridgeAt: 11.5, dir: -1, run: 2.3, yRidge: 4.6, yEave: 3.6, w: 6.4 });
  seg(R, gcx, 4.48, 11.5, 6.5, 0.32, 0.55, TILE_RIDGE, {}, 1.6);
  R.box(g.x0 - 1.05, 4.8, 11.5, 0.35, 0.45, 0.45, TILE_RIDGE);
  R.box(g.x1 + 1.05, 4.8, 11.5, 0.35, 0.45, 0.45, TILE_RIDGE);
  B.box(gcx, 0, 11.4, g.x1 - g.x0 - 0.4, 0.16, 0.3, RED_DEEP, { shadow: false }); // 门槛
  B.box(g.x0 - 0.28, 0, 11.65, 0.55, 0.75, 0.85, STONE);                          // 门枕石
  B.box(g.x1 + 0.28, 0, 11.65, 0.55, 0.75, 0.85, STONE);
  B.box(g.x0 + 0.62, 0, 10.4, 0.1, 2.55, 1.85, WOOD_DARK, { ry: -0.55 });         // 敞开的门扇
  B.box(g.x1 - 0.62, 0, 10.4, 0.1, 2.55, 1.85, WOOD_DARK, { ry: 0.55 });
  foot(g.x0 + 0.25, 11.5, 0.7, 1.1);
  foot(g.x1 - 0.25, 11.5, 0.7, 1.1);
  foot(g.x0 + 0.62, 10.4, 1.1, 1.9);
  foot(g.x1 - 0.62, 10.4, 1.1, 1.9);

  /* ---------- 正房（可进入） ---------- */
  const hy = PLATFORM.y, WTOP = 4.2;
  // 台基 + 台上木地板 + 前阶
  seg2(B, -6, 0, -10, 19.2, hy, 7.2, { tex: 'travertine', tint: 0xaeb2b5 });
  B.box(-6, hy, -10, 17.2, 0.05, 5.2, { tex: 'oak', tint: 0xcfae82 }, { shadow: false });
  B.box(-6, 0, -6.05, 3.4, 0.2, 0.7, { tex: 'travertine', tint: 0xb5b8ba });

  // 南立面（wallS）：五开间，明间开门
  const bays = [[-15, -11.4], [-11.4, -7.8], [-7.8, -4.2], [-4.2, -0.6], [-0.6, 3]];
  seg(W.S, -6, hy, -7.15, 18, 0.6, 0.3, BRICK_DARK, {}, 1.6);                     // 裙墙
  for (const [bx0, bx1] of bays) {
    const bc = (bx0 + bx1) / 2, bw = bx1 - bx0;
    if (bx0 === -7.8) {                                                          // 明间：门洞 -7.1..-4.9
      W.S.box(bx0 + 0.35, 1.0, -7.15, 0.7, WTOP - 1.0, 0.3, BRICK);
      W.S.box(bx1 - 0.35, 1.0, -7.15, 0.7, WTOP - 1.0, 0.3, BRICK);
      W.S.box(bc, 2.7, -7.15, 2.2, WTOP - 2.7, 0.3, BRICK);
      W.S.box(-7.1, hy, -7.15, 0.34, 2.3, 0.34, RED);                            // 门框
      W.S.box(-4.9, hy, -7.15, 0.34, 2.3, 0.34, RED);
    } else {                                                                     // 次间：木格窗
      W.S.box(bc, 1.0, -7.15, bw, 0.4, 0.3, BRICK);
      W.S.box(bc, 3.1, -7.15, bw, WTOP - 3.1, 0.3, BRICK);
      latticeWindow(W.S, bc, 1.4, -7.14, 1.9, 1.7, 0, 0.14);
    }
  }
  for (const px of [-15, -11.4, -7.8, -4.2, -0.6, 3]) {                          // 檐柱 + 柱础
    W.S.box(px, hy, -6.93, 0.42, WTOP - hy, 0.42, RED);
    W.S.box(px, hy, -6.93, 0.56, 0.24, 0.56, STONE, { shadow: false });
    foot(px, -6.93, 0.5, 0.5);
  }
  seg(W.S, -6, 3.78, -6.82, 18.4, 0.42, 0.36, RED_BEAM, {}, 1.6);                // 额枋

  // 北 / 东 / 西墙（内衬白灰墙面，堂屋更明亮）
  const PLASTER = { tex: 'plaster', tint: 0xe7e2d4 };
  seg(W.N, -6, hy, -12.85, 18, 0.6, 0.3, BRICK_DARK, {}, 1.6);
  seg(W.N, -6, 1.0, -12.85, 18, WTOP - 1.0, 0.3, BRICK, {}, 1.6);
  seg(W.N, -6, hy, -12.67, 16, WTOP - hy, 0.05, PLASTER, { shadow: false }, 1.6);
  for (const wx of [-10.5, -1.5]) latticeWindow(W.N, wx, 1.7, -13.02, 1.3, 1.2, Math.PI, 0.1);
  seg(W.E, 2.85, hy, -10, 0.3, 0.6, 5.7, BRICK_DARK, {}, 1.5, 'z');
  seg(W.E, 2.85, 1.0, -10, 0.3, WTOP - 1.0, 5.7, BRICK, {}, 1.5, 'z');
  seg(W.E, 2.68, hy, -10, 0.05, WTOP - hy, 4.8, PLASTER, { shadow: false }, 1.6, 'z');
  latticeWindow(W.E, 3.02, 1.7, -10, 1.3, 1.2, Math.PI / 2, 0.1);
  seg(W.W, -14.85, hy, -10, 0.3, 0.6, 5.7, BRICK_DARK, {}, 1.5, 'z');
  seg(W.W, -14.85, 1.0, -10, 0.3, WTOP - 1.0, 5.7, BRICK, {}, 1.5, 'z');
  seg(W.W, -14.68, hy, -10, 0.05, WTOP - hy, 4.8, PLASTER, { shadow: false }, 1.6, 'z');
  latticeWindow(W.W, -15.02, 1.7, -10, 1.3, 1.2, -Math.PI / 2, 0.1);
  // 南墙内衬（门洞留空 + 门楣上方补齐）
  seg(W.S, -10.8, hy, -7.03, 7.4, WTOP - hy, 0.05, PLASTER, { shadow: false }, 1.6);
  seg(W.S, -0.95, hy, -7.03, 7.5, WTOP - hy, 0.05, PLASTER, { shadow: false }, 1.6);
  W.S.box(-6, 2.7, -7.03, 2.2, WTOP - 2.7, 0.05, PLASTER, { shadow: false });

  // 正房屋顶：脊 y 5.7，檐 y 4.25，前后坡出檐 0.75
  tileSlope(R, { c1: -6, ridgeAt: -10, dir: 1, run: 3.75, yRidge: 5.7, yEave: 4.25, w: 19.2 });
  tileSlope(R, { c1: -6, ridgeAt: -10, dir: -1, run: 3.75, yRidge: 5.7, yEave: 4.25, w: 19.2 });
  seg(R, -6, 5.58, -10, 19.4, 0.34, 0.6, TILE_RIDGE, {}, 1.6);
  R.box(-9.6, 5.92, -10, 0.4, 0.5, 0.5, TILE_RIDGE);
  R.box(9.6, 5.92, -10, 0.4, 0.5, 0.5, TILE_RIDGE);
  for (const sx of [-1, 1]) for (const sz of [-1, 1])                            // 四角翘檐
    R.box(sx * 9.3, 4.34, -10 + sz * 3.45, 0.6, 0.14, 1.15, TILE, { rx: sz * 0.68 });

  foot(-11.15, -7.15, 7.7, 0.5);                                                 // 南墙（留门洞）
  foot(-0.85, -7.15, 7.7, 0.5);
  foot(-6, -12.85, 18.2, 0.5);
  foot(2.85, -10, 0.5, 6.2);
  foot(-14.85, -10, 0.5, 6.2);

  /* ---------- 东西厢房 + 檐廊 ---------- */
  const wing = (x0, x1, ridgeX, verandaX) => {
    const wx = (x0 + x1) / 2, wz = -1.5, wd = x1 - x0;
    seg2(B, wx, 0, wz, wd, 0.6, 9, BRICK_DARK, {}, 1.6);
    seg2(B, wx, 0.6, wz, wd, 2.4, 9, BRICK, {}, 1.6);
    // 向庭院一侧出檐盖住檐廊（inDir：庭院在厢房的 -x 还是 +x 侧）
    const inDir = verandaX > wx ? 1 : -1;
    const runIn = Math.abs(ridgeX - verandaX) + 0.3;
    const backX = inDir === -1 ? x1 : x0;
    const runOut = Math.abs(ridgeX - backX) + 0.3;
    tileSlope(R, { c1: wz, ridgeAt: ridgeX, dir: inDir, run: runIn, yRidge: 4.0, yEave: 2.9, w: 9.4, axis: 'x' });
    tileSlope(R, { c1: wz, ridgeAt: ridgeX, dir: -inDir, run: runOut, yRidge: 4.0, yEave: 2.9, w: 9.4, axis: 'x' });
    seg(R, ridgeX, 3.88, wz, 0.55, 0.34, 9.6, TILE_RIDGE, {}, 1.6, 'z');
    // 檐廊：地坪 + 排柱
    const vx = wx + inDir * (wd / 2 + 0.9);
    B.box(vx, 0, wz, 1.8, 0.12, 9, { tex: 'deck' });
    const px = vx + inDir * 0.65;
    for (const pz of [-5.6, -3.7, -1.8, 0.1, 2, 2.9]) {
      B.box(px, 0.12, pz, 0.26, 2.83, 0.26, RED);
      foot(px, pz, 0.34, 0.34);
    }
    // 朝庭院的木格窗与假门
    const faceX = inDir === -1 ? x0 - 0.06 : x1 + 0.06;
    const ry = inDir === -1 ? -Math.PI / 2 : Math.PI / 2;
    latticeWindow(B, faceX, 1.2, -3, 1.5, 1.6, ry, 0.1);
    latticeWindow(B, faceX, 1.2, 0.5, 1.5, 1.6, ry, 0.1);
    B.box(faceX, 0, 2.2, 0.1, 2.4, 1.4, WOOD_DARK, { shadow: false });
    B.box(faceX, 2.4, 2.2, 0.16, 0.16, 1.5, RED, { shadow: false });
    foot(wx, wz, wd + 0.1, 9.1);
  };
  wing(12, 17, 14.5, 10.2);    // 东厢：檐廊在西侧
  wing(-20, -15, -17.5, -13.2); // 西厢：檐廊在东侧

  /* ---------- 锦鲤池（西庭院，石沿压顶） ---------- */
  const TRAV = { tex: 'travertine', tint: 0xb5b8ba };
  const px0 = -13.0, px1 = -9.4, pz0 = 0, pz1 = 3, pcx = -11.2, pcz = 1.5;
  seg(B, pcx, 0, pz0 + 0.15, px1 - px0, 0.5, 0.3, STONE, {}, 1.5);            // 池壁四沿
  seg(B, pcx, 0, pz1 - 0.15, px1 - px0, 0.5, 0.3, STONE, {}, 1.5);
  B.box(px0 + 0.15, 0, pcz, 0.3, 0.5, pz1 - pz0 - 0.3, STONE);
  B.box(px1 - 0.15, 0, pcz, 0.3, 0.5, pz1 - pz0 - 0.3, STONE);
  seg(B, pcx, 0.5, pz0 + 0.17, px1 - px0 + 0.5, 0.08, 0.46, TRAV, {}, 1.5);   // 压顶石
  seg(B, pcx, 0.5, pz1 - 0.17, px1 - px0 + 0.5, 0.08, 0.46, TRAV, {}, 1.5);
  B.box(px0 + 0.17, 0.5, pcz, 0.46, 0.08, pz1 - pz0 - 0.1, TRAV);
  B.box(px1 - 0.17, 0.5, pcz, 0.46, 0.08, pz1 - pz0 - 0.1, TRAV);
  B.box(pcx, 0.02, pcz, 2.9, 0.14, 2.3, { tex: 'stone', tint: 0x3e434a });    // 池底
  B.box(pcx, 0.16, pcz, 3.0, 0.28, 2.4, { tex: 'water', tint: 0x8fb5a3, glass: true }, { shadow: false }); // 水体
  B.box(-10.3, 0.44, 0.7, 0.34, 0.02, 0.3, { tex: 'foliage', tint: 0x6f8f5e }, { shadow: false });  // 睡莲
  B.box(-12.2, 0.44, 2.3, 0.28, 0.02, 0.26, { tex: 'foliage', tint: 0x7fa066 }, { shadow: false });
  foot(pcx, pcz, px1 - px0, pz1 - pz0);

  return { batches, obstacles };
}
