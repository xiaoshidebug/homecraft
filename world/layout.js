// 1 block = 1 m. x east, z south, y up. Ground is y = 0.
// 一进四合院：正房坐北朝南，东西厢房，大门开在南墙东南侧，影壁迎门，北墙月亮门通后花园。
export const ISLAND = { x0: -36, x1: 38, z0: -26, z1: 31 };
export const SPAWN = { x: 0.5, z: 18, heading: Math.PI };

// 正房台基与两厢檐廊（可行走，floorAt 返回其高度）
export const PLATFORM = { x0: -15.6, x1: 3.6, z0: -13.6, z1: -6.4, y: 0.4 };
export const VERANDA_E = { x0: 10.2, x1: 12, z0: -6, z1: 3, y: 0.12 };
export const VERANDA_W = { x0: -15, x1: -13.2, z0: -6, z1: 3, y: 0.12 };

// 院落各部分，均为半开区间 [x0, x1)
export const COMPOUND = {
  wall: { x0: -22, x1: 18, z0: -14, z1: 12 },        // 围墙外沿，墙厚 1 m，高 3 m
  gate: { x0: 8, x1: 12 },                           // 大门开在南墙，净宽 4 m
  hall: { x0: -15, x1: 3, z0: -13, z1: -7 },         // 正房，五开间
  eastWing: { x0: 12, x1: 17, z0: -6, z1: 3 },       // 东厢房
  westWing: { x0: -20, x1: -15, z0: -6, z1: 3 },     // 西厢房
  southBlock: { x0: -21, x1: 5, z0: 7.5, z1: 11 },   // 倒座房（实体）
  court: { x0: -21, x1: 17, z0: -13, z1: 11 },       // 院内铺装范围
  garden: { x0: -21, x1: 17, z0: -21, z1: -14 },     // 后花园（北墙外）
  moonGate: { x: 10.5, y: 1.3, r: 1.45 },            // 北墙月亮门，圆心与半径
};

// 可进入的正房内区：人物进屋时引擎隐藏 wallN/S/E/W 与 roof 组
export const HOUSE = { x0: -14.7, x1: 2.7, z0: -12.7, z1: -7.3, height: 5.7 };

export const STATIONS = [
  { id: 'mailbox', name: '留言', en: 'Mailbox', icon: 'mail', at: [0.5, 23.9], look: [0.5, 25.5] },
  { id: 'portal', name: '传送门', en: 'Portal', icon: 'portal', at: [8, 23.1], look: [8, 25.5] },
  { id: 'about', name: '静远堂', en: 'Main Hall', icon: 'seal', at: [-6, -8.8], look: [-6, -12.2], floor: PLATFORM.y },
  { id: 'blog', name: '书房', en: 'Study', icon: 'scroll', at: [11, -0.6], look: [11, -3.2] },
  { id: 'contact', name: '茶座', en: 'Tea House', icon: 'coffee', at: [-14.1, -0.6], look: [-14.1, -3.2] },
  { id: 'garden', name: '后花园', en: 'Garden', icon: 'mountain', at: [10.5, -15.4], look: [10.5, -18.4], page: false },
];

export const MAILBOX = { x: 0.5, z: 25.5, yaw: Math.PI };
export const PORTAL = { x: 8, z: 25.5, yaw: Math.PI };

// 猫在院里与后花园巡游，狗在前广场迎客（宠物只走地面层，引擎自动寻路）
const inCourtyard = (x, z) => x > -21 && x < 17 && z > -21 && z < 11;
export const PETS = {
  cat: { anchors: [[6, 5], [2, -4.5], [-6, 5], [12, 7], [10.5, -16.5]], home: [2, -4.5], within: inCourtyard },
  dog: { anchors: [[2, 17], [-2, 14], [6, 16.5], [-4, 12.5], [0.5, 21]] },
};

// 庭院两棵 + 岛周树木 + 后花园
export const FOREST = [
  [-11, 5.5], [8, -2],
  [-28, -6], [-27, 8], [-25, 19], [-18, -22], [-4, -23], [10, -23], [22, -4], [26, 6], [23, 16], [30, -14],
  [4, -18], [15, -17],
];

const inRect = (r, x, z) => x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1;

export function floorAt(x, z) {
  if (inRect(PLATFORM, x, z)) return PLATFORM.y;
  if (inRect(VERANDA_E, x, z) || inRect(VERANDA_W, x, z)) return 0.12;
  return 0;
}
