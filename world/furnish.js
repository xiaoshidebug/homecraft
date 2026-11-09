// 小宅陈设：一层客厅/餐厨/卧室，二层主卧/书房/茶室，阳台休闲区，
// 壁灯与室内烘焙灯，锦鲤池游鱼，花境草丛。
import * as THREE from 'three';
import { BoxBatch } from '@engine/world/blocks.js';
import { LOFT } from './layout.js';

const WOOD_DARK = { tex: 'walnut' };
const WOOD = { tex: 'oak', tint: 0xc9a87c };
const DARK = { tex: 'paint', tint: 0x33363b };
const VELVET = tint => ({ tex: 'velvet', tint });
const LINEN = { tex: 'linen' };
const STEEL = { tex: 'stainless' };
const GLOW_WARM = { tex: 'paint', tint: 0xffd9a0, emissive: 0.9 };
const LEAF = tint => ({ tex: 'foliage', tint });

export const TUFTS = [
  // 沿围栏花境（前院内侧）
  { x: -16.5, z: 5.7, tile: 'flower_violet' }, { x: -15.2, z: 5.6, tile: 'flower_red' },
  { x: -8.3, z: 5.7, tile: 'flower_white' }, { x: -6.9, z: 5.6, tile: 'tall_grass' },
  { x: -5.4, z: 5.7, tile: 'flower_red' }, { x: -3.9, z: 5.6, tile: 'flower_violet' },
  { x: -2.4, z: 5.7, tile: 'tall_grass' }, { x: -0.9, z: 5.6, tile: 'flower_white' },
  { x: 0.6, z: 5.7, tile: 'flower_red' }, { x: 2.1, z: 5.6, tile: 'tall_grass' },
  { x: 3.3, z: 5.7, tile: 'flower_violet' },
  // 草坪散植
  { x: -4, z: 1.5, tile: 'tall_grass' }, { x: 6, z: 2.5, tile: 'flower_white' },
  { x: 2, z: -1.5, tile: 'tall_grass' }, { x: 10, z: 0.5, tile: 'flower_violet' },
  { x: -7, z: 12, tile: 'flower_red' }, { x: 5, z: 11, tile: 'tall_grass' },
  // 后院与东草坪
  { x: -8, z: -16, tile: 'tall_grass' }, { x: -2, z: -17.5, tile: 'flower_white' },
  { x: 8, z: -19, tile: 'tall_grass' }, { x: 12, z: -15.5, tile: 'flower_violet' },
  { x: 16, z: 8, tile: 'tall_grass' }, { x: 20, z: 3, tile: 'flower_white' },
  { x: 13, z: 13, tile: 'flower_red' },
];

export function furnish({ B, layer }) {
  const obstacles = [], bakes = [], hotspots = [], planes = [], surfaces = {};
  const bake = (id, x, y, z, power, radius, direction = null) => bakes.push({ id, position: [x, y, z], power, radius, direction });
  const foot = (x, z, w, d, level = 0) => obstacles.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, level });
  const hot = (id, x, y, z, w, h, d) => hotspots.push({ id, box: new THREE.Box3(new THREE.Vector3(x - w / 2, y, z - d / 2), new THREE.Vector3(x + w / 2, y + h, z + d / 2)) });
  const plane = (w, h, tex, x, y, z, ry = 0, glow = false) => {
    const mat = glow ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshLambertMaterial({ map: tex });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z); mesh.rotation.set(0, ry, 0, 'YXZ');
    mesh.receiveShadow = !glow; planes.push(mesh); return mesh;
  };
  // 壁灯：黑壳 + 琥珀发光芯（挂外墙）
  const wallLantern = (x, y, z, ry) => {
    B.at(x, y, z, ry, () => {
      B.box(0, 0.14, 0, 0.16, 0.3, 0.06, DARK, { shadow: false });
      B.box(0, 0.1, 0.05, 0.22, 0.06, 0.16, DARK, { shadow: false });
      B.box(0, -0.16, 0.05, 0.16, 0.22, 0.13, GLOW_WARM, { shadow: false });
      B.box(0, -0.3, 0.05, 0.22, 0.06, 0.16, DARK, { shadow: false });
    });
  };
  const bed = (x, z, y = 0, level = 0, w = 1.6, len = 2.1) => {   // 床头朝西
    B.box(x, y, z, len, 0.32, w, WOOD_DARK);
    B.box(x - 0.05, y + 0.32, z, len - 0.15, 0.24, w - 0.15, LINEN);
    B.box(x - len / 2 + 0.12, y + 0.32, z - w / 4, 0.5, 0.12, w / 2 - 0.1, { tex: 'paint', tint: 0xf2eee2 }, { shadow: false });
    B.box(x - len / 2 + 0.12, y + 0.32, z + w / 4, 0.5, 0.12, w / 2 - 0.1, { tex: 'paint', tint: 0xf2eee2 }, { shadow: false });
    B.box(x - len / 2 - 0.06, y, z, 0.12, 1.05, w, WOOD_DARK);
    foot(x, z, len + 0.3, w + 0.2, level);
  };
  const armchair = (x, z, ry, y = 0, level = 0) => {
    B.at(x, y, z, ry, () => {
      for (const sx of [-1, 1]) for (const sz of [-1, 1])
        B.box(sx * 0.2, 0, sz * 0.17, 0.09, 0.42, 0.09, WOOD_DARK);
      B.box(0, 0.44, 0, 0.56, 0.09, 0.52, VELVET(0x5a6b5e));
      B.box(0, 0.53, -0.24, 0.56, 0.6, 0.08, VELVET(0x4e5e52));
      for (const sx of [-1, 1]) B.box(sx * 0.27, 0.53, 0.02, 0.08, 0.28, 0.46, VELVET(0x5a6b5e));
    });
    foot(x, z, 0.75, 0.75, level);
  };

  /* ---------- 一层客厅 ---------- */
  B.box(-6.6, 0.01, -8, 3.2, 0.03, 2.6, { tex: 'paint', tint: 0x7a6a55 }, { shadow: false });  // 地毯
  B.box(-8.35, 0.12, -8, 0.95, 0.42, 2.3, VELVET(0x4e5e52));                    // 三人沙发（朝东）
  B.box(-8.85, 0.12, -8, 0.18, 0.65, 2.3, VELVET(0x44544a));
  for (const sz of [-1, 1]) B.box(-8.35, 0.12, -8 + sz * 1.25, 0.95, 0.55, 0.22, VELVET(0x4e5e52));
  foot(-8.4, -8, 1.3, 2.9);
  armchair(-7.4, -10.4, 0);                                                     // 单人椅（朝南）
  B.box(-6.3, 0, -8, 1.1, 0.4, 0.6, WOOD_DARK);                                 // 茶几
  B.box(-6.3, 0.4, -8, 1.2, 0.06, 0.7, WOOD);
  foot(-6.3, -8, 1.3, 0.8);
  B.box(-2.72, 0, -8, 0.45, 0.55, 2.4, WOOD_DARK);                              // 电视柜
  foot(-2.72, -8, 0.6, 2.5);
  B.box(-2.36, 0.62, -8, 0.08, 1.75, 3.1, DARK, { shadow: false });             // 电视边框
  surfaces.tvScreen = plane(3.0, 1.7, null, -2.4, 1.5, -8, -Math.PI / 2, true); // 引擎往这里画城市夜景
  B.box(-8.95, 0, -4.9, 0.06, 1.5, 0.06, DARK, { shadow: false });              // 落地灯
  B.box(-8.95, 1.5, -4.9, 0.42, 0.26, 0.42, GLOW_WARM, { shadow: false });
  foot(-8.95, -4.9, 0.4, 0.4);
  bake('floor-lamp', -8.95, 1.6, -4.9, 1.2, 3);
  B.box(-6.6, 2.62, -8, 0.04, 0.35, 0.04, DARK, { shadow: false });             // 吊灯
  B.box(-6.6, 2.3, -8, 0.5, 0.22, 0.5, GLOW_WARM, { shadow: false });
  bake('living', -6.6, 2.3, -8, 4.0, 7);

  /* ---------- 一层餐厨 ---------- */
  B.box(-12.6, 0, -9.9, 1.7, 0.08, 1.0, WOOD);                                  // 餐桌
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    B.box(-12.6 + sx * 0.72, 0, -9.9 + sz * 0.36, 0.1, 0.74, 0.1, WOOD_DARK);
  foot(-12.6, -9.9, 1.9, 1.2);
  for (const [cx, cz, r] of [[-13.5, -9.2, -Math.PI / 2], [-11.7, -9.2, Math.PI / 2], [-13.5, -10.6, -Math.PI / 2], [-11.7, -10.6, Math.PI / 2]])
    armchair(cx, cz, r);
  B.box(-12.9, 0, -11.4, 4.2, 0.9, 0.62, WOOD_DARK);                            // 厨柜
  B.box(-12.9, 0.9, -11.4, 4.3, 0.05, 0.66, { tex: 'paint', tint: 0xd8d3c8 });
  foot(-12.9, -11.4, 4.3, 0.7);
  B.box(-15.25, 0, -10.6, 0.75, 1.9, 0.72, STEEL);                              // 冰箱
  foot(-15.25, -10.6, 0.85, 0.8);
  B.box(-12.6, 2.62, -9.9, 0.04, 0.35, 0.04, DARK, { shadow: false });
  B.box(-12.6, 2.3, -9.9, 0.45, 0.2, 0.45, GLOW_WARM, { shadow: false });
  bake('dining', -12.6, 2.4, -9.9, 3.2, 6);

  /* ---------- 一层卧室 ---------- */
  bed(-13.9, -6.3);
  B.box(-15.15, 0, -7.35, 0.45, 0.55, 0.45, WOOD_DARK);                         // 床头柜
  B.box(-15.15, 0.55, -7.35, 0.26, 0.18, 0.26, GLOW_WARM, { shadow: false });
  B.box(-11.3, 0, -4.75, 1.8, 2.2, 0.6, WOOD_DARK);                             // 衣柜
  foot(-11.3, -4.75, 1.9, 0.7);
  B.box(-13.3, 0.01, -5.6, 1.8, 0.02, 1.2, { tex: 'paint', tint: 0x8a7a62 }, { shadow: false });
  bake('bedroom1', -12.6, 2.5, -6.2, 3.2, 6);

  /* ---------- 二层主卧 ---------- */
  const fy = LOFT.y;
  bed(-13.7, -7.0, fy, 1);
  B.box(-15.15, fy, -6.15, 0.45, 0.55, 0.45, WOOD_DARK);
  B.box(-15.15, fy, -7.85, 0.45, 0.55, 0.45, WOOD_DARK);
  B.box(-15.15, fy + 0.55, -6.15, 0.26, 0.18, 0.26, GLOW_WARM, { shadow: false });
  B.box(-9.7, fy, -9.8, 0.62, 2.2, 2.0, WOOD_DARK);                             // 衣柜（靠隔墙）
  foot(-9.7, -9.8, 0.7, 2.1, 1);
  B.box(-12.6, fy, -4.78, 1.4, 0.9, 0.5, WOOD_DARK);                            // 斗柜
  foot(-12.6, -4.78, 1.5, 0.6, 1);
  bake('master', -12.6, fy + 2.3, -7, 3.6, 7);

  /* ---------- 二层书房 ---------- */
  B.box(-7.7, fy, -7.85, 1.5, 0.07, 0.7, WOOD_DARK);                            // 书桌（靠北隔墙）
  for (const sx of [-1, 1]) B.box(-7.7 + sx * 0.65, fy, -7.85, 0.1, 0.72, 0.6, WOOD_DARK);
  foot(-7.7, -7.85, 1.7, 0.9, 1);
  B.box(-7.7, fy + 0.79, -8.06, 0.6, 0.42, 0.06, DARK, { shadow: false });      // 显示器
  plane(0.56, 0.36, null, -7.7, fy + 0.99, -8.0, 0, true);                      // 屏幕光
  armchair(-7.7, -7.0, Math.PI, fy, 1);                                         // 书椅（朝北）
  B.box(-2.75, fy, -6.4, 0.45, 2.0, 1.7, { tex: 'bookshelf' });                 // 书架（靠东墙）
  foot(-2.75, -6.4, 0.55, 1.8, 1);
  B.box(-2.8, fy, -4.85, 0.4, 0.85, 0.4, WOOD_DARK, { ry: Math.PI / 4 });       // 花架
  B.box(-2.8, fy + 0.9, -4.85, 0.5, 0.35, 0.5, LEAF(0x6f8f5e), { shadow: false });
  foot(-2.8, -4.85, 0.55, 0.55, 1);
  bake('study', -6, fy + 2.3, -6.3, 3.4, 6);

  /* ---------- 二层茶室 ---------- */
  B.box(-7.3, fy, -10.3, 0.95, 0.06, 0.95, WOOD_DARK);                          // 矮茶桌
  for (const sx of [-1, 1]) for (const sz of [-1, 1])
    B.box(-7.3 + sx * 0.36, fy, -10.3 + sz * 0.36, 0.08, 0.48, 0.08, WOOD_DARK);
  foot(-7.3, -10.3, 1.15, 1.15, 1);
  B.box(-8.2, fy, -10.3, 0.55, 0.16, 0.55, VELVET(0x6b5a4e), { shadow: false });// 坐垫
  B.box(-6.4, fy, -10.3, 0.55, 0.16, 0.55, VELVET(0x54606b), { shadow: false });
  B.box(-7.3, fy + 0.06, -10.3, 0.16, 0.12, 0.13, DARK, { shadow: false });     // 茶壶
  const scroll = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), new THREE.MeshLambertMaterial({ color: 0xe7dfcc }));
  scroll.position.set(-9.34, fy + 1.4, -10.3); scroll.rotation.set(0, Math.PI / 2, 0, 'YXZ');
  planes.push(scroll);                                                          // 茶室素色挂轴
  bake('tea', -6.5, fy + 2.3, -10.2, 3.2, 6);

  /* ---------- 阳台 ---------- */
  armchair(-13.7, -3.3, Math.PI, fy, 1);
  armchair(-12.3, -3.3, Math.PI, fy, 1);
  B.box(-13, fy + 0.42, -3.3, 0.5, 0.06, 0.5, WOOD_DARK);                       // 小圆桌
  B.box(-13, fy, -3.3, 0.08, 0.42, 0.08, WOOD_DARK);
  for (const px of [-14.5, -9, -4]) {                                           // 栏杆花箱
    B.box(px, fy + 0.62, -2.85, 1.1, 0.24, 0.28, DARK, { shadow: false });
    for (let i = 0; i < 4; i++)
      B.box(px - 0.38 + i * 0.26, fy + 0.86, -2.85, 0.2, 0.18, 0.2, { tex: 'paint', tint: [0xd23c3c, 0xf1ece0, 0xd23c3c, 0xe8b4c8][i] }, { shadow: false });
  }
  wallLantern(-12, 5.1, -4.05, 0);
  wallLantern(-4.1, 5.1, -4.05, 0);
  bake('balcony-l', -12, 5.1, -3.9, 1.6, 5);
  bake('balcony-r', -4.1, 5.1, -3.9, 1.6, 5);

  /* ---------- 门廊与院门壁灯 ---------- */
  wallLantern(-5.2, 2.5, -4.0, 0);
  wallLantern(-2.4, 2.5, -4.0, 0);
  bake('porch-l', -5.2, 2.5, -3.9, 1.8, 5);
  bake('porch-r', -2.4, 2.5, -3.9, 1.8, 5);
  bake('gate-l', 0.4, 2.4, 7.0, 1.8, 5);
  bake('gate-r', 3.6, 2.4, 7.0, 1.8, 5);

  /* ---------- 太平水缸（东草坪） ---------- */
  B.box(15, 0, 6.3, 1.35, 0.35, 1.35, DARK);
  B.box(15, 0.35, 6.3, 1.25, 0.3, 1.25, DARK);
  B.box(15, 0.65, 6.3, 1.15, 0.28, 1.15, DARK);
  B.box(15, 0.87, 6.3, 1.0, 0.06, 1.0, { tex: 'water', glass: true }, { shadow: false });
  B.box(14.85, 0.9, 6.2, 0.14, 0.05, 0.07, { tex: 'paint', tint: 0xd9762b }, { shadow: false });
  B.box(15.2, 0.9, 6.45, 0.14, 0.05, 0.07, { tex: 'paint', tint: 0xd9762b }, { shadow: false, ry: 0.7 });
  foot(15, 6.3, 1.5, 1.5);

  /* ---------- 锦鲤（池水面下游动，单个 InstancedMesh） ---------- */
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
  hot('about', -6.5, 0, -8, 5, 2.2, 4.5);
  hot('blog', -6.8, fy, -7.3, 3, 2, 2.6);
  hot('contact', -7, fy, -10.3, 2.8, 2, 2.4);

  return { planes, obstacles, bakes, hotspots, surfaces, updateKoi };
}
