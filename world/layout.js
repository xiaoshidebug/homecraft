// 1 block = 1 m. x east, z south, y up. Ground is y = 0.
// 两层乡村小宅：石基灰泥墙、黑框窗、深色金属坡屋顶、南向阳台、前院围栏。
// 一层客厅/餐厨/卧室，二层主卧/书房/茶室，沿东墙直跑楼梯上楼。
export const ISLAND = { x0: -36, x1: 38, z0: -26, z1: 31 };
export const SPAWN = { x: 0.5, z: 18, heading: Math.PI };

// 二层楼板高度（含南向阳台）与沿东墙的直跑楼梯（3.9 m 跑 3.3 m 升）
export const LOFT = { x0: -15.7, x1: -2.3, z0: -11.7, z1: -2.5, y: 3.3 };
export const STAIRS = { x0: -3.5, x1: -2.3, z0: -11.5, z1: -7.6 };

// 可进入的房屋内区（一、二层）：人物进屋时引擎隐藏外墙与屋顶
export const HOUSE = { x0: -15.7, x1: -2.3, z0: -11.7, z1: -4.3, height: 8 };

export const STATIONS = [
  { id: 'mailbox', name: '留言', en: 'Mailbox', icon: 'mail', at: [0.5, 23.9], look: [0.5, 25.5] },
  { id: 'portal', name: '传送门', en: 'Portal', icon: 'portal', at: [8, 23.1], look: [8, 25.5] },
  { id: 'about', name: '客厅', en: 'Living Room', icon: 'heart', at: [-7.6, -8], look: [-3.4, -8] },
  { id: 'blog', name: '书房', en: 'Study', icon: 'scroll', at: [-5.2, -6.6], look: [-7.4, -7.8], floor: LOFT.y },
  { id: 'contact', name: '茶室', en: 'Tea Room', icon: 'coffee', at: [-6.2, -10.8], look: [-7.2, -10.3], floor: LOFT.y },
];

export const MAILBOX = { x: 0.5, z: 25.5, yaw: Math.PI };
export const PORTAL = { x: 8, z: 25.5, yaw: Math.PI };

// 单项传送门：地面光圈，走进即前往 target（类似超链接，一个光圈只指向一个世界）。
// target 建议同时抄进 homecraft.json 的 doors 字段，别的世界才能在地图上连出关系线。
export const DOORS = [
  { x: 14.5, z: 21, target: 'https://terryhu.cn/', name: "Terry's Home" },
  { x: 4.5, z: 21, target: 'https://xinglong.tech/', name: '石兴龙的小岛' },
  { x: -6, z: 21, target: 'https://rsliyu.com/', name: 'rsliyu' },
];

// 猫在宅院与前后院巡游（可进一层室内），狗在前广场迎客；宠物只走地面层
const inHomeGrounds = (x, z) => x > -20 && x < 16 && z > -20 && z < 17;
export const PETS = {
  cat: { anchors: [[-8, -7], [1.5, 10], [-6, 2], [-10, 3.8], [-9, -15.5]], home: [1.5, 10], within: inHomeGrounds },
  dog: { anchors: [[2, 17], [-2, 14], [6, 16.5], [-4, 12.5], [0.5, 21]] },
};

// 前院树 + 岛周树木 + 后院
export const FOREST = [
  [-11, 5.5], [8, -2],
  [-28, -6], [-27, 8], [-25, 19], [-18, -22], [-4, -23], [10, -23], [22, -4], [26, 6], [23, 16], [30, -14],
  [4, -18], [15, -17],
];

const inRect = (r, x, z) => x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1;

// 楼梯段线性插值上 3.3 m 楼板；其余二层区（含阳台）直接返回楼板高度
export function floorAt(x, z) {
  if (inRect(STAIRS, x, z)) {
    const t = Math.min(1, Math.max(0, (STAIRS.z1 - z) / (STAIRS.z1 - STAIRS.z0)));
    return t * LOFT.y;
  }
  if (inRect(LOFT, x, z)) return LOFT.y;
  return 0;
}
