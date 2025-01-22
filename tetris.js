class Tetris {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏配置
        this.blockSize = 30;
        this.gridWidth = 10;
        this.gridHeight = 20;
        
        // 设置画布大小
        this.canvas.width = this.blockSize * this.gridWidth;
        this.canvas.height = this.blockSize * this.gridHeight;
        
        // 游戏状态
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        
        // 方块形状定义
        this.shapes = [
            [[1, 1, 1, 1]], // I
            [[1, 0, 0], [1, 1, 1]], // J
            [[0, 0, 1], [1, 1, 1]], // L
            [[1, 1], [1, 1]], // O
            [[0, 1, 1], [1, 1, 0]], // S
            [[0, 1, 0], [1, 1, 1]], // T
            [[1, 1, 0], [0, 1, 1]] // Z
        ];
        
        // 颜色定义
        this.colors = [
            '#00f0f0', // cyan
            '#0000f0', // blue
            '#f0a000', // orange
            '#f0f000', // yellow
            '#00f000', // green
            '#a000f0', // purple
            '#f00000'  // red
        ];
        
        this.currentPiece = this.newPiece();
        this.dropCounter = 0;
        this.dropInterval = 1000; // 初始下落速度（毫秒）
        
        // 绑定键盘事件
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        
        // 开始游戏循环
        this.lastTime = 0;
        this.animate(0);
    }
    
    newPiece() {
        const shapeIndex = Math.floor(Math.random() * this.shapes.length);
        return {
            shape: this.shapes[shapeIndex],
            color: this.colors[shapeIndex],
            x: Math.floor(this.gridWidth / 2) - Math.floor(this.shapes[shapeIndex][0].length / 2),
            y: 0
        };
    }
    
    draw() {
        // 清空画布
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制当前方块
        this.drawPiece(this.currentPiece);
    }
    
    drawGrid() {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];
                    this.ctx.fillRect(x * this.blockSize, y * this.blockSize, 
                                    this.blockSize - 1, this.blockSize - 1);
                } else {
                    this.ctx.strokeStyle = '#333';
                    this.ctx.strokeRect(x * this.blockSize, y * this.blockSize,
                                      this.blockSize, this.blockSize);
                }
            }
        }
    }
    
    drawPiece(piece) {
        piece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.ctx.fillStyle = piece.color;
                    this.ctx.fillRect((piece.x + x) * this.blockSize,
                                    (piece.y + y) * this.blockSize,
                                    this.blockSize - 1, this.blockSize - 1);
                }
            });
        });
    }
    
    merge() {
        this.currentPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.grid[y + this.currentPiece.y][x + this.currentPiece.x] = 
                        this.currentPiece.color;
                }
            });
        });
    }
    
    rotate(piece) {
        // 矩阵转置
        let newShape = piece.shape[0].map((_, i) =>
            piece.shape.map(row => row[i]).reverse()
        );
        
        const oldShape = piece.shape;
        piece.shape = newShape;
        
        if (this.collision()) {
            piece.shape = oldShape;
        }
    }
    
    collision() {
        const piece = this.currentPiece;
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    // 检查是否到达底部
                    if (y + piece.y >= this.gridHeight) {
                        return true;
                    }
                    // 检查左右边界
                    if (x + piece.x < 0 || x + piece.x >= this.gridWidth) {
                        return true;
                    }
                    // 检查与其他方块的碰撞
                    if (y + piece.y >= 0 && 
                        this.grid[y + piece.y] && 
                        this.grid[y + piece.y][x + piece.x]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    clearLines() {
        let linesCleared = 0;
        outer: for (let y = this.grid.length - 1; y >= 0; y--) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (!this.grid[y][x]) continue outer;
            }
            
            const row = this.grid.splice(y, 1)[0];
            this.grid.unshift(row.fill(0));
            linesCleared++;
            y++;
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            // 更新显示
            document.getElementById('score').textContent = this.score;
            document.getElementById('level').textContent = this.level;
            document.getElementById('lines').textContent = this.lines;
        }
    }
    
    drop() {
        this.currentPiece.y++;
        if (this.collision()) {
            this.currentPiece.y--;
            this.merge();
            this.clearLines();
            this.currentPiece = this.newPiece();
            
            if (this.collision()) {
                this.gameOver = true;
                alert('游戏结束！\n分数：' + this.score);
                this.reset();
            }
        }
        this.dropCounter = 0;
    }
    
    move(dir) {
        this.currentPiece.x += dir;
        if (this.collision()) {
            this.currentPiece.x -= dir;
        }
    }
    
    reset() {
        this.grid = Array(this.gridHeight).fill().map(() => Array(this.gridWidth).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameOver = false;
        this.currentPiece = this.newPiece();
        
        // 重置显示
        document.getElementById('score').textContent = '0';
        document.getElementById('level').textContent = '1';
        document.getElementById('lines').textContent = '0';
    }
    
    handleKeyPress(event) {
        if (!this.gameOver) {
            switch(event.keyCode) {
                case 37: // 左箭头
                    this.move(-1);
                    break;
                case 39: // 右箭头
                    this.move(1);
                    break;
                case 40: // 下箭头
                    this.drop();
                    break;
                case 38: // 上箭头
                    this.rotate(this.currentPiece);
                    break;
                case 32: // 空格
                    while (!this.collision()) {
                        this.currentPiece.y++;
                    }
                    this.currentPiece.y--;
                    this.drop();
                    break;
            }
        }
    }
    
    animate(time = 0) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            this.drop();
        }
        
        this.draw();
        requestAnimationFrame(this.animate.bind(this));
    }
}

// 启动游戏
window.onload = () => {
    new Tetris();
}; 