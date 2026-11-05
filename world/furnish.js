// 四合院陈设：堂屋家具与宫灯、檐廊书房茶座、红灯笼、匾额中堂对联、水缸假山竹丛、烘焙灯光。
// 中文匾额用 canvasTexture + fillText（pixelText 仅支持 ASCII）。
import * as THREE from 'three';
import { BoxBatch } from '@engine/world/blocks.js';
import { canvasTexture } from '@engine/world/textures.js';
import { PLATFORM } from './layout.js';

const WOOD_DARK = { tex: 'walnut' };
const DARK = { tex: 'paint', tint: 0x33363b };
const RED_GLOW = { tex: 'paint', tint: 0xd23c3c, emissive: 0.9 };
const GOLD = { tex: 'paint', tint: 0xc9a227 };
const RED_ACCENT = { tex: 'paint', tint: 0xc24b3f };
const STONE_GREY = tint => ({ tex: 'stone', tint });
const MOSS = { tex: 'foliage', tint: 0x6f8f5e };
const LEAF = tint => ({ tex: 'foliage', tint });

const KAITI = '"Kaiti SC", "STKaiti", "KaiTi", "SimKai", "STSong", serif';

const paintPlaque = (text, w = 96, h = 32) => canvasTexture(w, h, ctx => {
  ctx.fillStyle = '#26201b'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#8a6d2f'; ctx.lineWidth = 3; ctx.strokeRect(2.5, 2.5, w - 5, h - 5);
  ctx.fillStyle = '#e3b95c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(h * 0.55)}px ${KAITI}`;
  ctx.fillText(text, w / 2, h / 2 + 1);
}, { pixelated: false });

const paintCouplet = text => canvasTexture(22, 132, (ctx, w, h) => {
  ctx.fillStyle = '#efe6d3'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#3a3430'; ctx.lineWidth = 2; ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
  ctx.fillStyle = '#26221e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const step = (h - 18) / text.length;
  ctx.font = `${Math.round(step * 0.82)}px ${KAITI}`;
  [...text].forEach((ch, i) => ctx.fillText(ch, w / 2, 10 + (i + 0.5) * step));
}, { pixelated: false });

const paintScroll = () => canvasTexture(64, 128, (ctx, w, h) => {
  ctx.fillStyle = '#efe8d8'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#3a332c'; ctx.fillRect(0, 0, w, 5); ctx.fillRect(0, h - 5, w, 5);
  // 淡墨远山三层
  const ridge = (base, hgt, color, alpha) => {
    ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(5, base);
    ctx.lineTo(5 + w * 0.22, base - hgt);
    ctx.lineTo(5 + w * 0.45, base - hgt * 0.45);
    ctx.lineTo(5 + w * 0.66, base - hgt * 0.9);
    ctx.lineTo(w - 5, base);
    ctx.closePath(); ctx.fill();
  };
  ridge(94, 56, '#b8b2a4', 0.55);
  ridge(98, 76, '#8f8a7e', 0.6);
  ridge(104, 42, '#6b665c', 0.65);
  ctx.globalAlpha = 0.5; ctx.fillStyle = '#c2bcae';
  ctx.beginPath(); ctx.arc(w * 0.74, 30, 9, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#a83a2c'; ctx.fillRect(w - 16, h - 24, 9, 9);   // 印章
}, { pixelated: false });

export const TUFTS = [
  { x: -19.5, z: 9.6, tile: 'tall_grass', s: 1.1 }, { x: -16, z: 10, tile: 'flower_white' },
  { x: -13, z: 10.3, tile: 'tall_grass' }, { x: 0, z: 9.8, tile: 'flower_violet' },
  { x: 3.5, z: 10.2, tile: 'tall_grass' }, { x: -19.5, z: -2, tile: 'tall_grass' },
  { x: -18.8, z: 1.5, tile: 'flower_white' }, { x: 16.2, z: 6.8, tile: 'flower_violet' },
  { x: 15.8, z: 1, tile: 'tall_grass' }, { x: 9.9, z: -5.9, tile: 'flower_white' },
  { x: 11.6, z: -5.9, tile: 'tall_grass' }, { x: -12, z: -6.1, tile: 'tall_grass' },
  { x: 1, z: -6.1, tile: 'flower_red' },
  { x: 3.5, z: -16, tile: 'flower_white' }, { x: 8.2, z: -20.3, tile: 'tall_grass' },
  { x: 12.2, z: -20, tile: 'flower_violet' }, { x: 13.5, z: -16.2, tile: 'tall_grass' },
  { x: 9.4, z: -20.4, tile: 'flower_red' }, { x: 0.5, z: -15.5, tile: 'tall_grass' },
  { x: 16, z: -15.2, tile: 'tall_grass' },
  { x: -4, z: 21, tile: 'tall_grass' }, { x: 5, z: 20, tile: 'flower_white' },
  { x: -8, z: 16.5, tile: 'tall_grass' }, { x: 16, z: 19, tile: 'flower_violet' },
];

export function furnish({ B, layer }) {
  const obstacles = [], bakes = [], hotspots = [], planes = [];
  const bake = (id, x, y, z, power, radius, direction = null) => bakes.push({ id, position: [x, y, z], power, radius, direction });
  const foot = (x, z, w, d, level = 0) => obstacles.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, level });
  const hot = (id, x, y, z, w, h, d) => hotspots.push({ id, box: new THREE.Box3(new THREE.Vector3(x - w / 2, y, z - d / 2), new THREE.Vector3(x + w / 2, y + h, z + d / 2)) });
  const plane = (w, h, tex, x, y, z, ry = 0) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex }));
    mesh.position.set(x, y, z); mesh.rotation.set(0, ry, 0, 'YXZ');
    mesh.receiveShadow = true; planes.push(mesh); return mesh;
  };

  // 红灯笼：吊线 + 金盖 + 三段红纱灯身 + 金托流苏，emissive 自发光
  const lantern = (x, topY, z, s = 1) => {
    const drop = 0.26 * s;
    B.box(x, topY - drop, z, 0.035, drop, 0.035, DARK, { shadow: false });
    const y = topY - drop;
    B.box(x, y - 0.07 * s, z, 0.2 * s, 0.07 * s, 0.2 * s, GOLD, { shadow: false });
    const b = y - 0.07 * s - 0.66 * s;
    B.box(x, b + 0.1 * s, z, 0.44 * s, 0.22 * s, 0.44 * s, RED_GLOW, { shadow: false });
    B.box(x, b + 0.34 * s, z, 0.52 * s, 0.24 * s, 0.52 * s, RED_GLOW, { shadow: false });
    B.box(x, b + 0.56 * s, z, 0.42 * s, 0.2 * s, 0.42 * s, RED_GLOW, { shadow: false });
    B.box(x, b - 0.08 * s, z, 0.18 * s, 0.08 * s, 0.18 * s, GOLD, { shadow: false });
    B.box(x, b - 0.3 * s, z, 0.05, 0.22 * s, 0.05, GOLD, { shadow: false });
    return b + 0.34 * s;
  };

  /* ---------- 堂屋（台基面上，y 从 0.4 起） ---------- */
  const hy = PLATFORM.y;
  // 条案靠北墙，瓶花居上
  B.box(-6, hy + 0.66, -12.3, 2.7, 0.09, 0.55, WOOD_DARK);
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    B.box(-6 + sx * 1.26, hy, -12.3 + sz * 0.2, 0.12, 0.66, 0.14, WOOD_DARK);
  B.box(-6.85, hy + 0.75, -12.3, 0.18, 0.42, 0.18, DARK);
  B.box(-6.85, hy + 1.14, -12.3, 0.16, 0.12, 0.16, RED_ACCENT, { shadow: false });
  foot(-6, -12.3, 2.9, 0.8);
  // 八仙桌居中
  B.box(-6, hy + 0.74, -10.2, 1.04, 0.09, 1.04, WOOD_DARK);
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    B.box(-6 + sx * 0.44, hy, -10.2 + sz * 0.44, 0.14, 0.74, 0.14, WOOD_DARK);
  foot(-6, -10.2, 1.2, 1.2);
  // 太师椅一对，东西相对
  const armchair = (x, z, ry) => {
    B.at(x, hy, z, ry, () => {
      for (const sx of [-1, 1]) for (const sz of [-1, 1])
        B.box(sx * 0.2, 0, sz * 0.17, 0.09, 0.45, 0.09, WOOD_DARK);
      B.box(0, 0.45, 0, 0.54, 0.08, 0.5, WOOD_DARK);
      B.box(0, 0.53, -0.24, 0.54, 0.62, 0.07, WOOD_DARK);
      for (const sx of [-1, 1]) B.box(sx * 0.26, 0.53, 0.02, 0.07, 0.3, 0.44, WOOD_DARK);
    });
    foot(x, z, 0.72, 0.72);
  };
  armchair(-7.5, -10.2, Math.PI / 2);
  armchair(-4.5, -10.2, -Math.PI / 2);
  // 博古架贴东墙，花几在西墙
  B.box(2.35, hy, -10.2, 0.5, 2.1, 1.8, { tex: 'bookshelf' });
  foot(2.35, -10.2, 0.7, 2.0);
  B.box(-14.3, hy, -9.2, 0.42, 0.85, 0.42, WOOD_DARK, { ry: Math.PI / 4 });
  B.box(-14.3, hy + 0.85, -9.2, 0.07, 0.5, 0.07, DARK);
  B.box(-14.3, hy + 1.5, -9.2, 0.55, 0.14, 0.55, LEAF(0x7fa066), { shadow: false });
  B.box(-14.45, hy + 1.72, -9.1, 0.4, 0.12, 0.4, LEAF(0x8fae7a), { shadow: false });
  foot(-14.3, -9.2, 0.6, 0.6);
  // 宫灯吊中堂前
  // 宫灯吊于八仙桌上方（避让中堂挂轴）
  lantern(-6, 4.18, -9.6, 1.3);
  bake('hall-pendant', -6, 3.5, -9.6, 4.2, 8);
  bake('hall-scroll', -6, 2.6, -11.9, 1.5, 4, [0, -0.4, -1]);

  /* ---------- 东檐廊书房 ---------- */
  B.box(11.35, 0.88, -3, 1.3, 0.08, 0.62, WOOD_DARK);
  for (const sx of [-1, 1]) B.box(11.35 + sx * 0.55, 0.12, -3, 0.1, 0.76, 0.55, WOOD_DARK);
  foot(11.35, -3, 1.5, 0.85);
  B.box(11.2, 0.96, -3, 0.22, 0.04, 0.16, DARK, { shadow: false });       // 砚
  B.box(11.6, 0.96, -3.1, 0.09, 0.2, 0.09, DARK, { shadow: false });      // 笔筒
  B.box(11.5, 0.96, -2.8, 0.3, 0.05, 0.12, { tex: 'paint', tint: 0x83301f }, { shadow: false }); // 书卷
  B.box(10.5, 0.12, -3, 0.42, 0.44, 0.42, WOOD_DARK);                      // 凳
  foot(10.5, -3, 0.5, 0.5);
  B.box(11.7, 0.12, -5.1, 0.44, 1.85, 1.5, { tex: 'bookshelf' });          // 书架
  foot(11.7, -5.1, 0.6, 1.7);
  lantern(10.45, 2.95, 2.6, 0.8);
  bake('veranda-e', 10.45, 2.2, 2.6, 1.6, 4.5);

  /* ---------- 西檐廊茶座 ---------- */
  B.box(-14.1, 0.6, -3, 0.95, 0.06, 0.95, WOOD_DARK);
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    B.box(-14.1 + sx * 0.38, 0.12, -3 + sz * 0.38, 0.09, 0.48, 0.09, WOOD_DARK);
  foot(-14.1, -3, 1.1, 1.1);
  B.box(-14.1, 0.66, -3.05, 0.16, 0.12, 0.13, DARK, { shadow: false });    // 壶
  B.box(-14.25, 0.66, -2.78, 0.07, 0.05, 0.07, { tex: 'paint', tint: 0xd8d3c8 }, { shadow: false });
  B.box(-13.92, 0.66, -2.9, 0.07, 0.05, 0.07, { tex: 'paint', tint: 0xd8d3c8 }, { shadow: false });
  for (const sz of [-4.2, -1.8]) {                                         // 圆凳一对
    B.box(-14.1, 0.12, sz, 0.4, 0.46, 0.4, WOOD_DARK);
    foot(-14.1, sz, 0.5, 0.5);
  }
  lantern(-13.45, 2.95, 2.6, 0.8);
  bake('veranda-w', -13.45, 2.2, 2.6, 1.6, 4.5);

  /* ---------- 大门灯笼（前广场可见） ---------- */
  lantern(7.3, 3.5, 12.4, 0.9);
  lantern(12.7, 3.5, 12.4, 0.9);
  bake('gate-lantern-l', 7.3, 2.7, 12.4, 1.8, 5.5);
  bake('gate-lantern-r', 12.7, 2.7, 12.4, 1.8, 5.5);

  /* ---------- 太平水缸 + 金鱼 ---------- */
  B.box(15, 0, 6.3, 1.35, 0.35, 1.35, DARK);
  B.box(15, 0.35, 6.3, 1.25, 0.3, 1.25, DARK);
  B.box(15, 0.65, 6.3, 1.15, 0.28, 1.15, DARK);
  B.box(15, 0.87, 6.3, 1.0, 0.06, 1.0, { tex: 'water', glass: true }, { shadow: false });
  B.box(14.85, 0.9, 6.2, 0.14, 0.05, 0.07, { tex: 'paint', tint: 0xd9762b }, { shadow: false });
  B.box(15.2, 0.9, 6.45, 0.14, 0.05, 0.07, { tex: 'paint', tint: 0xd9762b }, { shadow: false, ry: 0.7 });
  foot(15, 6.3, 1.5, 1.5);

  /* ---------- 假山（院内西侧 + 后花园） ---------- */
  const rockery = (x, z, k = 1) => {
    B.box(x, 0, z, 1.1 * k, 0.75 * k, 0.9 * k, STONE_GREY(0x8d9298), { ry: 0.3 });
    B.box(x + 0.1, 0.75 * k, z + 0.1, 0.75 * k, 0.95 * k, 0.65 * k, STONE_GREY(0x767b81), { ry: -0.25 });
    B.box(x - 0.2, 1.7 * k, z - 0.1, 0.45 * k, 0.5 * k, 0.45 * k, STONE_GREY(0xa0a5aa), { ry: 0.5 });
    B.box(x + 0.25, 0.5 * k, z + 0.35, 0.3 * k, 0.12 * k, 0.3 * k, MOSS, { shadow: false });
    foot(x, z, 1.5 * k, 1.3 * k);
  };
  rockery(-18, 6);
  rockery(15.5, -19.5, 0.8);

  /* ---------- 后花园竹丛 + 石灯 ---------- */
  const bamboo = (x, z) => {
    const stalks = [[-0.3, -0.2, 2.6], [0.15, 0.1, 3.4], [-0.05, 0.28, 3.0], [0.3, -0.15, 2.8], [-0.22, 0.15, 3.7], [0.05, -0.3, 3.2]];
    for (const [dx, dz, h] of stalks) {
      B.box(x + dx, 0, z + dz, 0.13, h, 0.13, { tex: 'paint', tint: 0x7a9a68 });
      B.box(x + dx, h - 0.35, z + dz, 0.55, 0.16, 0.55, LEAF(0x8fae7a), { shadow: false });
      B.box(x + dx + 0.2, h - 0.7, z + dz - 0.15, 0.4, 0.13, 0.4, LEAF(0x7fa066), { shadow: false });
    }
    foot(x, z, 1.0, 1.0);
  };
  bamboo(2, -17);
  bamboo(6.5, -20);
  bamboo(14, -18.5);
  B.box(12.3, 0, -17.5, 0.26, 1.1, 0.26, { tex: 'stone', tint: 0x6e737a }); // 石灯柱
  B.box(12.3, 1.1, -17.5, 0.34, 0.3, 0.34, RED_GLOW, { shadow: false });
  B.box(12.3, 1.4, -17.5, 0.42, 0.08, 0.42, { tex: 'stone', tint: 0x6e737a });
  foot(12.3, -17.5, 0.4, 0.4);
  bake('garden-lamp', 12.3, 1.5, -17.5, 1.5, 4);

  /* ---------- 匾额、中堂、对联 ---------- */
  B.box(10, 3.02, 12.08, 2.7, 0.72, 0.1, DARK, { shadow: false });                 // 大门匾
  plane(2.5, 0.62, paintPlaque('四合院', 128, 32), 10, 3.38, 12.14);
  B.box(-6, 3.12, -6.96, 1.9, 0.62, 0.1, DARK, { shadow: false });                 // 正房匾
  plane(1.75, 0.52, paintPlaque('静远堂', 96, 30), -6, 3.43, -6.9);
  plane(1.15, 2.3, paintScroll(), -6, 2.15, -12.62);                               // 中堂
  plane(0.34, 2.0, paintCouplet('静以修身'), -7.35, 2.15, -12.62);                 // 对联
  plane(0.34, 2.0, paintCouplet('俭以养德'), -4.65, 2.15, -12.62);

  /* ---------- 锦鲤（水体下游动，单个 InstancedMesh） ---------- */
  const koiMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.3, 0.08, 0.12),
    new THREE.MeshLambertMaterial(),
    4,
  );
  koiMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const KOI = [
    { x: -11.6, z: 1.2, r: 0.5, speed: 0.5, phase: 0, tint: 0xd9762b },
    { x: -10.9, z: 1.9, r: 0.35, speed: 0.65, phase: 2.1, tint: 0xe8e3d5 },
    { x: -11.2, z: 1.6, r: 0.65, speed: 0.42, phase: 4.0, tint: 0xc24b28 },
    { x: -10.6, z: 1.1, r: 0.4, speed: 0.55, phase: 1.2, tint: 0xd9762b },
  ];
  const koiColor = new THREE.Color();
  for (let i = 0; i < KOI.length; i++) koiMesh.setColorAt(i, koiColor.setHex(KOI[i].tint));
  const koiMatrix = new THREE.Matrix4(), koiQuat = new THREE.Quaternion();
  const koiEuler = new THREE.Euler(), koiVec = new THREE.Vector3(), koiScale = new THREE.Vector3(0.85, 0.85, 0.85);
  const updateKoi = (dt, elapsed) => {
    for (let i = 0; i < KOI.length; i++) {
      const k = KOI[i], a = k.phase + elapsed * k.speed;
      koiVec.set(k.x + Math.cos(a) * k.r, 0.26, k.z + Math.sin(a) * k.r);
      koiEuler.set(0, -a - Math.PI / 2, 0);
      koiQuat.setFromEuler(koiEuler);
      koiMatrix.compose(koiVec, koiQuat, koiScale);
      koiMesh.setMatrixAt(i, koiMatrix);
    }
    koiMesh.instanceMatrix.needsUpdate = true;
  };
  updateKoi(0, 0);
  planes.push(koiMesh);

  /* ---------- 热点 ---------- */
  hot('about', -6, hy, -10.8, 7, 2.6, 4.6);
  hot('blog', 11, 0, -3.4, 2.6, 2.2, 3.2);
  hot('contact', -14.1, 0, -3.4, 2.6, 2.2, 3.2);
  hot('garden', 10.5, 0, -17.6, 3.2, 2, 3);

  return { planes, obstacles, bakes, hotspots, updateKoi };
}
