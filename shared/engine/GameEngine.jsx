// shared/engine/GameEngine.js
// Pure JavaScript - No React dependencies

const ANIMATION_DURATION = 300;

export class GameEngine {

  // ── Metadata cho tất cả lệnh available ──────────────────────────────────
  static COMMANDS = {
    moves: [
      { id: "mrn", name: "moveRight", label: "moveRight(n)", code: "moveRight(3);\n", hint: "Đi phải n bước",  category: "move" },
      { id: "mln", name: "moveLeft",  label: "moveLeft(n)",  code: "moveLeft(3);\n",  hint: "Đi trái n bước", category: "move" },
      { id: "mun", name: "moveUp",    label: "moveUp(n)",    code: "moveUp(3);\n",    hint: "Đi lên n bước",  category: "move" },
      { id: "mdn", name: "moveDown",  label: "moveDown(n)",  code: "moveDown(3);\n",  hint: "Đi xuống n bước",category: "move" },
    ],
    conditions: [
      { id: "cmr", name: "canMoveRight", label: "canMoveRight()", code: "canMoveRight()", hint: "Có thể đi phải?",  category: "condition" },
      { id: "cml", name: "canMoveLeft",  label: "canMoveLeft()",  code: "canMoveLeft()",  hint: "Có thể đi trái?",  category: "condition" },
      { id: "cmu", name: "canMoveUp",    label: "canMoveUp()",    code: "canMoveUp()",    hint: "Có thể đi lên?",   category: "condition" },
      { id: "cmd", name: "canMoveDown",  label: "canMoveDown()",  code: "canMoveDown()",  hint: "Có thể đi xuống?", category: "condition" },
    ],
    loops: [
      { id: "forn", name: "for",   label: "for (n lần)",  code: "for (let i = 0; i < n; i++) {\n  \n}\n", hint: "Lặp n lần",  category: "loop" },
      { id: "wht",  name: "while", label: "while (true)", code: "while (true) {\n  \n}\n",                hint: "Lặp vô hạn", category: "loop" },
    ],
    ifs: [
      { id: "ifelse", name: "if", label: "if / else", code: "if (canMoveRight()) {\n  moveRight();\n} else {\n  moveDown();\n}\n", hint: "Rẽ nhánh if/else", category: "if" },
    ],
  };

  constructor(initialState) {
    this.state = { ...initialState };
    this.stepCount = 0;
    this.maxSteps = 200;
    this.loopIterations = 0;
    this.maxLoopIterations = 1000;
    this.onStateChange = null;
    this.onMessage = null;
  }

  setCallbacks(onStateChange, onMessage) {
    this.onStateChange = onStateChange;
    this.onMessage = onMessage;
  }

  emitStateChange() {
    if (this.onStateChange) this.onStateChange({ ...this.state });
  }

  emitMessage(message) {
    if (this.onMessage) this.onMessage(message);
  }

  calculatePosition(fromX, fromY, toX, toY, progress) {
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    return {
      x: fromX + (toX - fromX) * easeProgress,
      y: fromY + (toY - fromY) * easeProgress,
    };
  }

  async animateMove(fromX, fromY, toX, toY) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const animate = (currentTime) => {
        const elapsed  = currentTime - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        const pos = this.calculatePosition(fromX, fromY, toX, toY, progress);
        this.state.player = { x: pos.x, y: pos.y };
        this.emitStateChange();
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.state.player = { x: toX, y: toY };
          this.emitStateChange();
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  checkCollectible(x, y) {
    const idx = this.state.collectibles.findIndex(item => item.x === x && item.y === y);
    if (idx !== -1 && !this.state.collectedItems.some(item => item.x === x && item.y === y)) {
      this.state.collectedItems.push(this.state.collectibles[idx]);
      this.emitMessage(`⭐ Đã thu thập sao tại (${x}, ${y})!`);
    }
  }

  validateMove(newX, newY) {
    if (newX < 0 || newX >= this.state.cols || newY < 0 || newY >= this.state.rows)
      throw new Error("Ra ngoài biên map!");
    if (this.state.obstacles.some(obs => obs.x === newX && obs.y === newY))
      throw new Error("Đụng tường!");
  }

  checkLoopLimit() {
    this.loopIterations++;
    if (this.loopIterations > this.maxLoopIterations)
      throw new Error(`Vòng lặp chạy quá ${this.maxLoopIterations} lần! Kiểm tra lại điều kiện.`);
  }

  // ========== MOVES ==========

  async moveRight(steps = 1) {
    for (let i = 0; i < steps; i++) {
      this.stepCount++;
      if (this.stepCount > this.maxSteps) throw new Error("Quá nhiều bước! Tối đa 200 bước.");
      const x = Math.round(this.state.player.x);
      const y = Math.round(this.state.player.y);
      this.validateMove(x + 1, y);
      await this.animateMove(x, y, x + 1, y);
      this.state.player.x = x + 1;
      this.state.player.y = y;
      this.state.moves++;
      this.checkCollectible(x + 1, y);
      this.emitStateChange();
      await this.sleep(100);
    }
  }

  async moveLeft(steps = 1) {
    for (let i = 0; i < steps; i++) {
      this.stepCount++;
      if (this.stepCount > this.maxSteps) throw new Error("Quá nhiều bước! Tối đa 200 bước.");
      const x = Math.round(this.state.player.x);
      const y = Math.round(this.state.player.y);
      this.validateMove(x - 1, y);
      await this.animateMove(x, y, x - 1, y);
      this.state.player.x = x - 1;
      this.state.player.y = y;
      this.state.moves++;
      this.checkCollectible(x - 1, y);
      this.emitStateChange();
      await this.sleep(100);
    }
  }

  async moveDown(steps = 1) {
    for (let i = 0; i < steps; i++) {
      this.stepCount++;
      if (this.stepCount > this.maxSteps) throw new Error("Quá nhiều bước! Tối đa 200 bước.");
      const x = Math.round(this.state.player.x);
      const y = Math.round(this.state.player.y);
      this.validateMove(x, y + 1);
      await this.animateMove(x, y, x, y + 1);
      this.state.player.x = x;
      this.state.player.y = y + 1;
      this.state.moves++;
      this.checkCollectible(x, y + 1);
      this.emitStateChange();
      await this.sleep(100);
    }
  }

  async moveUp(steps = 1) {
    for (let i = 0; i < steps; i++) {
      this.stepCount++;
      if (this.stepCount > this.maxSteps) throw new Error("Quá nhiều bước! Tối đa 200 bước.");
      const x = Math.round(this.state.player.x);
      const y = Math.round(this.state.player.y);
      this.validateMove(x, y - 1);
      await this.animateMove(x, y, x, y - 1);
      this.state.player.x = x;
      this.state.player.y = y - 1;
      this.state.moves++;
      this.checkCollectible(x, y - 1);
      this.emitStateChange();
      await this.sleep(100);
    }
  }

  // ========== CONDITIONS ==========

  canMoveRight() {
    const x = Math.round(this.state.player.x) + 1;
    const y = Math.round(this.state.player.y);
    return x < this.state.cols && !this.state.obstacles.some(o => o.x === x && o.y === y);
  }

  canMoveLeft() {
    const x = Math.round(this.state.player.x) - 1;
    const y = Math.round(this.state.player.y);
    return x >= 0 && !this.state.obstacles.some(o => o.x === x && o.y === y);
  }

  canMoveDown() {
    const x = Math.round(this.state.player.x);
    const y = Math.round(this.state.player.y) + 1;
    return y < this.state.rows && !this.state.obstacles.some(o => o.x === x && o.y === y);
  }

  canMoveUp() {
    const x = Math.round(this.state.player.x);
    const y = Math.round(this.state.player.y) - 1;
    return y >= 0 && !this.state.obstacles.some(o => o.x === x && o.y === y);
  }

  // ========== WIN CHECK ==========

  checkWin() {
    const x = Math.round(this.state.player.x);
    const y = Math.round(this.state.player.y);
    if (x === this.state.target.x && y === this.state.target.y) {
      if (this.state.collectibles.length > 0 &&
          this.state.collectedItems.length < this.state.collectibles.length) {
        this.emitMessage("⭐ Gần đúng rồi! Nhưng bạn cần thu thập tất cả các sao!");
        return false;
      }
      this.emitMessage("🎉 Hoàn thành! Số bước: " + this.state.moves);
      return true;
    }
    this.emitMessage("❌ Chưa đến đích! Hãy thử lại.");
    return false;
  }

  // ========== EXECUTE USER CODE ==========

  async executeCode(userCode) {
    try {
      this.stepCount = 0;
      this.loopIterations = 0;

      // Moves
      const moveRight = this.moveRight.bind(this);
      const moveLeft  = this.moveLeft.bind(this);
      const moveDown  = this.moveDown.bind(this);
      const moveUp    = this.moveUp.bind(this);

      // Conditions
      const canMoveRight = this.canMoveRight.bind(this);
      const canMoveLeft  = this.canMoveLeft.bind(this);
      const canMoveDown  = this.canMoveDown.bind(this);
      const canMoveUp    = this.canMoveUp.bind(this);

      // Loop guard
      const checkLoopLimit = this.checkLoopLimit.bind(this);

      // Tự động thêm await cho move
      let processedCode = userCode
        .replace(/\bmoveRight\s*\(/g, 'await moveRight(')
        .replace(/\bmoveLeft\s*\(/g,  'await moveLeft(')
        .replace(/\bmoveUp\s*\(/g,    'await moveUp(')
        .replace(/\bmoveDown\s*\(/g,  'await moveDown(');

      // Inject loop guard
      processedCode = processedCode
        .replace(/\bwhile\s*\(\s*([^)]+)\s*\)/g, 'while (checkLoopLimit(), ($1))')
        .replace(/\bfor\s*\(\s*([^;]+);([^;]+);([^)]+)\)/g, 'for (checkLoopLimit(), $1; $2; $3)');

      await eval(`(async () => { ${processedCode} })()`);
      await this.sleep(300);

      return this.checkWin();
    } catch (err) {
      throw err;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getState() {
    return { ...this.state };
  }

  reset(initialState) {
    this.state = { ...initialState };
    this.stepCount = 0;
    this.loopIterations = 0;
    this.emitStateChange();
  }
}

// Helper để tạo grid data
export const generateGridData = (gameState) => {
  if (!gameState) return [];
  const cells = [];
  for (let y = 0; y < gameState.rows; y++) {
    for (let x = 0; x < gameState.cols; x++) {
      const isTarget    = gameState.target.x === x && gameState.target.y === y;
      const isObstacle  = gameState.obstacles.some(obs => obs.x === x && obs.y === y);
      const collectible = gameState.collectibles.find(item => item.x === x && item.y === y);
      const isCollected = gameState.collectedItems.some(item => item.x === x && item.y === y);
      const isPlayer    = Math.round(gameState.player.x) === x && Math.round(gameState.player.y) === y;
      cells.push({
        x, y,
        key: `${x}-${y}`,
        isTarget,
        isObstacle,
        isPlayer,
        collectible: collectible && !isCollected ? collectible : null,
        isCollected,
      });
    }
  }
  return cells;
};