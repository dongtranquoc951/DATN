/**
 * GridHelper - Universal helper cho grid rendering và stats extraction
 */

export const generateGridData = (gameState, engineInstance) => {
  if (!gameState) return [];
  
  const cells = [];
  let uniqueId = 0;

  // Lấy shadow position với fallback
  let shadowPos = null;
  if (engineInstance && typeof engineInstance.getShadowPosition === 'function') {
    shadowPos = engineInstance.getShadowPosition();
  }
  if (!shadowPos && gameState.shadowPosition) shadowPos = gameState.shadowPosition;
  if (!shadowPos && gameState.shadow)         shadowPos = gameState.shadow;
  // ❌ Đã xóa: console.log('🔍 Shadow Position:', shadowPos);

  for (let y = 0; y < gameState.rows; y++) {
    for (let x = 0; x < gameState.cols; x++) {
      const cell = {
        x, y,
        key: `cell-${uniqueId++}`,

        // BASIC
        isTarget:   gameState.target.x === x && gameState.target.y === y,
        isObstacle: gameState.obstacles.some(obs => obs.x === x && obs.y === y),
        isPlayer:   Math.round(gameState.player.x) === x && Math.round(gameState.player.y) === y,

        // SHADOW
        isShadow: shadowPos && shadowPos.x === x && shadowPos.y === y,

        // COLLECTIBLES
        collectible: gameState.collectibles.find(item =>
          item.x === x && item.y === y &&
          !gameState.collectedItems.some(c => c.x === x && c.y === y)
        ),
        isCollected: gameState.collectedItems.some(item => item.x === x && item.y === y),

        // SHADOW FEATURES
        isSwitch:       false,
        switchActivated: false,
        pressurePlate:  null,
        trigger:        null,
        isRemovableWall: false,

        // TELEPORT
        teleportPair:       null,
        isTeleportEntrance: false,
        isTeleportExit:     false,

        // TIME REWIND
        isTimeMarker: false,

        // MOVING OBSTACLES
        isMovingObstacle: false,
      };

      // Switches
      if (gameState.switches?.length > 0) {
        const sw = gameState.switches.find(s => s.x === x && s.y === y);
        if (sw) {
          cell.isSwitch       = true;
          cell.switchActivated = gameState.activatedSwitches?.some(s => s.x === x && s.y === y) || false;
        }
      }

      // Pressure plates
      if (gameState.pressurePlates?.length > 0) {
        const plate = gameState.pressurePlates.find(p => p.x === x && p.y === y);
        if (plate) cell.pressurePlate = plate;
      }

      // Triggers
      if (gameState.triggers?.length > 0) {
        const trigger = gameState.triggers.find(t => t.x === x && t.y === y);
        if (trigger) cell.trigger = trigger;
      }

      // Removable walls
      if (gameState.removableWalls?.length > 0) {
        if (gameState.removableWalls.some(w => w.x === x && w.y === y))
          cell.isRemovableWall = true;
      }

      // Teleport pairs
      if (gameState.teleportPairs?.length > 0) {
        const tp = gameState.teleportPairs.find(t =>
          (t.entrance?.x === x && t.entrance?.y === y) ||
          (t.exit?.x === x     && t.exit?.y === y)
        );
        if (tp) {
          cell.teleportPair = tp;
          if (tp.entrance?.x === x && tp.entrance?.y === y) cell.isTeleportEntrance = true;
          if (tp.exit?.x === x     && tp.exit?.y === y)     cell.isTeleportExit     = true;
        }
      }

      // Moving obstacles
      if (gameState.movingObstacles?.length > 0) {
        const mo = gameState.movingObstacles.find(m =>
          Math.round(m.x) === x && Math.round(m.y) === y
        );
        if (mo) { cell.isMovingObstacle = true; cell.movingObstacleData = mo; }
      }

      cells.push(cell);
    }
  }

  return cells;
};

export const extractStats = (gameState, engineInstance) => {
  if (!gameState) return {};

  const stats = {
    moves: gameState.moves || 0,
    stars: {
      collected: gameState.collectedItems?.length || 0,
      total:     gameState.collectibles?.length   || 0,
    },
  };

  // Switches
  if (gameState.switches?.length > 0) {
    stats.switches = {
      activated: gameState.activatedSwitches?.length || 0,
      total:     gameState.switches.length,
    };
  }

  // Shadow position
  let shadowPos = null;
  if (engineInstance && typeof engineInstance.getShadowPosition === 'function') {
    shadowPos = engineInstance.getShadowPosition();
  } else if (gameState.shadowPosition) {
    shadowPos = gameState.shadowPosition;
  }
  if (shadowPos) stats.shadowPosition = shadowPos;

  // Shadow stats chi tiết
  if (engineInstance && typeof engineInstance.getShadowStats === 'function') {
    const ss = engineInstance.getShadowStats();
    stats.shadow = {
      position:       ss.position,
      moveCount:      ss.moveCount,
      maxMoves:       ss.maxMoves,
      canMove:        ss.canMove,
      delay:          gameState.shadowStartDelay || 0,
      movesRemaining: ss.maxMoves ? ss.maxMoves - ss.moveCount : 'unlimited',
    };
  }

  // Pressure plates
  if (gameState.pressurePlates?.length > 0) {
    stats.pressurePlates = {
      activated: gameState.pressurePlates.filter(p => p.activated).length,
      total:     gameState.pressurePlates.length,
    };
  }

  // Triggers
  if (gameState.triggers?.length > 0) {
    stats.triggers = {
      activated: gameState.triggers.filter(t => t.activated).length,
      total:     gameState.triggers.length,
    };
  }

  // Teleport
  if (gameState.teleportPairs?.length > 0) {
    stats.teleports = {
      available: gameState.teleportPairs.length,
      used:      gameState.teleportUsageCount || 0,
    };
  }

  // Time rewind
  if (gameState.timeRewind) {
    stats.timeRewind = {
      available:  gameState.timeRewind.charges    || 0,
      maxCharges: gameState.timeRewind.maxCharges || 0,
    };
  }

  // Moving obstacles
  if (gameState.movingObstacles?.length > 0) {
    stats.movingObstacles = gameState.movingObstacles.length;
  }

  return stats;
};

export const isWalkable = (cell) => !cell.isObstacle && !cell.isMovingObstacle;

export const getCellDisplayType = (cell) => {
  if (cell.isPlayer)          return 'player';
  if (cell.isShadow)          return 'shadow';
  if (cell.isTarget)          return 'target';
  if (cell.collectible)       return 'collectible';
  if (cell.trigger)           return cell.trigger.activated ? 'trigger-activated' : 'trigger';
  if (cell.isSwitch)          return cell.switchActivated   ? 'switch-activated'  : 'switch';
  if (cell.pressurePlate)     return cell.pressurePlate.activated ? 'plate-activated' : 'plate';
  if (cell.isTeleportEntrance) return 'teleport-entrance';
  if (cell.isTeleportExit)    return 'teleport-exit';
  if (cell.isMovingObstacle)  return 'moving-obstacle';
  if (cell.isRemovableWall)   return 'removable-wall';
  if (cell.isObstacle)        return 'obstacle';
  if (cell.isCollected)       return 'collected';
  return 'empty';
};


// ── Parabox SVG Sprites ───────────────────────────────────────────────────────
// Dùng thay thế emoji trong GameGrid — truyền size = cellSize

// ── Parabox-style SVG Sprites ─────────────────────────────────────────────────
// Thay thế toàn bộ sprite cũ trong GridHelper.jsx
// Style: Patrick's Parabox — hình vuông chunky, mắt tròn to, flat color, bold outline

// ─── animations (inject 1 lần vào <head> hoặc giữ nguyên trong component) ───
const PARABOX_KEYFRAMES = `
  @keyframes pb-bob       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes pb-bobSlow   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(3px)} }
  @keyframes pb-blink     { 0%,88%,100%{transform:scaleY(1)} 92%{transform:scaleY(0.08)} }
  @keyframes pb-pulse     { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes pb-starFloat { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-5px) rotate(5deg)} }
  @keyframes pb-switchGlow{ 0%,100%{opacity:1} 50%{opacity:0.7} }
`;

// Helper inject keyframes 1 lần duy nhất
let _injected = false;
const injectKeyframes = () => {
  if (_injected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = PARABOX_KEYFRAMES;
  document.head.appendChild(style);
  _injected = true;
};

// ─────────────────────────────────────────────────────────────────────────────
// PlayerSprite
// Nhân vật chính: hình vuông cam, mắt tròn to có animation blink, bob lên xuống
// direction: 'right' | 'left' | 'up' | 'down' — mắt nhìn theo hướng di chuyển
// ─────────────────────────────────────────────────────────────────────────────
export const PlayerSprite = ({ size = 48, animated = true, direction = 'down' }) => {
  injectKeyframes();

  // Offset mắt theo hướng
  const eyeOffset = {
    right: { lx: 2,  ly: 0  },
    left:  { lx: -2, ly: 0  },
    up:    { lx: 0,  ly: -2 },
    down:  { lx: 0,  ly: 2  },
  }[direction] ?? { lx: 0, ly: 0 };

  const bobStyle = animated
    ? { animation: 'pb-bob 1.2s ease-in-out infinite', transformOrigin: 'center bottom' }
    : {};
  const blinkStyle = animated
    ? { animation: 'pb-blink 3s ease-in-out infinite' }
    : {};

  // Scale toàn bộ từ viewBox 56→size
  const s = size / 56;

  return (
    <svg width={size} height={size} viewBox="0 0 56 56"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block', overflow: 'visible' }}>
      <g style={bobStyle}>
        {/* Body */}
        <rect x="6" y="8" width="44" height="42" rx="6" fill="#FF6B35"/>
        <rect x="6" y="8" width="44" height="42" rx="6" fill="none" stroke="#C43E00" strokeWidth="3"/>
        {/* Face area */}
        <rect x="12" y="14" width="32" height="28" rx="4" fill="#FF8C5A"/>
        {/* Eye Left */}
        <g style={{ ...blinkStyle, transformOrigin: '20px 26px' }}>
          <ellipse cx={20 + eyeOffset.lx} cy={26 + eyeOffset.ly} rx="5" ry="6" fill="white"/>
          <ellipse cx={21 + eyeOffset.lx} cy={27 + eyeOffset.ly} rx="2.5" ry="3" fill="#1a1a1a"/>
          <circle  cx={22 + eyeOffset.lx} cy={25.5 + eyeOffset.ly} r="1" fill="white"/>
        </g>
        {/* Eye Right */}
        <g style={{ ...blinkStyle, transformOrigin: '36px 26px', animationDelay: '0.15s' }}>
          <ellipse cx={36 + eyeOffset.lx} cy={26 + eyeOffset.ly} rx="5" ry="6" fill="white"/>
          <ellipse cx={37 + eyeOffset.lx} cy={27 + eyeOffset.ly} rx="2.5" ry="3" fill="#1a1a1a"/>
          <circle  cx={38 + eyeOffset.lx} cy={25.5 + eyeOffset.ly} r="1" fill="white"/>
        </g>
        {/* Smile */}
        <path d="M21 35 Q28 40 35 35" fill="none" stroke="#C43E00" strokeWidth="2" strokeLinecap="round"/>
        {/* Blush */}
        <ellipse cx="15" cy="33" rx="4" ry="2.5" fill="#FF4500" opacity="0.4"/>
        <ellipse cx="41" cy="33" rx="4" ry="2.5" fill="#FF4500" opacity="0.4"/>
        {/* Feet */}
        <rect x="10" y="46" width="12" height="6" rx="3" fill="#C43E00"/>
        <rect x="34" y="46" width="12" height="6" rx="3" fill="#C43E00"/>
      </g>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ShadowSprite
// Bản sao bóng: tím đậm, bob ngược pha, mắt phẳng hơn (không blink)
// ─────────────────────────────────────────────────────────────────────────────
export const ShadowSprite = ({ size = 48, animated = true, direction = 'down' }) => {
  injectKeyframes();

  const eyeOffset = {
    right: { lx: 2,  ly: 0  },
    left:  { lx: -2, ly: 0  },
    up:    { lx: 0,  ly: -2 },
    down:  { lx: 0,  ly: 2  },
  }[direction] ?? { lx: 0, ly: 0 };

  const bobStyle = animated
    ? { animation: 'pb-bobSlow 1.5s ease-in-out infinite', transformOrigin: 'center bottom' }
    : {};

  return (
    <svg width={size} height={size} viewBox="0 0 56 56"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block', overflow: 'visible', opacity: 0.88 }}>
      <g style={bobStyle}>
        <rect x="6" y="8" width="44" height="42" rx="6" fill="#7B3FD4"/>
        <rect x="6" y="8" width="44" height="42" rx="6" fill="none" stroke="#4A1F8C" strokeWidth="3"/>
        <rect x="12" y="14" width="32" height="28" rx="4" fill="#9B5DE5"/>
        {/* Eyes — no blink, just direction offset */}
        <ellipse cx={20 + eyeOffset.lx} cy={26 + eyeOffset.ly} rx="5" ry="6" fill="rgba(255,255,255,0.9)"/>
        <ellipse cx={21 + eyeOffset.lx} cy={27 + eyeOffset.ly} rx="2.5" ry="3" fill="#1a1a1a"/>
        <circle  cx={22 + eyeOffset.lx} cy={25.5 + eyeOffset.ly} r="1" fill="white"/>
        <ellipse cx={36 + eyeOffset.lx} cy={26 + eyeOffset.ly} rx="5" ry="6" fill="rgba(255,255,255,0.9)"/>
        <ellipse cx={37 + eyeOffset.lx} cy={27 + eyeOffset.ly} rx="2.5" ry="3" fill="#1a1a1a"/>
        <circle  cx={38 + eyeOffset.lx} cy={25.5 + eyeOffset.ly} r="1" fill="white"/>
        {/* Neutral mouth */}
        <rect x="21" y="35" width="14" height="2.5" rx="1.2" fill="#4A1F8C"/>
        {/* Blush */}
        <ellipse cx="15" cy="33" rx="4" ry="2.5" fill="#C77DFF" opacity="0.35"/>
        <ellipse cx="41" cy="33" rx="4" ry="2.5" fill="#C77DFF" opacity="0.35"/>
        {/* Feet */}
        <rect x="10" y="46" width="12" height="6" rx="3" fill="#4A1F8C"/>
        <rect x="34" y="46" width="12" height="6" rx="3" fill="#4A1F8C"/>
      </g>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TargetSprite
// Ô đích đến: crosshair + ring pulse
// ─────────────────────────────────────────────────────────────────────────────
export const TargetSprite = ({ size = 48, animated = true }) => {
  injectKeyframes();
  const pulseStyle = animated ? { animation: 'pb-pulse 1s ease-in-out infinite' } : {};

  return (
    <svg width={size} height={size} viewBox="0 0 56 56"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block' }}>
      {/* Outer frame */}
      <rect x="4" y="4" width="48" height="48" rx="8" fill="#0A1628" stroke="#00B4D8" strokeWidth="2.5"/>
      {/* Middle ring */}
      <rect style={pulseStyle} x="12" y="12" width="32" height="32" rx="6"
        fill="none" stroke="#52B788" strokeWidth="2"/>
      {/* Center */}
      <rect style={pulseStyle} x="20" y="20" width="16" height="16" rx="4" fill="#52B788"/>
      <rect x="24" y="24" width="8" height="8" rx="2" fill="#B7E4C7"/>
      {/* Corner ticks */}
      <rect x="4"  y="4"  width="8" height="3" fill="#00B4D8"/>
      <rect x="4"  y="4"  width="3" height="8" fill="#00B4D8"/>
      <rect x="44" y="4"  width="8" height="3" fill="#00B4D8"/>
      <rect x="53" y="4"  width="3" height="8" fill="#00B4D8"/>
      <rect x="4"  y="49" width="8" height="3" fill="#00B4D8"/>
      <rect x="4"  y="44" width="3" height="8" fill="#00B4D8"/>
      <rect x="44" y="49" width="8" height="3" fill="#00B4D8"/>
      <rect x="53" y="44" width="3" height="8" fill="#00B4D8"/>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ObstacleSprite
// Tường/vật cản: brick block đậm, không animate
// ─────────────────────────────────────────────────────────────────────────────
export const ObstacleSprite = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 56 56"
    xmlns="http://www.w3.org/2000/svg"
    style={{ imageRendering: 'pixelated', display: 'block' }}>
    <rect x="2" y="2" width="52" height="52" rx="5" fill="#2D3561"/>
    <rect x="2" y="2" width="52" height="52" rx="5" fill="none" stroke="#151C3A" strokeWidth="2.5"/>
    {/* Top highlight */}
    <rect x="2" y="2" width="52" height="14" rx="5" fill="#3A4580"/>
    <rect x="2" y="8" width="52" height="8"  fill="#3A4580"/>
    {/* Brick row 1 */}
    <rect x="4"  y="15" width="22" height="10" rx="2" fill="#323870"/>
    <rect x="30" y="15" width="22" height="10" rx="2" fill="#323870"/>
    <rect x="4"  y="15" width="22" height="3"  rx="1" fill="#4050A0"/>
    <rect x="30" y="15" width="22" height="3"  rx="1" fill="#4050A0"/>
    {/* Brick row 2 */}
    <rect x="4"  y="29" width="15" height="10" rx="2" fill="#323870"/>
    <rect x="23" y="29" width="29" height="10" rx="2" fill="#323870"/>
    <rect x="4"  y="29" width="15" height="3"  rx="1" fill="#4050A0"/>
    <rect x="23" y="29" width="29" height="3"  rx="1" fill="#4050A0"/>
    {/* Brick row 3 */}
    <rect x="4"  y="43" width="26" height="10" rx="2" fill="#323870"/>
    <rect x="34" y="43" width="18" height="10" rx="2" fill="#323870"/>
    <rect x="4"  y="43" width="26" height="3"  rx="1" fill="#4050A0"/>
    <rect x="34" y="43" width="18" height="3"  rx="1" fill="#4050A0"/>
    {/* Grout */}
    <line x1="2" y1="27" x2="54" y2="27" stroke="#151C3A" strokeWidth="1.5"/>
    <line x1="2" y1="41" x2="54" y2="41" stroke="#151C3A" strokeWidth="1.5"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// StarSprite
// Collectible: ngôi sao vàng float lên xuống, collected thì xám mờ
// ─────────────────────────────────────────────────────────────────────────────
export const StarSprite = ({ size = 48, animated = true, collected = false }) => {
  injectKeyframes();
  const floatStyle = (animated && !collected)
    ? { animation: 'pb-starFloat 1.5s ease-in-out infinite', transformOrigin: 'center center' }
    : {};

  return (
    <svg width={size} height={size} viewBox="0 0 56 56"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block' }}>
      <g style={floatStyle}>
        {!collected && (
          <circle cx="28" cy="28" r="22" fill="#FFF176" opacity="0.12"/>
        )}
        <polygon
          points="28,6 33,20 48,20 36,30 41,44 28,35 15,44 20,30 8,20 23,20"
          fill={collected ? '#888' : '#FFD700'}
          stroke={collected ? '#555' : '#E6A800'}
          strokeWidth="2"
          strokeLinejoin="round"
          opacity={collected ? 0.4 : 1}
        />
        {!collected && (
          <>
            <polygon
              points="28,12 31,21 40,21 33,27 36,36 28,30 20,36 23,27 16,21 25,21"
              fill="#FFF59D" opacity="0.6"
            />
            <circle cx="28" cy="26" r="4" fill="white" opacity="0.5"/>
          </>
        )}
      </g>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SwitchSprite
// Công tắc: lever trái=OFF (xám), lever phải=ON (xanh + glow indicator)
// ─────────────────────────────────────────────────────────────────────────────
export const SwitchSprite = ({ size = 48, activated = false }) => {
  injectKeyframes();
  const glowStyle = activated
    ? { animation: 'pb-switchGlow 1.2s ease-in-out infinite' }
    : {};

  return (
    <svg width={size} height={size} viewBox="0 0 56 56"
      xmlns="http://www.w3.org/2000/svg"
      style={{ imageRendering: 'pixelated', display: 'block' }}>
      <g style={glowStyle}>
        {/* Base plate */}
        <rect x="6" y="30" width="44" height="18" rx="5" fill="#2D3561" stroke="#151C3A" strokeWidth="2"/>
        {/* Switch housing */}
        <rect x="14" y="14" width="28" height="20" rx="4"
          fill={activated ? '#52B788' : '#718096'}
          stroke={activated ? '#2D8A5E' : '#4A5568'}
          strokeWidth="2"/>
        {/* Lever */}
        {activated ? (
          <>
            <rect x="30" y="16" width="10" height="16" rx="3" fill="#B7E4C7"/>
            <rect x="30" y="16" width="10" height="5"  rx="2" fill="#D4F4E2"/>
          </>
        ) : (
          <>
            <rect x="16" y="16" width="10" height="16" rx="3" fill="#A0AEC0"/>
            <rect x="16" y="16" width="10" height="5"  rx="2" fill="#CBD5E0"/>
          </>
        )}
        {/* Indicator light */}
        {activated ? (
          <>
            <circle cx="22" cy="24" r="5" fill="#00FF88" opacity="0.9"/>
            <circle cx="22" cy="24" r="2.5" fill="white" opacity="0.8"/>
          </>
        ) : (
          <>
            <circle cx="38" cy="24" r="5" fill="#1a1a2e" stroke="#4A5568" strokeWidth="1.5"/>
            <circle cx="38" cy="24" r="2" fill="#4A5568"/>
          </>
        )}
        {/* Bolts */}
        <circle cx="11" cy="39" r="2" fill={activated ? '#2D8A5E' : '#4A5568'}/>
        <circle cx="45" cy="39" r="2" fill={activated ? '#2D8A5E' : '#4A5568'}/>
      </g>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// getCellSprite — drop-in replacement cho getCellEmoji trong GameGrid
// Usage: {getCellSprite(cellType, cellSize * 0.85)}
// ─────────────────────────────────────────────────────────────────────────────
export const getCellSprite = (cellType, size = 40, direction = 'down') => {
  switch (cellType) {
    case 'player':           return <PlayerSprite   size={size} direction={direction}/>;
    case 'shadow':           return <ShadowSprite   size={size} direction={direction}/>;
    case 'target':           return <TargetSprite   size={size}/>;
    case 'obstacle':
    case 'removable-wall':
    case 'moving-obstacle':  return <ObstacleSprite size={size}/>;
    case 'collectible':      return <StarSprite     size={size}/>;
    case 'collected':        return <StarSprite     size={size} collected/>;
    case 'switch':           return <SwitchSprite   size={size} activated={false}/>;
    case 'switch-activated': return <SwitchSprite   size={size} activated/>;
    default:                 return null;
  }
};

/**
 * getCellSprite(cellType, size) → JSX SVG sprite
 * Dùng trong GameGrid thay vì getCellEmoji
 *
 * Example trong GameGrid/GameCell:
 *   import { getCellSprite } from '@shared/engine';
 *   // thay: <span>{getCellEmoji(type)}</span>
 *   // bằng: {getCellSprite(type, cellSize * 0.7)}
 */

export default { generateGridData, extractStats, isWalkable, getCellDisplayType };