// shared/engine/ShadowGameEngine.js
// Enhanced Shadow/Clone mechanic v3.1 - FIXED
// 🔥 THAY ĐỔI CHÍNH: Bóng giờ di chuyển độc lập dựa trên HƯỚNG, không sao chép vị trí player

import { GameEngine } from './GameEngine.jsx';

export class ShadowGameEngine extends GameEngine {
  constructor(initialState) {
    super(initialState);
    // Delay trước khi bóng bắt đầu di chuyển (số bước player đi)
    this.shadowStartDelay = initialState.shadowStartDelay || initialState.shadowDelay || 0;
    
    // Số bước tối đa bóng được di chuyển
    this.shadowMoveDuration = initialState.shadowMoveDuration !== undefined 
      ? initialState.shadowMoveDuration 
      : (initialState.shadowMaxMoves !== undefined ? initialState.shadowMaxMoves : null);
    
    // 🔥 THAY ĐỔI: Chỉ lưu HƯỚNG di chuyển, không lưu vị trí
    this.moveHistory = [];
    
    // Vị trí hiện tại của bóng
    this.shadowPosition = this.shadowStartPosition ? 
      { ...this.shadowStartPosition } : null;
    
    // Số bước bóng đã di chuyển
    this.shadowMoveCount = 0;
    if (initialState.shadowStartPosition) {
    this.shadowPosition = { ...initialState.shadowStartPosition };
    } else {
      this.shadowPosition = { 
        x: Math.round(initialState.player.x), 
        y: Math.round(initialState.player.y) 
      };
    }
    // ===== TRIGGERS & MECHANISMS =====
    this.state.switches = initialState.switches || [];
    this.state.activatedSwitches = [];
    this.state.pressurePlates = initialState.pressurePlates || [];
    this.state.hiddenWalls = [];
    this.state.removableWalls = initialState.removableWalls || [];
    this.state.triggers = initialState.triggers || [];
  }

  // 🔥 THAY ĐỔI: Chỉ ghi lại HƯỚNG di chuyển
  recordMove(direction) {
    this.moveHistory.push({
      direction,  // Chỉ lưu hướng: 'up', 'down', 'left', 'right'
      step: this.stepCount
    });
  }

  // ===== HELPER: Tính toán vị trí mới dựa trên hướng =====
  getNextPosition(x, y, direction) {
    switch (direction) {
      case 'up':    return { x, y: y - 1 };
      case 'down':  return { x, y: y + 1 };
      case 'left':  return { x: x - 1, y };
      case 'right': return { x: x + 1, y };
      default:      return { x, y };
    }
  }

  // ===== COLLISION DETECTION =====
  
  checkShadowCollision(x, y) {
    if (!this.shadowPosition) return false;
    return (x === this.shadowPosition.x && y === this.shadowPosition.y);
  }

  validateMove(x, y) {
    // Kiểm tra biên
    if (x < 0 || x >= this.state.cols || y < 0 || y >= this.state.rows) {
      throw new Error("Ra ngoài bản đồ!");
    }
    
    // Kiểm tra chướng ngại vật
    const hitObstacle = this.state.obstacles.some(obs => obs.x === x && obs.y === y);
    if (hitObstacle) {
      throw new Error("Chạm tường!");
    }
    
    // Kiểm tra va chạm với bóng
    if (this.checkShadowCollision(x, y)) {
      throw new Error("❌ Chạm bóng! Game Over!");
    }
  }

  // 🔥 THAY ĐỔI: Bóng di chuyển dựa trên HƯỚNG từ vị trí hiện tại của nó
  updateShadow() {
    // BƯỚC 1: Khởi tạo bóng lần đầu
    if (!this.shadowPosition) {
      if (this.shadowStartPosition) {
        // Bóng xuất hiện tại vị trí custom
        this.shadowPosition = { ...this.shadowStartPosition };
        this.emitMessage(`👤 Bóng xuất hiện tại (${this.shadowPosition.x}, ${this.shadowPosition.y})!`);
      } else {
        // 🔥 THAY ĐỔI: Nếu không có shadowStartPosition, bóng xuất hiện tại vị trí player ban đầu
        this.shadowPosition = { 
          x: Math.round(this.state.player.x), 
          y: Math.round(this.state.player.y) 
        };
        this.emitMessage(`👤 Bóng xuất hiện tại vị trí ban đầu (${this.shadowPosition.x}, ${this.shadowPosition.y})!`);
      }
      
      // Auto-set shadowMoveDuration nếu chưa định nghĩa
      if (this.shadowMoveDuration === null && this.shadowStartDelay > 0) {
        this.shadowMoveDuration = this.shadowStartDelay;
        this.emitMessage(`⏱️ Bóng sẽ di chuyển tối đa ${this.shadowMoveDuration} bước!`);
      }
      
      this.checkPressurePlates();
      return;
    }

    // BƯỚC 2: Kiểm tra bóng đã hết số bước di chuyển chưa
    if (this.shadowMoveDuration !== null && this.shadowMoveCount >= this.shadowMoveDuration) {
      this.checkShadowTriggers();
      this.checkPressurePlates();
      return;
    }

    // BƯỚC 3: Kiểm tra đã đến lúc bóng di chuyển chưa
    if (this.moveHistory.length <= this.shadowStartDelay) {
      this.checkShadowTriggers();
      this.checkPressurePlates();
      return;
    }

    // BƯỚC 4: 🔥 THAY ĐỔI: Bóng di chuyển theo HƯỚNG từ vị trí hiện tại của nó
    const shadowFollowIndex = this.shadowMoveCount;
    
    if (shadowFollowIndex >= 0 && shadowFollowIndex < this.moveHistory.length) {
      const moveRecord = this.moveHistory[shadowFollowIndex];
      const direction = moveRecord.direction;
      
      // 🔥 QUAN TRỌNG: Tính vị trí mới từ vị trí HIỆN TẠI của bóng
      const currentShadowX = this.shadowPosition.x;
      const currentShadowY = this.shadowPosition.y;
      const newPos = this.getNextPosition(currentShadowX, currentShadowY, direction);
      
      // Kiểm tra bóng có va chạm tường không
      const hitWall = this.state.obstacles.some(obs => obs.x === newPos.x && obs.y === newPos.y);
      const outOfBounds = newPos.x < 0 || newPos.x >= this.state.cols || 
                          newPos.y < 0 || newPos.y >= this.state.rows;
      
      if (hitWall || outOfBounds) {
        // Bóng không thể di chuyển (chạm tường/ra ngoài), nhưng vẫn đếm bước
        this.emitMessage(`🚧 Bóng chạm tường tại (${currentShadowX}, ${currentShadowY}), không thể đi ${direction}!`);
        this.shadowMoveCount++;
      } else {
        // Di chuyển bóng
        this.shadowPosition = newPos;
        this.shadowMoveCount++;
        
        // Kiểm tra va chạm với player sau khi bóng di chuyển
        const playerX = Math.round(this.state.player.x);
        const playerY = Math.round(this.state.player.y);
        if (this.checkShadowCollision(playerX, playerY)) {
          throw new Error("❌ Bóng di chuyển vào vị trí player! Game Over!");
        }
      }
      
      // Kiểm tra triggers sau khi di chuyển
      this.checkShadowTriggers();
      this.checkPressurePlates();
      
      // Thông báo nếu bóng hết bước
      if (this.shadowMoveDuration !== null && this.shadowMoveCount >= this.shadowMoveDuration) {
        this.emitMessage(`⏸️ Bóng đã di chuyển đủ ${this.shadowMoveDuration} bước và dừng lại mãi mãi!`);
      }
    }
  }

  // ===== PRESSURE PLATES =====
  
  checkPressurePlates() {
    if (!this.shadowPosition) return;

    const shadowX = this.shadowPosition.x;
    const shadowY = this.shadowPosition.y;
    const playerX = Math.round(this.state.player.x);
    const playerY = Math.round(this.state.player.y);

    this.state.pressurePlates.forEach(plate => {
      const playerOnPlate = plate.x === playerX && plate.y === playerY;
      const shadowOnPlate = plate.x === shadowX && plate.y === shadowY;
      const shouldActivate = playerOnPlate && shadowOnPlate;
      
      if (shouldActivate && !plate.activated) {
        plate.activated = true;
        if (plate.targetWall) {
          this.hideWall(plate.targetWall);
          this.emitMessage(`⚡ Cơ quan kích hoạt! Tường tại (${plate.targetWall.x}, ${plate.targetWall.y}) đã ẩn!`);
        }
      } else if (!shouldActivate && plate.activated) {
        plate.activated = false;
        if (plate.targetWall) {
          this.showWall(plate.targetWall);
          this.emitMessage(`⚠️ Cơ quan ngưng hoạt động! Tường tại (${plate.targetWall.x}, ${plate.targetWall.y}) xuất hiện lại!`);
        }
      }
    });
  }

  hideWall(wall) {
    const index = this.state.obstacles.findIndex(
      obs => obs.x === wall.x && obs.y === wall.y
    );
    
    if (index !== -1) {
      const removedWall = this.state.obstacles.splice(index, 1)[0];
      const alreadyHidden = this.state.hiddenWalls.some(
        w => w.x === wall.x && w.y === wall.y
      );
      if (!alreadyHidden) {
        this.state.hiddenWalls.push(removedWall);
      }
      // 🔥 FIX: Emit state change
      this.emitStateChange();
    }
  }

  showWall(wall) {
    const exists = this.state.obstacles.some(
      obs => obs.x === wall.x && obs.y === wall.y
    );
    
    if (!exists) {
      this.state.obstacles.push({ x: wall.x, y: wall.y });
      const hIndex = this.state.hiddenWalls.findIndex(
        w => w.x === wall.x && w.y === wall.y
      );
      if (hIndex !== -1) {
        this.state.hiddenWalls.splice(hIndex, 1);
      }
      // 🔥 FIX: Emit state change
      this.emitStateChange();
    }
  }

  checkShadowTriggers() {
    if (!this.shadowPosition) return;

    const shadowX = this.shadowPosition.x;
    const shadowY = this.shadowPosition.y;
    const playerX = Math.round(this.state.player.x);
    const playerY = Math.round(this.state.player.y);

    // Check switches
    this.state.switches.forEach(switchItem => {
      if (switchItem.x === shadowX && switchItem.y === shadowY) {
        if (!this.state.activatedSwitches.some(s => s.x === switchItem.x && s.y === switchItem.y)) {
          this.state.activatedSwitches.push({ ...switchItem });
          this.emitMessage(`🔓 Bóng kích hoạt công tắc tại (${switchItem.x}, ${switchItem.y})!`);
        }
      }
    });

    // Check triggers
    this.state.triggers.forEach(trigger => {
      if (trigger.x === shadowX && trigger.y === shadowY && !trigger.activated) {
        if (trigger.requirePlayer && (playerX !== trigger.x || playerY !== trigger.y)) {
          return;
        }

        trigger.activated = true;

        switch (trigger.type) {
          case 'remove_wall':
            this.removeWall(trigger.target);
            this.emitMessage(`💥 Tường tại (${trigger.target.x}, ${trigger.target.y}) đã biến mất!`);
            break;
          case 'activate_switch':
            this.activateSwitchAt(trigger.target);
            this.emitMessage(`🔓 Công tắc tại (${trigger.target.x}, ${trigger.target.y}) được kích hoạt!`);
            break;
          case 'open_gate':
            this.openGate(trigger.target);
            this.emitMessage(`🚪 Cổng tại (${trigger.target.x}, ${trigger.target.y}) đã mở!`);
            break;
          case 'spawn_collectible':
            this.spawnCollectible(trigger.target);
            this.emitMessage(`⭐ Sao xuất hiện tại (${trigger.target.x}, ${trigger.target.y})!`);
            break;
          case 'remove_multiple_walls':
            if (trigger.targets && Array.isArray(trigger.targets)) {
              trigger.targets.forEach(target => {
                this.removeWall(target);
              });
              this.emitMessage(`💥 ${trigger.targets.length} tường đã biến mất! Đường đến đích đã mở!`);
            }
            break;
          default:
            this.emitMessage(`✨ Trigger kích hoạt tại (${trigger.x}, ${trigger.y})!`);
        }
      }
    });
  }

  // ===== TRIGGER ACTIONS =====
  
  removeWall(target) {
    console.log('🔥 removeWall called for:', target);
    
    const index = this.state.obstacles.findIndex(
      obs => obs.x === target.x && obs.y === target.y
    );
    
    if (index !== -1) {
      this.state.obstacles.splice(index, 1);
      console.log('✅ Wall removed from obstacles:', target);
      
      const rwIndex = this.state.removableWalls.findIndex(
        w => w.x === target.x && w.y === target.y
      );
      if (rwIndex !== -1) {
        this.state.removableWalls.splice(rwIndex, 1);
      }
      
      // 🔥 CRITICAL FIX: Emit state change để UI cập nhật
      this.emitStateChange();
    } else {
      console.log('⚠️ Wall not found in obstacles:', target);
    }
  }

  activateSwitchAt(target) {
    const switchItem = this.state.switches.find(
      s => s.x === target.x && s.y === target.y
    );
    
    if (switchItem && !this.state.activatedSwitches.some(
      s => s.x === target.x && s.y === target.y
    )) {
      this.state.activatedSwitches.push({ ...switchItem });
    }
  }

  openGate(target) {
    this.removeWall(target);
  }

  spawnCollectible(target) {
    const exists = this.state.collectibles.some(
      c => c.x === target.x && c.y === target.y
    );
    
    if (!exists) {
      this.state.collectibles.push({
        x: target.x,
        y: target.y,
        type: 'star'
      });
    }
  }

  // ===== MOVE METHODS - 🔥 THAY ĐỔI: Chỉ ghi lại HƯỚNG =====
  
  async moveRight(steps = 1) {
    for (let i = 0; i < steps; i++) {
      this.stepCount++;
      if (this.stepCount > this.maxSteps) {
        throw new Error("Quá nhiều bước! Tối đa 200 bước.");
      }
      
      const x = Math.round(this.state.player.x);
      const y = Math.round(this.state.player.y);
      const newX = x + 1;
      const newY = y;
      
      this.validateMove(newX, newY);
      this.recordMove('right');  // 🔥 Chỉ ghi hướng
      
      await this.animateMove(x, y, newX, newY);
      
      this.state.player.x = newX;
      this.state.player.y = newY;
      this.state.moves++;
      
      this.checkCollectible(newX, newY);
      this.updateShadow();
      this.emitStateChange();
      
      await this.sleep(100);
    }
  }

  async moveLeft(steps = 1) {
    for (let i = 0; i < steps; i++) {
      this.stepCount++;
      if (this.stepCount > this.maxSteps) {
        throw new Error("Quá nhiều bước! Tối đa 200 bước.");
      }
      
      const x = Math.round(this.state.player.x);
      const y = Math.round(this.state.player.y);
      const newX = x - 1;
      const newY = y;
      
      this.validateMove(newX, newY);
      this.recordMove('left');  // 🔥 Chỉ ghi hướng
      
      await this.animateMove(x, y, newX, newY);
      
      this.state.player.x = newX;
      this.state.player.y = newY;
      this.state.moves++;
      
      this.checkCollectible(newX, newY);
      this.updateShadow();
      this.emitStateChange();
      
      await this.sleep(100);
    }
  }

  async moveDown(steps = 1) {
    for (let i = 0; i < steps; i++) {
      this.stepCount++;
      if (this.stepCount > this.maxSteps) {
        throw new Error("Quá nhiều bước! Tối đa 200 bước.");
      }
      
      const x = Math.round(this.state.player.x);
      const y = Math.round(this.state.player.y);
      const newX = x;
      const newY = y + 1;
      
      this.validateMove(newX, newY);
      this.recordMove('down');  // 🔥 Chỉ ghi hướng
      
      await this.animateMove(x, y, newX, newY);
      
      this.state.player.x = newX;
      this.state.player.y = newY;
      this.state.moves++;
      
      this.checkCollectible(newX, newY);
      this.updateShadow();
      this.emitStateChange();
      
      await this.sleep(100);
    }
  }

  async moveUp(steps = 1) {
    for (let i = 0; i < steps; i++) {
      this.stepCount++;
      if (this.stepCount > this.maxSteps) {
        throw new Error("Quá nhiều bước! Tối đa 200 bước.");
      }
      
      const x = Math.round(this.state.player.x);
      const y = Math.round(this.state.player.y);
      const newX = x;
      const newY = y - 1;
      
      this.validateMove(newX, newY);
      this.recordMove('up');  // 🔥 Chỉ ghi hướng
      
      await this.animateMove(x, y, newX, newY);
      
      this.state.player.x = newX;
      this.state.player.y = newY;
      this.state.moves++;
      
      this.checkCollectible(newX, newY);
      this.updateShadow();
      this.emitStateChange();
      
      await this.sleep(100);
    }
  }

  // ===== WIN CONDITIONS =====
  
  allSwitchesActivated() {
    if (this.state.switches.length === 0) return true;
    return this.state.activatedSwitches.length === this.state.switches.length;
  }

  allPressurePlatesActivated() {
    if (this.state.pressurePlates.length === 0) return true;
    return this.state.pressurePlates.every(plate => plate.activated);
  }

  allTriggersActivated() {
    if (this.state.triggers.length === 0) return true;
    return this.state.triggers.every(trigger => trigger.activated);
  }

  checkWin() {
    const finalX = Math.round(this.state.player.x);
    const finalY = Math.round(this.state.player.y);
    
    const atTarget = finalX === this.state.target.x && finalY === this.state.target.y;
    const hasAllStars = this.state.collectibles.length === 0 || 
                        this.state.collectedItems.length === this.state.collectibles.length;
    const switchesOk = this.allSwitchesActivated();
    const platesOk = this.allPressurePlatesActivated();
    const triggersOk = this.allTriggersActivated();
    
    if (atTarget && hasAllStars && switchesOk && platesOk && triggersOk) {
      this.emitMessage("🎉 Hoàn thành! Số bước: " + this.state.moves);
      return true;
    } else {
      if (!atTarget) {
        this.emitMessage("❌ Chưa đến đích!");
      } else if (!hasAllStars) {
        this.emitMessage("⭐ Thu thập tất cả các sao!");
      } else if (!switchesOk) {
        this.emitMessage("🔒 Kích hoạt tất cả công tắc!");
      } else if (!platesOk) {
        this.emitMessage("⚡ Kích hoạt tất cả pressure plates!");
      } else if (!triggersOk) {
        this.emitMessage("🎯 Kích hoạt tất cả triggers!");
      }
      return false;
    }
  }

  // ===== GETTERS =====
  
  getShadowPosition() {
    return this.shadowPosition;
  }

  getShadowStats() {
    return {
      position: this.shadowPosition,
      moveCount: this.shadowMoveCount,
      maxMoves: this.shadowMoveDuration,
      canMove: this.shadowMoveDuration === null || this.shadowMoveCount < this.shadowMoveDuration
    };
  }

  // ===== RESET =====
  
  reset(initialState) {
    super.reset(initialState);
    
    this.shadowStartPosition = initialState.shadowStartPosition || null;
    this.shadowStartDelay = initialState.shadowStartDelay || initialState.shadowDelay || 0;
    this.shadowMoveDuration = initialState.shadowMoveDuration !== undefined 
      ? initialState.shadowMoveDuration 
      : (initialState.shadowMaxMoves !== undefined ? initialState.shadowMaxMoves : null);
    this.moveHistory = [];
    this.shadowPosition = this.shadowStartPosition ? 
      { ...this.shadowStartPosition } : null;
    this.shadowMoveCount = 0;
    
    this.state.switches = initialState.switches || [];
    this.state.activatedSwitches = [];
    this.state.pressurePlates = initialState.pressurePlates || [];
    this.state.hiddenWalls = [];
    this.state.removableWalls = initialState.removableWalls || [];
    this.state.triggers = initialState.triggers || [];
  }
}

// Helper to generate grid with shadow and triggers
export const generateShadowGridData = (gameState, shadowPosition) => {
  if (!gameState) return [];
  
  const cells = [];
  
  for (let y = 0; y < gameState.rows; y++) {
    for (let x = 0; x < gameState.cols; x++) {
      const isTarget = gameState.target.x === x && gameState.target.y === y;
      const isObstacle = gameState.obstacles.some(obs => obs.x === x && obs.y === y);
      const collectible = gameState.collectibles.find(item => item.x === x && item.y === y);
      const isCollected = gameState.collectedItems.some(item => item.x === x && item.y === y);
      const isPlayer = Math.round(gameState.player.x) === x && Math.round(gameState.player.y) === y;
      const isShadow = shadowPosition && shadowPosition.x === x && shadowPosition.y === y;
      const switchItem = gameState.switches?.find(s => s.x === x && s.y === y);
      const isSwitch = !!switchItem;
      const switchActivated = gameState.activatedSwitches?.some(s => s.x === x && s.y === y);
      const pressurePlate = gameState.pressurePlates?.find(p => p.x === x && p.y === y);
      const trigger = gameState.triggers?.find(t => t.x === x && t.y === y);
      const isRemovableWall = gameState.removableWalls?.some(w => w.x === x && w.y === y);
      
      cells.push({
        x,
        y,
        key: `${x}-${y}`,
        isTarget,
        isObstacle,
        isPlayer,
        isShadow,
        isSwitch,
        switchActivated,
        pressurePlate,
        trigger,
        isRemovableWall,
        collectible: collectible && !isCollected ? collectible : null,
        isCollected
      });
    }
  }
  
  return cells;
};