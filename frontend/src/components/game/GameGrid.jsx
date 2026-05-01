// frontend/src/components/game/GameGrid.jsx
import React from 'react';
import { generateGridData, getCellDisplayType, getCellSprite } from '../../../../shared/engine/Gridhelper.jsx';

// ===== HELPER FUNCTIONS =====
function getTriggerIcon(type) {
  switch(type) {
    case 'remove_wall': return '💥';
    case 'activate_switch': return '🔓';
    case 'open_gate': return '🚪';
    case 'spawn_collectible': return '⭐';
    default: return '🎯';
  }
}

function getTriggerGradient(type) {
  switch(type) {
    case 'remove_wall': 
      return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    case 'activate_switch': 
      return 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
    case 'open_gate': 
      return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
    case 'spawn_collectible': 
      return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    default: 
      return 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)';
  }
}

const GameGrid = ({ gameState, engineInstance, cellSize = 60 }) => {
  const CELL_SIZE = cellSize;
  if (!gameState) return null;

  // Dùng generateGridData từ GridHelper
  const cells = generateGridData(gameState, engineInstance);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gameState.cols}, ${CELL_SIZE}px)`,
        gap: '4px',
        padding: '20px',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}
    >
      {cells.map((cell) => {
        // Dùng helper functions
        const cellType = getCellDisplayType(cell);
        const sprite = getCellSprite(cellType, CELL_SIZE * 0.7);
        
        // Định nghĩa styles cho tất cả cell types
        let bgColor = '#f0f4f8';
        let borderColor = '#cbd5e1';
        let borderWidth = '3px';
        let showEmoji = true;

        // Map cell types to colors
        switch(cellType) {
          case 'player':
            bgColor = '#93c5fd';
            borderColor = '#3b82f6';
            break;
          case 'shadow':
            bgColor = '#a78bfa';
            borderColor = '#8b5cf6';
            break;
          case 'target':
            bgColor = '#fca5a5';
            borderColor = '#ef4444';
            break;
          case 'obstacle':
            bgColor = '#374151';
            borderColor = 'transparent';
            borderWidth = '0';
            break;
          case 'collectible':
            bgColor = '#fef3c7';
            borderColor = '#fbbf24';
            break;
          case 'switch':
            bgColor = '#d1d5db';
            borderColor = '#6b7280';
            break;
          case 'switch-activated':
            bgColor = '#86efac';
            borderColor = '#22c55e';
            break;
          case 'plate':
            bgColor = '#e5e7eb';
            borderColor = '#9ca3af';
            break;
          case 'plate-activated':
            bgColor = '#fef08a';
            borderColor = '#eab308';
            break;
          case 'teleport-entrance':
            bgColor = '#bfdbfe';
            borderColor = '#3b82f6';
            break;
          case 'teleport-exit':
            bgColor = '#c7d2fe';
            borderColor = '#6366f1';
            break;
          case 'moving-obstacle':
            bgColor = '#fca5a5';
            borderColor = '#ef4444';
            break;
          case 'collected':
            bgColor = '#f0f4f8';
            borderColor = '#cbd5e1';
            showEmoji = false;
            break;
          default:
            bgColor = '#f0f4f8';
            borderColor = '#cbd5e1';
        }

        return (
          <div
            key={cell.key}
            style={{
              width: CELL_SIZE + 'px',
              height: CELL_SIZE + 'px',
              backgroundColor: bgColor,
              border: `${borderWidth} solid ${borderColor}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              position: 'relative',
              transition: 'all 0.2s ease',
              boxShadow: (cellType === 'player' || cellType === 'target' || cellType === 'shadow') 
                ? '0 4px 8px rgba(0,0,0,0.15)' 
                : 'none'
            }}
          >
            {/* Render emoji từ helper */}
            {/* {showEmoji && emoji && (
              <div
                style={{
                  fontSize: cellType === 'obstacle' ? `${cellSize * 1}px` : '2rem',
                  animation: cellType === 'collectible' 
                    ? 'spin 3s linear infinite, float 2s ease-in-out infinite' 
                    : 'none',
                  filter: cellType === 'collectible' 
                    ? 'drop-shadow(0 2px 4px rgba(234, 179, 8, 0.5))' 
                    : 'none'
                }}
              >
                {emoji}
              </div>
            )} */}
            {showEmoji && sprite && sprite}

            {/* RENDER REMOVABLE WALLS (tường có thể phá) */}
            {cell.isRemovableWall && cell.isObstacle && (
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${cellSize * 0.4}px`,
                background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                border: '3px dashed #475569',
                borderRadius: '4px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
              }}>
                <span style={{ opacity: 0.6 }}>🧱</span>
              </div>
            )}

            {/* RENDER TRIGGERS - Chưa kích hoạt */}
            {cell.trigger && !cell.trigger.activated && (
              <div style={{
                position: 'absolute',
                width: '90%',
                height: '90%',
                top: '5%',
                left: '5%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${cellSize * 0.5}px`,
                background: getTriggerGradient(cell.trigger.type),
                border: '3px solid white',
                borderRadius: '50%',
                boxShadow: '0 0 15px rgba(147, 51, 234, 0.6)',
                animation: 'pulse 2s infinite'
              }}>
                {getTriggerIcon(cell.trigger.type)}
              </div>
            )}
            {/* 🔥 SHADOW với move counter */}
            {cell.isShadow && engineInstance?.getShadowStats && (
              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                fontSize: '10px',
                color: '#fff',
                backgroundColor: 'rgba(139, 92, 246, 0.9)',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                {(() => {
                  const stats = engineInstance.getShadowStats();
                  if (stats.maxMoves !== null) {
                    return `${stats.moveCount}/${stats.maxMoves}`;
                  }
                  return stats.moveCount;
                })()}
              </div>
            )}

            {/* RENDER TRIGGERS - Đã kích hoạt */}
            {cell.trigger && cell.trigger.activated && (
              <div style={{
                position: 'absolute',
                width: '90%',
                height: '90%',
                top: '5%',
                left: '5%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${cellSize * 0.5}px`,
                background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                border: '3px solid white',
                borderRadius: '50%',
                boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)',
                opacity: 0.6
              }}>
                ✓
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 15px rgba(147, 51, 234, 0.6);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 0 25px rgba(147, 51, 234, 0.8);
          }
        }
      `}</style>
    </div>
  );
};

export default GameGrid;