// 两层乡村小宅：地形铺装 → 建筑 → 陈设 → 树木草花，按引擎约定返回批渲染与交互数据。
import { buildIsland } from '@engine/world/terrain.js';
import { buildForest, buildTufts } from '@engine/world/landscape.js';
import { ISLAND, FOREST } from './layout.js';
import { defineBlocks, surfaceAt, buildArchitecture } from './house.js';
import { furnish, TUFTS } from './furnish.js';

let updateKoi = null;

export function build({ grid, layer, materials }) {
  defineBlocks(grid);
  buildIsland(grid, ISLAND, { surfaceAt, corner: 10, wobble: 0 });

  const arch = buildArchitecture({ grid, layer });
  const f = furnish({ B: arch.batches.static, layer });
  updateKoi = f.updateKoi;
  const tufts = buildTufts(layer, materials, TUFTS, 'garden-tufts');

  return {
    batches: arch.batches,
    planes: [...f.planes, tufts],
    obstacles: [...arch.obstacles, ...f.obstacles],
    bakes: f.bakes,
    hotspots: f.hotspots,
    surfaces: f.surfaces,
    forest: buildForest(grid, layer, FOREST),
  };
}

// 锦鲤游动等每帧动画（引擎只 tick setup 返回的 update）
export function setup() {
  return { update(dt, elapsed) { updateKoi?.(dt, elapsed); } };
}
