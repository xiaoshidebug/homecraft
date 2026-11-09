// 两层乡村小宅：石基灰泥外墙、黑框大窗、深色金属双坡屋顶、南向阳台、前院围栏与锦鲤池。
// 一层客厅/餐厨/卧室，二层主卧/书房/茶室，沿东墙直跑楼梯（floorAt 斜坡）上楼。
// 长构件按 ~1.5 m 分段摆放：BoxBatch 单位盒每面贴图 0..1，整块大盒子会拉伸 16×16 贴图。
import { BoxBatch } from '@engine/world/blocks.js';
import { LOFT, STAIRS } from './layout.js';

const inRect = (r, x, z) => x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1;

// 主材：乱石基层、奶油灰泥、黑铁框、深色金属瓦（对参考图取色）
const STONE = { tex: 'stone', tint: 0x9d9485 };
const PLASTER = { tex: 'plaster', tint: 0xe9e3d3 };
const PLASTER_IN = { tex: 'plaster', tint: 0xe7e2d4 };
const DARKFR = { tex: 'paint', tint: 0x24262a };
const BLACK = { tex: 'black_metal' };
const ROOF = { tex: 'roof' };
const ROOF_R = { tex: 'roof', tint: 0x767c84 };
const WOOD = { tex: 'oak' };
const WOOD_DARK = { tex: 'walnut' };
const STAIRWOOD = { tex: 'oak', tint: 0xb08d5f };
const FLOOR = { tex: 'oak', tint: 0xcfae82 };
const TRAV = { tex: 'travertine', tint: 0xb5b8ba };
const AMBER = { tex: 'paint', tint: 0xffd9a0, emissive: 0.9 };
const GLASS = { tex: 'glass', glass: true };

export function defineBlocks(grid) {
  grid.define('path_stone', { tex: { all: 'travertine' }, tint: 0xc2c4c6, merge: true, map: '#b9bbbd' });
}

// 宅前石径：出生点 → 院门 → 门廊
const PATHS = [
  { x0: -1.5, x1: 2.5, z0: 14.5, z1: 21 },      // 出生点前坪
  { x0: -1.5, x1: 13.5, z0: 14.5, z1: 17.5 },   // 东侧连路（邮箱/传送门草坪边）
  { x0: -0.4, x1: 3.4, z0: 6.3, z1: 14.5 },     // 院门到出生点
  { x0: -0.4, x1: 3.4, z0: -2.6, z1: 6.3 },     // 院门到门廊
  { x0: -6.4, x1: 3.4, z0: -2.6, z1: -0.2 },    // 门廊前石铺
];

export function surfaceAt(x, z) {
  for (const p of PATHS) if (inRect(p, x, z)) return 'path_stone';
  return 'grass';
}

export function buildArchitecture({ grid, layer }) {
  const B = new BoxBatch(layer), R = new BoxBatch(layer);
  const W = { N: new BoxBatch(layer), S: new BoxBatch(layer), E: new BoxBatch(layer), W: new BoxBatch(layer) };
  const batches = { static: B, roof: R, wallN: W.N, wallS: W.S, wallE: W.E, wallW: W.W };
  const obstacles = [];
  const foot = (x, z, w, d, level = 0) => obstacles.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, level });

  const seg = (batch, cx, y, cz, w, h, d, look, opts = {}, len = 1.6, horiz = 'x') => {
    const total = horiz === 'x' ? w : d;
    const n = Math.max(1, Math.round(total / len));
    for (let i = 0; i < n; i++) {
      const t0 = (i * total) / n, t1 = ((i + 1) * total) / n, tm = (t0 + t1) / 2, sl = t1 - t0 + 0.02;
      if (horiz === 'x') batch.box(cx - total / 2 + tm, y, cz, sl, h, d, look, opts);
      else batch.box(cx, y, cz - total / 2 + tm, w, h, sl, look, opts);
    }
  };
  const seg2 = (batch, cx, y, cz, w, h, d, look, opts = {}, len = 1.6) => {
    const nx = Math.max(1, Math.round(w / len)), nz = Math.max(1, Math.round(d / len));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const wx0 = (i * w) / nx, wx1 = ((i + 1) * w) / nx, wz0 = (j * d) / nz, wz1 = ((j + 1) * d) / nz;
      batch.box(cx - w / 2 + (wx0 + wx1) / 2, y, cz - d / 2 + (wz0 + wz1) / 2, wx1 - wx0 + 0.02, h, wz1 - wz0 + 0.02, look, opts);
    }
  };
  // 坡屋面：从屋脊向檐口铺瓦条。axis 'z' 屋脊沿 x（坡向南北），axis 'x' 屋脊沿 z（坡向东西）
  const tileSlope = (batch, { c1, ridgeAt, dir, run, yRidge, yEave, w, thick = 0.2, look = ROOF, segLen = 1.5, axis = 'z' }) => {
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
  // 带洞墙体：openings = [{ a0, a1, y0, y1 }]（门窗洞口，框体由调用方另放）
  const wallRun = (batch, axis, fixed, a0, a1, y0, y1, look, openings = [], segLen = 1.6) => {
    const box = (b0, b1, yy0, yy1) => {
      if (b1 - b0 <= 0.02 || yy1 - yy0 <= 0.02) return;
      const n = Math.max(1, Math.round((b1 - b0) / segLen));
      for (let i = 0; i < n; i++) {
        const t0 = (i * (b1 - b0)) / n, t1 = ((i + 1) * (b1 - b0)) / n, cc = b0 + (t0 + t1) / 2;
        if (axis === 'x') batch.box(cc, yy0, fixed, t1 - t0 + 0.02, yy1 - yy0, 0.3, look);
        else batch.box(fixed, yy0, cc, 0.3, yy1 - yy0, t1 - t0 + 0.02, look);
      }
    };
    const sorted = [...openings].sort((p, q) => p.a0 - q.a0);
    let cursor = a0;
    for (const o of sorted) {
      box(cursor, o.a0, y0, y1);
      box(o.a0, o.a1, y0, o.y0);
      box(o.a0, o.a1, o.y1, y1);
      cursor = o.a1;
    }
    box(cursor, a1, y0, y1);
  };
  // 黑框窗：外框 + 玻璃 + 中梃与横棂，ry 控制朝向（贴外墙外表面摆放）
  const darkWin = (batch, x, y0, z, w, h, ry = 0) => {
    batch.at(x, y0, z, ry, () => {
      const f = 0.12;
      batch.box(0, -f, 0, w + f * 2, f, 0.14, DARKFR);
      batch.box(0, h, 0, w + f * 2, f, 0.14, DARKFR);
      batch.box(-w / 2 - f / 2, 0, 0, f, h, 0.14, DARKFR);
      batch.box(w / 2 + f / 2, 0, 0, f, h, 0.14, DARKFR);
      batch.box(0, 0, 0, w, h, 0.06, GLASS, { shadow: false });
      batch.box(0, 0, 0, 0.08, h, 0.16, DARKFR, { shadow: false });
      batch.box(0, h * 0.72, 0, w, 0.08, 0.16, DARKFR, { shadow: false });
    });
  };

  /* ---------- 一层外墙（乱石） ---------- */
  wallRun(W.S, 'x', -4.15, -16, -2, 0, 3.0, STONE, [
    { a0: -14.6, a1: -11.6, y0: 1.0, y1: 2.6 },   // 卧室窗
    { a0: -8.4, a1: -5.4, y0: 1.0, y1: 2.6 },     // 客厅窗
    { a0: -4.6, a1: -2.6, y0: 0, y1: 2.2 },       // 入户门
  ]);
  wallRun(W.N, 'x', -11.85, -16, -2, 0, 3.0, STONE, [
    { a0: -14.5, a1: -12.5, y0: 1.0, y1: 2.6 },
    { a0: -7.5, a1: -4.5, y0: 1.0, y1: 2.6 },
  ]);
  wallRun(W.W, 'z', -15.85, -12, -4, 0, 3.0, STONE, [{ a0: -10.4, a1: -8.4, y0: 1.0, y1: 2.6 }]);
  wallRun(W.E, 'z', -2.15, -12, -4, 0, 3.0, STONE, [{ a0: -9.4, a1: -6.4, y0: 1.0, y1: 2.6 }]);
  darkWin(W.S, -13.1, 1.0, -3.93, 3.0, 1.6);
  darkWin(W.S, -6.9, 1.0, -3.93, 3.0, 1.6);
  darkWin(W.N, -13.5, 1.0, -12.07, 2.0, 1.6, Math.PI);
  darkWin(W.N, -6.0, 1.0, -12.07, 3.0, 1.6, Math.PI);
  darkWin(W.W, -16.07, 1.0, -9.4, 2.0, 1.6, -Math.PI / 2);
  darkWin(W.E, -1.93, 1.0, -7.9, 3.0, 1.6, Math.PI / 2);
  // 入户木门（双扇）+ 门框 + 门槛
  B.box(-4.75, 0, -4.15, 0.14, 2.3, 0.36, DARKFR);
  B.box(-2.45, 0, -4.15, 0.14, 2.3, 0.36, DARKFR);
  B.box(-3.6, 2.2, -4.15, 2.3, 0.12, 0.36, DARKFR);
  B.box(-4.12, 0, -4.05, 0.92, 2.12, 0.09, WOOD, { shadow: false });
  B.box(-3.08, 0, -4.05, 0.92, 2.12, 0.09, WOOD, { shadow: false });
  B.box(-3.6, 0, -4.02, 2.0, 0.14, 0.3, WOOD_DARK, { shadow: false });

  /* ---------- 楼板（二层地板 + 阳台）与一层室内木地板 ---------- */
  const SLAB = { tex: 'wood_panel', tint: 0x6b543d };
  seg2(B, -9, 0, -8, 13.4, 0.06, 7.4, FLOOR, { shadow: false });
  B.box(-9.75, 3.0, -8, 12.5, 0.3, 8, SLAB);         // 楼板西段（留楼梯井）
  B.box(-2.75, 3.0, -5.8, 1.5, 0.3, 3.6, SLAB);      // 楼板东段（楼梯以南）
  B.box(-9, 3.0, -3.4, 14, 0.3, 1.8, SLAB);          // 阳台楼板

  /* ---------- 二层外墙（奶油灰泥） ---------- */
  wallRun(W.S, 'x', -4.15, -16, -2, 3.3, 6.2, PLASTER, [
    { a0: -15.2, a1: -13.0, y0: 3.9, y1: 5.7 },   // 主卧窗
    { a0: -12.4, a1: -10.6, y0: 3.3, y1: 5.5 },   // 主卧阳台门
    { a0: -10.1, a1: -8.1, y0: 3.9, y1: 5.7 },
    { a0: -8.0, a1: -6.3, y0: 3.9, y1: 5.7 },     // 书房窗
    { a0: -5.0, a1: -3.2, y0: 3.3, y1: 5.5 },     // 书房阳台门
  ]);
  wallRun(W.N, 'x', -11.85, -16, -2, 3.3, 6.2, PLASTER, [
    { a0: -14.4, a1: -11.8, y0: 3.9, y1: 5.7 },
    { a0: -8.2, a1: -5.6, y0: 3.9, y1: 5.7 },
  ]);
  wallRun(W.W, 'z', -15.85, -12, -4, 3.3, 6.2, PLASTER, [{ a0: -9.8, a1: -7.8, y0: 3.9, y1: 5.7 }]);
  wallRun(W.E, 'z', -2.15, -12, -4, 3.3, 6.2, PLASTER, [{ a0: -7.2, a1: -5.2, y0: 3.9, y1: 5.7 }]);
  darkWin(W.S, -14.1, 3.9, -3.93, 2.2, 1.8);
  darkWin(W.S, -9.1, 3.9, -3.93, 2.0, 1.8);
  darkWin(W.S, -7.15, 3.9, -3.93, 1.7, 1.8);
  darkWin(W.S, -11.5, 3.3, -3.93, 1.8, 2.2);   // 阳台推拉门（主卧）
  darkWin(W.S, -4.1, 3.3, -3.93, 1.8, 2.2);    // 阳台推拉门（书房）
  darkWin(W.N, -13.1, 3.9, -12.07, 2.6, 1.8, Math.PI);
  darkWin(W.N, -6.9, 3.9, -12.07, 2.6, 1.8, Math.PI);
  darkWin(W.W, -16.07, 3.9, -8.8, 2.0, 1.8, -Math.PI / 2);
  darkWin(W.E, -1.93, 3.9, -6.2, 2.0, 1.8, Math.PI / 2);

  // 内墙白灰衬里（外墙内侧，随墙组一起隐藏；洞口与外墙一致）
  wallRun(W.S, 'x', -4.33, -15.7, -2.3, 0, 3.0, PLASTER_IN, [
    { a0: -14.6, a1: -11.6, y0: 1.0, y1: 2.6 },
    { a0: -8.4, a1: -5.4, y0: 1.0, y1: 2.6 },
    { a0: -4.6, a1: -2.6, y0: 0, y1: 2.2 },
  ]);
  wallRun(W.N, 'x', -11.67, -15.7, -2.3, 0, 3.0, PLASTER_IN, [
    { a0: -14.5, a1: -12.5, y0: 1.0, y1: 2.6 },
    { a0: -7.5, a1: -4.5, y0: 1.0, y1: 2.6 },
  ]);
  wallRun(W.W, 'z', -15.67, -11.7, -4.3, 0, 3.0, PLASTER_IN, [{ a0: -10.4, a1: -8.4, y0: 1.0, y1: 2.6 }]);
  wallRun(W.E, 'z', -2.33, -11.7, -4.3, 0, 3.0, PLASTER_IN, [{ a0: -9.4, a1: -6.4, y0: 1.0, y1: 2.6 }]);
  wallRun(W.S, 'x', -4.33, -15.7, -2.3, 3.3, 6.2, PLASTER_IN, [
    { a0: -15.2, a1: -13.0, y0: 3.9, y1: 5.7 },
    { a0: -12.4, a1: -10.6, y0: 3.3, y1: 5.5 },
    { a0: -10.1, a1: -8.1, y0: 3.9, y1: 5.7 },
    { a0: -8.0, a1: -6.3, y0: 3.9, y1: 5.7 },
    { a0: -5.0, a1: -3.2, y0: 3.3, y1: 5.5 },
  ]);
  wallRun(W.N, 'x', -11.67, -15.7, -2.3, 3.3, 6.2, PLASTER_IN, [
    { a0: -14.4, a1: -11.8, y0: 3.9, y1: 5.7 },
    { a0: -8.2, a1: -5.6, y0: 3.9, y1: 5.7 },
  ]);
  wallRun(W.W, 'z', -15.67, -11.7, -4.3, 3.3, 6.2, PLASTER_IN, [{ a0: -9.8, a1: -7.8, y0: 3.9, y1: 5.7 }]);
  wallRun(W.E, 'z', -2.33, -11.7, -4.3, 3.3, 6.2, PLASTER_IN, [{ a0: -7.2, a1: -5.2, y0: 3.9, y1: 5.7 }]);

  /* ---------- 屋顶：主双坡 + 入口前坡（交叠） ---------- */
  tileSlope(R, { c1: -9, ridgeAt: -8.6, dir: 1, run: 6.5, yRidge: 8.0, yEave: 5.26, w: 15.2 });
  tileSlope(R, { c1: -9, ridgeAt: -8.6, dir: -1, run: 3.8, yRidge: 8.0, yEave: 6.4, w: 15.2 });
  seg(R, -9, 7.88, -8.6, 15.4, 0.32, 0.6, ROOF_R, {}, 1.6);
  tileSlope(R, { c1: -6.45, ridgeAt: -4.15, dir: 1, run: 2.05, yRidge: 9.2, yEave: 6.5, w: 4.3, axis: 'x' });
  tileSlope(R, { c1: -6.45, ridgeAt: -4.15, dir: -1, run: 2.05, yRidge: 9.2, yEave: 6.5, w: 4.3, axis: 'x' });
  R.box(-4.15, 9.08, -6.45, 0.55, 0.32, 4.5, ROOF_R);
  for (let i = 0; i < 6; i++)                                                    // 前坡山墙（随南墙隐藏）
    W.S.box(-4.15, 6.2 + i * 0.5, -4.15, 4.1 - i * 0.7, 0.5, 0.3, PLASTER);
  for (let i = 0; i < 6; i++) {                                                  // 东西山墙（主坡两端封口）
    const w = 7.4 - (i + 1) * 1.133;
    W.W.box(-15.85, 6.2 + i * 0.3, -8.6, 0.3, 0.3, w, PLASTER);
    W.E.box(-2.15, 6.2 + i * 0.3, -8.6, 0.3, 0.3, w, PLASTER);
  }

  /* ---------- 门廊 ---------- */
  B.box(-4.15, 0, -3.25, 4.1, 0.12, 1.5, { tex: 'deck' });                       // 门廊木地坪
  B.box(-4.15, 0, -2.25, 3.2, 0.12, 0.5, { tex: 'deck' });                       // 台阶
  B.box(-4.15, 3.0, -3.25, 4.3, 0.28, 1.7, ROOF);                                // 门廊顶
  B.box(-6.0, 0, -2.65, 0.28, 3.0, 0.28, WOOD_DARK);
  B.box(-2.3, 0, -2.65, 0.28, 3.0, 0.28, WOOD_DARK);
  foot(-6.0, -2.65, 0.35, 0.35);
  foot(-2.3, -2.65, 0.35, 0.35);

  /* ---------- 隔墙（一层 + 二层，留门洞） ---------- */
  wallRun(B, 'z', -9.5, -11.7, -4.3, 0, 3.0, PLASTER_IN, [{ a0: -6.6, a1: -5.2, y0: 0, y1: 2.2 }]);
  wallRun(B, 'x', -8.2, -15.7, -9.5, 0, 3.0, PLASTER_IN, [{ a0: -13.4, a1: -12.0, y0: 0, y1: 2.2 }]);
  wallRun(B, 'z', -9.5, -11.7, -4.3, 3.3, 6.2, PLASTER_IN, [{ a0: -6.6, a1: -5.2, y0: 3.3, y1: 5.5 }]);
  wallRun(B, 'x', -8.2, -9.5, -3.5, 3.3, 6.2, PLASTER_IN, [{ a0: -6.3, a1: -4.9, y0: 3.3, y1: 5.5 }]);
  foot(-9.5, -9.15, 0.25, 5.1);
  foot(-9.5, -4.75, 0.25, 0.9);
  foot(-14.55, -8.2, 2.3, 0.25);
  foot(-10.75, -8.2, 2.5, 0.25);
  foot(-9.5, -9.15, 0.25, 5.1, 1);
  foot(-9.5, -4.75, 0.25, 0.9, 1);
  foot(-7.9, -8.2, 3.2, 0.25, 1);
  foot(-4.2, -8.2, 1.4, 0.25, 1);

  /* ---------- 楼梯：12 级踏步 + 扶手 + 二层井口护栏 ---------- */
  for (let i = 0; i < 12; i++)
    B.box(-2.9, i * 0.275, -7.6 - 0.325 * i - 0.1625, 1.15, 0.275, 0.345, STAIRWOOD);
  B.box(-3.62, 2.65, -9.55, 0.07, 0.1, 5.15, DARKFR, { rx: 0.701 });             // 斜扶手
  B.box(-3.62, 0, -7.7, 0.07, 1.0, 0.07, DARKFR);
  B.box(-3.62, 1.7, -9.55, 0.07, 1.0, 0.07, DARKFR);
  B.box(-3.62, 3.3, -11.4, 0.07, 1.0, 0.07, DARKFR);
  seg(B, -3.55, 4.15, -9.1, 0.09, 0.08, 3.0, DARKFR, {}, 3, 'z');                // 井口护栏（北端留口进茶室）
  seg(B, -3.55, 3.45, -9.1, 0.09, 0.07, 3.0, DARKFR, {}, 3, 'z');
  for (let z = -10.3; z > -7.8; z -= 0.55) B.box(-3.55, 3.3, z, 0.05, 0.85, 0.05, DARKFR, { shadow: false });
  foot(-3.55, -9.1, 0.15, 3.0, 1);

  /* ---------- 阳台栏杆 ---------- */
  seg(B, -9, 4.15, -2.6, 14, 0.09, 0.09, BLACK, {}, 1.6);
  seg(B, -9, 3.45, -2.6, 14, 0.07, 0.07, BLACK, {}, 1.6);
  for (let x = -15.6; x < -2.1; x += 0.6) B.box(x, 3.3, -2.6, 0.055, 0.85, 0.055, BLACK, { shadow: false });
  seg(B, -15.85, 4.15, -3.4, 0.09, 0.09, 1.7, BLACK, {}, 2, 'z');
  seg(B, -15.85, 3.45, -3.4, 0.07, 0.07, 1.7, BLACK, {}, 2, 'z');
  for (let z = -4.0; z < -2.7; z += 0.55) B.box(-15.85, 3.3, z, 0.055, 0.85, 0.055, BLACK, { shadow: false });
  seg(B, -2.15, 4.15, -3.4, 0.09, 0.09, 1.7, BLACK, {}, 2, 'z');
  seg(B, -2.15, 3.45, -3.4, 0.07, 0.07, 1.7, BLACK, {}, 2, 'z');
  for (let z = -4.0; z < -2.7; z += 0.55) B.box(-2.15, 3.3, z, 0.055, 0.85, 0.055, BLACK, { shadow: false });
  foot(-9, -2.6, 14, 0.25, 1);
  foot(-15.85, -3.4, 0.25, 1.8, 1);
  foot(-2.15, -3.4, 0.25, 1.8, 1);

  /* ---------- 前院围栏：石柱 + 黑铁艺 ---------- */
  const pillar = (x, tall) => {
    B.box(x, 0, 7.0, 0.9, tall, 0.9, STONE);
    B.box(x, tall, 7.0, 1.1, 0.15, 1.1, TRAV);
    foot(x, 7.0, 0.95, 0.95);
  };
  const fenceRun = (a0, a1) => {
    const c = (a0 + a1) / 2, len = a1 - a0;
    seg(B, c, 1.5, 7.0, len, 0.07, 0.07, BLACK, {}, 1.5);
    seg(B, c, 0.9, 7.0, len, 0.07, 0.07, BLACK, {}, 1.5);
    seg(B, c, 0.3, 7.0, len, 0.07, 0.07, BLACK, {}, 1.5);
    for (let x = a0 + 0.28; x < a1 - 0.12; x += 0.45) B.box(x, 0.3, 7.0, 0.055, 1.25, 0.055, BLACK, { shadow: false });
  };
  for (const x of [-18, -11, -4]) pillar(x, 2.0);
  pillar(0.4, 2.3);
  pillar(3.6, 2.3);
  pillar(4.6, 2.0);
  fenceRun(-17.55, -4.45);
  fenceRun(-3.55, 0.4 - 0.45);
  fenceRun(3.6 + 0.45, 4.15);
  for (let z = 6.7; z > 4.7; z -= 0.45) B.box(-18, 0.3, z, 0.055, 1.25, 0.055, BLACK, { shadow: false }); // 西端回转
  seg(B, -18, 1.5, 5.8, 0.07, 0.07, 2.4, BLACK, {}, 3, 'z');
  seg(B, -18, 0.3, 5.8, 0.07, 0.07, 2.4, BLACK, {}, 3, 'z');
  B.box(0.4, 2.45, 7.0, 0.24, 0.26, 0.24, AMBER, { shadow: false });             // 院门柱灯
  B.box(3.6, 2.45, 7.0, 0.24, 0.26, 0.24, AMBER, { shadow: false });
  foot(-11, 7.0, 13.1, 0.35);
  foot(-1.8, 7.0, 3.5, 0.35);
  foot(-18, 5.8, 0.35, 2.4);

  /* ---------- 锦鲤池（前院西草坪） ---------- */
  const px0 = -13.0, px1 = -9.4, pz0 = 0, pz1 = 3, pcx = -11.2, pcz = 1.5;
  seg(B, pcx, 0, pz0 + 0.15, px1 - px0, 0.5, 0.3, STONE, {}, 1.5);
  seg(B, pcx, 0, pz1 - 0.15, px1 - px0, 0.5, 0.3, STONE, {}, 1.5);
  B.box(px0 + 0.15, 0, pcz, 0.3, 0.5, pz1 - pz0 - 0.3, STONE);
  B.box(px1 - 0.15, 0, pcz, 0.3, 0.5, pz1 - pz0 - 0.3, STONE);
  seg(B, pcx, 0.5, pz0 + 0.17, px1 - px0 + 0.5, 0.08, 0.46, TRAV, {}, 1.5);
  seg(B, pcx, 0.5, pz1 - 0.17, px1 - px0 + 0.5, 0.08, 0.46, TRAV, {}, 1.5);
  B.box(px0 + 0.17, 0.5, pcz, 0.46, 0.08, pz1 - pz0 - 0.1, TRAV);
  B.box(px1 - 0.17, 0.5, pcz, 0.46, 0.08, pz1 - pz0 - 0.1, TRAV);
  B.box(pcx, 0.02, pcz, 2.9, 0.14, 2.3, { tex: 'stone', tint: 0x3e434a });
  B.box(pcx, 0.16, pcz, 3.0, 0.28, 2.4, { tex: 'water', tint: 0x8fb5a3, glass: true }, { shadow: false });
  B.box(-10.3, 0.44, 0.7, 0.34, 0.02, 0.3, { tex: 'foliage', tint: 0x6f8f5e }, { shadow: false });
  B.box(-12.2, 0.44, 2.3, 0.28, 0.02, 0.26, { tex: 'foliage', tint: 0x7fa066 }, { shadow: false });
  foot(pcx, pcz, px1 - px0, pz1 - pz0);

  /* ---------- 外墙灌木与门廊盆栽 ---------- */
  const bush = (x, z, s = 1.0) => {
    B.box(x, 0, z, s, 0.7, s * 0.9, { tex: 'foliage', tint: 0x5f7d52 });
    B.box(x, 0.7, z, s * 0.7, 0.4, s * 0.6, { tex: 'foliage', tint: 0x6f8f5e }, { shadow: false });
    foot(x, z, s + 0.2, s * 0.9 + 0.2);
  };
  bush(-13.6, -3.6);
  bush(-10.9, -3.7, 0.85);
  bush(-7.2, -3.6);
  bush(-0.9, -3.8, 0.9);
  const cone = (x, z) => {                                                       // 门廊两侧盆栽针叶
    B.box(x, 0, z, 0.5, 0.45, 0.5, { tex: 'paint', tint: 0xa8683f });
    B.box(x, 0.45, z, 0.75, 0.5, 0.75, { tex: 'foliage', tint: 0x4a6b45 });
    B.box(x, 0.95, z, 0.55, 0.45, 0.55, { tex: 'foliage', tint: 0x5a7d50 }, { shadow: false });
    B.box(x, 1.4, z, 0.35, 0.4, 0.35, { tex: 'foliage', tint: 0x6a8f5e }, { shadow: false });
    foot(x, z, 0.6, 0.6);
  };
  cone(-5.3, -3.3);
  cone(-1.9, -3.3);

  /* ---------- 外墙障碍 ---------- */
  foot(-10.3, -4.15, 11.4, 0.5);   // 南墙（留入户门）
  foot(-2.45, -4.15, 0.3, 0.5);
  foot(-9, -11.85, 14, 0.5);
  foot(-15.85, -8, 0.5, 8);
  foot(-2.15, -8, 0.5, 8);

  return { batches, obstacles };
}
