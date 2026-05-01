import { GameEngine } from './GameEngine.jsx';
import { ShadowGameEngine } from './ShadowGameEngine.jsx';
// import { TeleportGameEngine } from './TeleportGameEngine.js';
// import { TimeRewindGameEngine } from './TimeRewindGameEngine.js';

/**
 * Engine Factory - Tự động chọn và khởi tạo engine phù hợp
 */
export class EngineFactory {
  static engineRegistry = {
    'default': GameEngine,
    'shadow': ShadowGameEngine,
    // 'teleport': TeleportGameEngine,
    // 'time-rewind': TimeRewindGameEngine,
  };

  static createEngine(gridData) {
    const features    = this.detectFeatures(gridData);
    const engineType  = this.selectEngine(features);
    const initialState = this.buildInitialState(gridData);
    const EngineClass  = this.engineRegistry[engineType];

    if (!EngineClass) {
      console.warn(`Engine type "${engineType}" not found, using default`);
      return new GameEngine(initialState);
    }

    console.log(`🎮 Using engine: ${engineType}`, features);
    return new EngineClass(initialState);
  }

  /**
   * Helper: đọc field từ gridData, nếu không có thì fallback sang gridData.engine.
   * Form lưu các engine param vào gridData.engine{} thay vì root gridData,
   * nên cần check cả 2 nơi.
   */
  static _get(gridData, field) {
    const fromRoot   = gridData[field];
    const fromEngine = gridData.engine?.[field];
    // Ưu tiên root; nếu không có (undefined/null) thì lấy từ engine block
    return fromRoot !== undefined && fromRoot !== null ? fromRoot : fromEngine;
  }

  static detectFeatures(gridData) {
    const g = (f) => this._get(gridData, f);
    const features = [];

    // Shadow: switches / pressurePlates / triggers
    if (g('switches')?.length)       features.push('switches');
    if (g('pressurePlates')?.length) features.push('pressurePlates');
    if (g('triggers')?.length)       features.push('triggers');

    // Shadow: bất kỳ shadow config nào — check cả root lẫn engine block
    const shadowFields = [
      'shadowDelay', 'shadowStartDelay',
      'shadowMoveDuration', 'shadowMaxMoves',
      'shadowStartPosition',
    ];
    if (shadowFields.some(f => g(f) !== undefined && g(f) !== null && g(f) !== '')) {
      features.push('shadow');
    }

    // Teleport
    if (g('teleportPairs')?.length) features.push('teleport');

    // Time rewind
    if (g('timeRewind')) features.push('timeRewind');

    // Moving obstacles
    if (g('movingObstacles')?.length) features.push('movingObstacles');

    // Gravity
    if (g('gravity')) features.push('gravity');

    return features;
  }

  static selectEngine(features) {
    if (
      features.includes('switches') ||
      features.includes('pressurePlates') ||
      features.includes('triggers') ||
      features.includes('shadow')
    ) return 'shadow';

    if (features.includes('teleport'))   return 'teleport';
    if (features.includes('timeRewind')) return 'time-rewind';

    return 'default';
  }

  static buildInitialState(gridData) {
    const g = (f) => this._get(gridData, f);

    // Parse shadowStartPosition: chấp nhận object {x,y}, string "x,y", hoặc null
    const rawShadowPos = g('shadowStartPosition');
    let shadowStartPosition = null;
    if (rawShadowPos) {
      if (typeof rawShadowPos === 'object' && 'x' in rawShadowPos) {
        shadowStartPosition = rawShadowPos;
      } else if (typeof rawShadowPos === 'string' && rawShadowPos.includes(',')) {
        const [x, y] = rawShadowPos.split(',').map(Number);
        shadowStartPosition = { x, y };
      }
    }

    return {
      // ===== CORE =====
      player:         { ...gridData.player },
      target:         gridData.target,
      obstacles:      gridData.obstacles || [],
      collectibles:   g('collectibles') || [],
      collectedItems: [],
      rows:           gridData.rows,
      cols:           gridData.cols,
      moves:          0,

      // ===== SHADOW =====
      shadowStartDelay: (() => {
        const v = g('shadowStartDelay') ?? g('shadowDelay');
        return v !== undefined && v !== null && v !== '' ? Number(v) : 0;
      })(),
      shadowMoveDuration: (() => {
        const v = g('shadowMoveDuration') ?? g('shadowMaxMoves');
        return v !== undefined && v !== null && v !== '' ? Number(v) : null;
      })(),
      shadowStartPosition,

      switches:       g('switches')       || [],
      activatedSwitches: [],
      pressurePlates: g('pressurePlates') || [],
      triggers:       g('triggers')       || [],
      removableWalls: g('removableWalls') || [],
      hiddenWalls:    [],

      // ===== OTHER =====
      teleportPairs:     g('teleportPairs')     || [],
      teleportUsageCount: 0,
      timeRewind:        g('timeRewind')        || null,
      movingObstacles:   g('movingObstacles')   || [],
      gravity:           g('gravity')           || null,
    };
  }

  static registerEngine(name, EngineClass) {
    if (this.engineRegistry[name]) {
      console.warn(`Engine "${name}" already exists, overwriting...`);
    }
    this.engineRegistry[name] = EngineClass;
    console.log(`✅ Registered engine: ${name}`);
  }

  static getAvailableEngines() {
    return Object.keys(this.engineRegistry);
  }

  static hasEngine(name) {
    return !!this.engineRegistry[name];
  }
}

export default EngineFactory;