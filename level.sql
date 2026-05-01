INSERT INTO learning_levels (level_number, title, description, grid_data, initial_code, is_published) VALUES

(1,
'Bước đầu tiên',
'Chào mừng bạn! Hãy di chuyển nhân vật sang phải để đến đích. Dùng lệnh moveRight() để đi sang phải.',
'{
  "rows": 1,
  "cols": 5,
  "player": { "x": 0, "y": 0 },
  "target": { "x": 4, "y": 0 },
  "obstacles": [],
  "hints": ["Dùng moveRight() để đi sang phải", "Bạn cần đi 4 bước để tới đích"],
  "solution_steps": 4,
  "allowed_commands": ["moveRight"]
}',
'// Di chuyển nhân vật sang phải để đến ô đích ★\n// Dùng lệnh: moveRight()\n\n',
TRUE),

(2,
'Bốn hướng di chuyển',
'Tuyệt vời! Bây giờ bạn sẽ học thêm 3 hướng còn lại: trái, lên, xuống. Hãy đưa nhân vật vòng qua chướng ngại vật để tới đích.',
'{
  "rows": 3,
  "cols": 5,
  "player": { "x": 0, "y": 1 },
  "target": { "x": 4, "y": 1 },
  "obstacles": [
    { "x": 2, "y": 1 }
  ],
  "hints": [
    "Có vật cản chặn đường thẳng!",
    "Hãy đi lên (moveUp) hoặc xuống (moveDown) để tránh",
    "Dùng moveRight() để tiến về phía trước"
  ],
  "solution_steps": 6,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"]
}',
'// Bạn có 4 lệnh di chuyển:\n//   moveRight() → sang phải\n//   moveLeft()  → sang trái\n//   moveUp()    → lên trên\n//   moveDown()  → xuống dưới\n\n// Có vật cản ở giữa đường, hãy tìm đường vòng!\n\n',
TRUE),

(3,
'Tìm đường đi',
'Giờ thử thách hơn rồi! Kết hợp cả 4 hướng để dẫn nhân vật vượt qua chướng ngại vật và đến đích.',
'{
  "rows": 3,
  "cols": 4,
  "player": { "x": 0, "y": 2 },
  "target": { "x": 3, "y": 0 },
  "obstacles": [
    { "x": 1, "y": 2 },
    { "x": 1, "y": 1 },
    { "x": 2, "y": 1 }
  ],
  "hints": [
    "Không thể đi thẳng, hãy tìm đường vòng",
    "Thử đi lên trước, rồi sang phải"
  ],
  "solution_steps": 5,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"]
}',
'// Kết hợp các lệnh di chuyển để tìm đường:\n//   moveRight() → sang phải\n//   moveLeft()  → sang trái\n//   moveUp()    → lên trên\n//   moveDown()  → xuống dưới\n\n',
TRUE);
INSERT INTO learning_levels (level_number, title, description, grid_data, initial_code, is_published) VALUES

-- ═══════════════════════════════════════════
-- LEVEL 4: Giới thiệu hằng số
-- ═══════════════════════════════════════════
(4,
'Hằng số là gì?',
'Thay vì viết số trực tiếp vào lệnh, bạn có thể đặt tên cho nó bằng hằng số. Dùng const để khai báo và truyền vào hàm di chuyển.',
'{
  "rows": 1,
  "cols": 6,
  "player": { "x": 0, "y": 0 },
  "target": { "x": 5, "y": 0 },
  "obstacles": [],
  "hints": [
    "Khai báo: const steps = 5;",
    "Sau đó dùng: moveRight(steps)",
    "Hằng số giúp code dễ đọc và dễ thay đổi hơn"
  ],
  "solution_steps": 5,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["const"]
}',
'// Hằng số (const) giúp đặt tên cho một giá trị cố định\n// Khai báo:  const tên = giá_trị;\n// Sử dụng:   moveRight(tên);\n\n// Khai báo hằng số rồi dùng để di chuyển đến đích!\nconst steps = ;\nmoveRight(steps);\n',
TRUE),

-- ═══════════════════════════════════════════
-- LEVEL 5: Nhiều hằng số, nhiều hướng
-- ═══════════════════════════════════════════
(5,
'Nhiều hằng số',
'Bạn có thể khai báo nhiều hằng số khác nhau cho từng hướng di chuyển. Hãy dùng chúng để đưa nhân vật đến đích theo đúng số bước.',
'{
  "rows": 4,
  "cols": 5,
  "player": { "x": 0, "y": 3 },
  "target": { "x": 4, "y": 0 },
  "obstacles": [
    { "x": 2, "y": 3 },
    { "x": 2, "y": 2 },
    { "x": 2, "y": 1 }
  ],
  "hints": [
    "Cần đi sang phải, lên trên theo từng đoạn",
    "Khai báo: const right1 = 2; const up = 3; const right2 = 2;",
    "Mỗi hằng số tương ứng với một đoạn đường"
  ],
  "solution_steps": 7,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["const", "multiple_constants"]
}',
'// Khai báo nhiều hằng số cho từng đoạn đường\n// Gợi ý: chia hành trình thành từng đoạn nhỏ\n\nconst right1 = ;\nconst up     = ;\nconst right2 = ;\n\nmoveRight(right1);\nmoveUp(up);\nmoveRight(right2);\n',
TRUE),

-- ═══════════════════════════════════════════
-- LEVEL 6: Tính toán với hằng số
-- ═══════════════════════════════════════════
(6,
'Tính toán với hằng số',
'Hằng số không chỉ là số cố định — bạn còn có thể dùng phép tính để tạo ra giá trị mới từ chúng. Hãy hoàn thành màn chơi bằng cách tính đúng số bước cần đi.',
'{
  "rows": 4,
  "cols": 6,
  "player": { "x": 0, "y": 3 },
  "target": { "x": 5, "y": 1 },
  "obstacles": [
    { "x": 1, "y": 3 },
    { "x": 3, "y": 2 },
    { "x": 3, "y": 1 }
  ],
  "hints": [
    "Dùng phép tính: const total = a + b;",
    "Ví dụ: const cols = 6; const start = 1; const steps = cols - start;",
    "Tính toán bước đi thay vì đếm tay"
  ],
  "solution_steps": 8,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["const", "arithmetic", "expression"]
}',
'// Bạn có thể tính toán với hằng số:\n//   const a = 3;\n//   const b = 2;\n//   const total = a + b;  // total = 5\n//   moveRight(total);\n\nconst gridCols  = 6;\nconst startX    = 0;\nconst targetX   = 5;\n\n// Tính số bước cần đi sang phải (đoạn 1)\nconst rightSteps1 = ;\n\n// Tính số bước lên trên\nconst upSteps = ;\n\n// Tính số bước sang phải (đoạn 2)\nconst rightSteps2 = ;\n\nmoveRight(rightSteps1);\nmoveUp(upSteps);\nmoveRight(rightSteps2);\n',
TRUE);
INSERT INTO learning_levels (level_number, title, description, grid_data, initial_code, is_published) VALUES

-- ═══════════════════════════════════════════
-- LEVEL 7: Giới thiệu biến số (let)
-- ═══════════════════════════════════════════
(7,
'Biến số là gì?',
'Khác với hằng số (const) không thể thay đổi, biến số (let) có thể được gán lại giá trị mới. Hãy thay đổi biến để điều khiển nhân vật đi đúng hướng.',
'{
  "rows": 3,
  "cols": 5,
  "player": { "x": 0, "y": 1 },
  "target": { "x": 4, "y": 1 },
  "obstacles": [
    { "x": 2, "y": 1 }
  ],
  "hints": [
    "Khai báo biến: let steps = 2;",
    "Dùng biến: moveRight(steps);",
    "Gán lại: steps = 1; rồi dùng lại moveRight(steps);",
    "Biến có thể thay đổi giá trị bất kỳ lúc nào!"
  ],
  "solution_steps": 5,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["let", "reassign"]
}',
'// Biến số dùng từ khóa let, có thể thay đổi giá trị:\n//   let steps = 2;      // khai báo\n//   moveRight(steps);   // đi phải 2 bước\n//   steps = 1;          // gán lại giá trị mới\n//   moveRight(steps);   // đi phải 1 bước\n\nlet steps = ;\nmoveRight(steps);\nmoveUp(1);\n\nsteps = ;           // gán lại\nmoveRight(steps);\nmoveDown(1);\n',
TRUE),

-- ═══════════════════════════════════════════
-- LEVEL 8: Thay đổi biến theo từng bước
-- ═══════════════════════════════════════════
(8,
'Biến thay đổi theo hành trình',
'Biến số trở nên mạnh mẽ khi bạn cập nhật nó dọc theo hành trình. Thay đổi giá trị biến để điều hướng nhân vật qua mê cung phức tạp hơn.',
'{
  "rows": 5,
  "cols": 6,
  "player": { "x": 0, "y": 4 },
  "target": { "x": 5, "y": 0 },
  "obstacles": [
    { "x": 2, "y": 4 },
    { "x": 2, "y": 3 },
    { "x": 2, "y": 2 },
    { "x": 4, "y": 2 },
    { "x": 4, "y": 1 },
    { "x": 4, "y": 0 }
  ],
  "hints": [
    "Chia hành trình thành 3 đoạn",
    "Mỗi đoạn gán lại biến steps với giá trị phù hợp",
    "Đoạn 1: đi phải rồi lên. Đoạn 2: đi phải rồi lên. Đoạn 3: đi phải"
  ],
  "solution_steps": 11,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["let", "reassign", "multi_segment"]
}',
'// Dùng một biến duy nhất, thay đổi giá trị qua từng đoạn\nlet steps;\n\n// Đoạn 1\nsteps = ;\nmoveRight(steps);\nsteps = ;\nmoveUp(steps);\n\n// Đoạn 2\nsteps = ;\nmoveRight(steps);\nsteps = ;\nmoveUp(steps);\n\n// Đoạn 3\nsteps = ;\nmoveRight(steps);\n',
TRUE),

-- ═══════════════════════════════════════════
-- LEVEL 9: Cập nhật biến bằng phép tính
-- ═══════════════════════════════════════════
(9,
'Tính toán để cập nhật biến',
'Bạn có thể cập nhật biến bằng cách tính toán từ chính giá trị hiện tại của nó. Dùng steps = steps + 1 hoặc steps += 1 để tăng dần số bước di chuyển.',
'{
  "rows": 5,
  "cols": 6,
  "player": { "x": 0, "y": 4 },
  "target": { "x": 5, "y": 0 },
  "obstacles": [
    { "x": 1, "y": 3 },
    { "x": 3, "y": 2 },
    { "x": 5, "y": 3 },
    { "x": 5, "y": 2 },
    { "x": 5, "y": 1 }
  ],
  "hints": [
    "Bắt đầu với steps = 1",
    "Sau mỗi đoạn, tăng thêm: steps = steps + 1 hoặc steps += 1",
    "Đoạn 1 đi 1 bước, đoạn 2 đi 2 bước, đoạn 3 đi 3 bước..."
  ],
  "solution_steps": 10,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["let", "update_expression", "increment", "compound_assignment"]
}',
'// Cập nhật biến từ chính nó:\n//   steps = steps + 1;   // tăng thêm 1\n//   steps += 2;          // tăng thêm 2 (viết tắt)\n//   steps -= 1;          // giảm đi 1\n\nlet steps = 1;\n\n// Đoạn 1 — đi steps bước\nmoveRight(steps);\nmoveUp(steps);\n\n// Tăng biến lên rồi dùng tiếp\nsteps += ;\nmoveRight(steps);\nmoveUp(steps);\n\n// Tăng thêm một lần nữa\nsteps += ;\nmoveRight(steps);\n',
TRUE);
INSERT INTO learning_levels (level_number, title, description, grid_data, initial_code, is_published) VALUES

-- ═══════════════════════════════════════════
-- LEVEL 10: Giới thiệu câu lệnh if
-- ═══════════════════════════════════════════
(10,
'Nếu thì...',
'Câu lệnh if cho phép thực hiện hành động chỉ khi điều kiện đúng. Hãy dùng if để quyết định nhân vật có nên rẽ hay không.',
'{
  "rows": 3,
  "cols": 5,
  "player": { "x": 0, "y": 1 },
  "target": { "x": 4, "y": 1 },
  "obstacles": [
    { "x": 2, "y": 1 }
  ],
  "hints": [
    "Đường thẳng bị chặn ở cột số 2",
    "Dùng if để kiểm tra xem có cần rẽ không",
    "Nếu hasObstacle là true thì rẽ xuống, đi qua, rồi lên lại"
  ],
  "solution_steps": 6,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["if", "boolean", "condition"]
}',
'// Câu lệnh if chỉ chạy khi điều kiện là true:\n//   if (điều_kiện) {\n//       // thực hiện nếu đúng\n//   }\n\nconst hasObstacle = true;   // có vật cản trên đường thẳng\n\nmoveRight(2);\n\nif (hasObstacle) {\n    moveDown( );\n    moveRight( );\n    moveUp( );\n}\n\nmoveRight( );\n',
TRUE),

-- ═══════════════════════════════════════════
-- LEVEL 11: if / else — rẽ hai hướng
-- ═══════════════════════════════════════════
(11,
'Nếu không thì...',
'Thay vì chỉ xử lý khi điều kiện đúng, if...else còn xử lý cả khi điều kiện sai. Hãy chọn hướng đi dựa trên giá trị biến.',
'{
  "rows": 5,
  "cols": 6,
  "player": { "x": 0, "y": 2 },
  "target": { "x": 5, "y": 2 },
  "obstacles": [
    { "x": 2, "y": 2 },
    { "x": 2, "y": 1 },
    { "x": 2, "y": 0 }
  ],
  "hints": [
    "Vật cản chặn cả đường thẳng lẫn phía trên",
    "canGoUp là false vì phía trên bị chặn",
    "Dùng if...else để chọn đi lên hay đi xuống"
  ],
  "solution_steps": 8,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["if", "else", "two_branches"]
}',
'// if...else xử lý cả hai trường hợp:\n//   if (điều_kiện) {\n//       // chạy khi ĐÚNG\n//   } else {\n//       // chạy khi SAI\n//   }\n\nconst canGoUp = false;   // phía trên bị chặn\n\nmoveRight(2);\n\nif (canGoUp) {\n    moveUp( );\n    moveRight( );\n    moveDown( );\n} else {\n    moveDown( );\n    moveRight( );\n    moveUp( );\n}\n\nmoveRight( );\n',
TRUE),

-- ═══════════════════════════════════════════
-- LEVEL 12: if / else if / else — nhiều nhánh
-- ═══════════════════════════════════════════
(12,
'Nhiều điều kiện',
'Khi có nhiều tình huống, dùng if...else if...else để kiểm tra lần lượt. Chỉ một nhánh được chạy — nhánh đầu tiên có điều kiện đúng.',
'{
  "rows": 5,
  "cols": 7,
  "player": { "x": 0, "y": 2 },
  "target": { "x": 6, "y": 2 },
  "obstacles": [
    { "x": 2, "y": 2 },
    { "x": 2, "y": 1 },
    { "x": 4, "y": 2 },
    { "x": 4, "y": 3 },
    { "x": 4, "y": 4 }
  ],
  "hints": [
    "Có 2 chướng ngại vật ở hai vị trí khác nhau",
    "Chướng ngại 1 tại cột 2: chỉ rẽ được lên",
    "Chướng ngại 2 tại cột 4: chỉ rẽ được xuống",
    "Dùng else if để phân biệt từng đoạn đường"
  ],
  "solution_steps": 12,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["if", "else_if", "else", "multi_branch"]
}',
'// Nhiều nhánh điều kiện:\n//   if (đk_1)        { ... }\n//   else if (đk_2)  { ... }\n//   else            { ... }\n\nconst obstacle1 = "up";    // vật cản 1: chỉ rẽ được lên\nconst obstacle2 = "down";  // vật cản 2: chỉ rẽ được xuống\n\n// Đoạn 1 — gặp chướng ngại 1\nmoveRight(2);\nif (obstacle1 === "up") {\n    moveUp( );\n    moveRight( );\n    moveDown( );\n} else if (obstacle1 === "down") {\n    moveDown( );\n    moveRight( );\n    moveUp( );\n}\n\n// Đoạn 2 — gặp chướng ngại 2\nif (obstacle2 === "up") {\n    moveUp( );\n    moveRight( );\n    moveDown( );\n} else if (obstacle2 === "down") {\n    moveDown( );\n    moveRight( );\n    moveUp( );\n} else {\n    moveRight( );\n}\n\nmoveRight( );\n',
TRUE);
INSERT INTO learning_levels (level_number, title, description, grid_data, initial_code, is_published) VALUES

-- ═══════════════════════════════════════════
-- LEVEL 13: Giới thiệu vòng lặp while
-- ═══════════════════════════════════════════
(13,
'Lặp trong khi...',
'Vòng lặp while thực hiện một hành động liên tục chừng nào điều kiện còn đúng. Hãy dùng while để đi đến đích mà không cần viết từng lệnh một.',
'{
  "rows": 1,
  "cols": 6,
  "player": { "x": 0, "y": 0 },
  "target": { "x": 5, "y": 0 },
  "obstacles": [],
  "hints": [
    "Thay vì viết moveRight() 5 lần...",
    "Dùng while (steps > 0) để lặp lại",
    "Mỗi vòng lặp nhớ giảm biến steps đi 1: steps = steps - 1"
  ],
  "solution_steps": 5,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["while", "counter", "decrement"]
}',
'// Vòng lặp while chạy liên tục khi điều kiện còn true:\n//   while (điều_kiện) {\n//       // thực hiện\n//   }\n\n// Dùng biến đếm để kiểm soát số vòng lặp\nlet steps = 5;\n\nwhile (steps > 0) {\n    moveRight( );\n    steps = steps - ;\n}\n',
TRUE),

-- ═══════════════════════════════════════════
-- LEVEL 14: while kết hợp nhiều hướng
-- ═══════════════════════════════════════════
(14,
'Vòng lặp nhiều hướng',
'Vòng lặp while không chỉ dùng cho một hướng. Hãy dùng nhiều vòng lặp liên tiếp để điều hướng nhân vật qua chướng ngại vật.',
'{
  "rows": 4,
  "cols": 6,
  "player": { "x": 0, "y": 3 },
  "target": { "x": 5, "y": 0 },
  "obstacles": [
    { "x": 2, "y": 3 },
    { "x": 2, "y": 2 },
    { "x": 4, "y": 1 },
    { "x": 4, "y": 0 }
  ],
  "hints": [
    "Chia hành trình thành nhiều đoạn",
    "Mỗi đoạn dùng một vòng while riêng",
    "Đoạn 1: đi phải 2. Đoạn 2: lên 3. Đoạn 3: phải 2. Đoạn 4: lên 1. Đoạn 5: phải 1"
  ],
  "solution_steps": 9,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["while", "counter", "multi_loop", "decrement"]
}',
'// Dùng nhiều vòng while cho từng đoạn đường\nlet steps;\n\n// Đoạn 1: đi sang phải\nsteps = ;\nwhile (steps > 0) {\n    moveRight(1);\n    steps = steps - 1;\n}\n\n// Đoạn 2: đi lên\nsteps = ;\nwhile (steps > 0) {\n    moveUp(1);\n    steps = steps - 1;\n}\n\n// Đoạn 3: đi sang phải\nsteps = ;\nwhile (steps > 0) {\n    moveRight(1);\n    steps = steps - 1;\n}\n\n// Đoạn 4: đi lên\nsteps = ;\nwhile (steps > 0) {\n    moveUp(1);\n    steps = steps - 1;\n}\n\n// Đoạn 5: đi sang phải\nsteps = ;\nwhile (steps > 0) {\n    moveRight(1);\n    steps = steps - 1;\n}\n',
TRUE),

-- ═══════════════════════════════════════════
-- LEVEL 15: while kết hợp if bên trong
-- ═══════════════════════════════════════════
(15,
'Điều kiện trong vòng lặp',
'Vòng lặp while và câu lệnh if có thể kết hợp với nhau. Bên trong mỗi vòng lặp, dùng if để quyết định đi theo hướng nào tùy theo vị trí hiện tại.',
'{
  "rows": 4,
  "cols": 7,
  "player": { "x": 0, "y": 3 },
  "target": { "x": 6, "y": 0 },
  "obstacles": [
    { "x": 1, "y": 3 },
    { "x": 3, "y": 2 },
    { "x": 3, "y": 1 },
    { "x": 5, "y": 1 },
    { "x": 5, "y": 0 }
  ],
  "hints": [
    "Dùng biến position để theo dõi đang ở đoạn nào",
    "Mỗi vòng lặp kiểm tra position để chọn hướng đi",
    "Khi position === 1: đi lên. Khi position === 2: đi phải. Cứ thế luân phiên"
  ],
  "solution_steps": 13,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["while", "if", "nested", "position_tracking"]
}',
'// while + if kết hợp: quyết định hướng đi trong từng vòng lặp\n\nlet totalMoves = 13;\nlet position = 0;   // theo dõi đang ở đoạn nào\n\n// Đoạn 1: lên 3 bước\nlet up1 = ;\nwhile (up1 > 0) {\n    moveUp(1);\n    up1 = up1 - 1;\n}\n\n// Đoạn 2: phải rồi lên xen kẽ tùy đoạn\nlet segment = 4;   // còn 4 đoạn tiếp theo\nposition = 1;\n\nwhile (segment > 0) {\n    if (position === 1) {\n        moveRight( );\n    } else if (position === 2) {\n        moveUp( );\n    } else if (position === 3) {\n        moveRight( );\n    } else {\n        moveUp( );\n    }\n    position = position + 1;\n    segment = segment - 1;\n}\n\n// Đoạn cuối: phải đến đích\nlet right = ;\nwhile (right > 0) {\n    moveRight(1);\n    right = right - 1;\n}\n',
TRUE);
INSERT INTO learning_levels (level_number, title, description, grid_data, initial_code, is_published) VALUES

-- ═══════════════════════════════════════════
-- LEVEL 16: Giới thiệu vòng lặp for
-- ═══════════════════════════════════════════
(16,
'Vòng lặp for',
'Vòng lặp for gọn hơn while vì nó gộp khai báo biến, điều kiện và cập nhật vào một dòng. Hãy dùng for để đi đến đích.',
'{
  "rows": 1,
  "cols": 7,
  "player": { "x": 0, "y": 0 },
  "target": { "x": 6, "y": 0 },
  "obstacles": [],
  "hints": [
    "Cú pháp: for (let i = 0; i < số_bước; i++)",
    "i++ là cách viết tắt của i = i + 1",
    "Vòng for tự tăng biến i mỗi vòng, không cần tự viết"
  ],
  "solution_steps": 6,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["for", "i++", "loop_counter"]
}',
'// Vòng lặp for gộn gàng hơn while:\n//   for (let i = 0; i < n; i++) {\n//       // thực hiện n lần\n//   }\n//\n// Gồm 3 phần:\n//   let i = 0   → khởi tạo biến đếm\n//   i < n       → điều kiện dừng\n//   i++         → tăng biến sau mỗi vòng\n\nfor (let i = 0; i < ; i++) {\n    moveRight(1);\n}\n',
TRUE),

-- ═══════════════════════════════════════════
-- LEVEL 17: for nhiều đoạn đường
-- ═══════════════════════════════════════════
(17,
'Nhiều vòng for',
'Giống như while, bạn có thể dùng nhiều vòng for liên tiếp cho từng đoạn đường. Mỗi vòng for kiểm soát một hướng di chuyển riêng.',
'{
  "rows": 5,
  "cols": 6,
  "player": { "x": 0, "y": 4 },
  "target": { "x": 5, "y": 0 },
  "obstacles": [
    { "x": 2, "y": 4 },
    { "x": 2, "y": 3 },
    { "x": 2, "y": 2 },
    { "x": 4, "y": 2 },
    { "x": 4, "y": 1 }
  ],
  "hints": [
    "Chia hành trình thành 5 đoạn",
    "Mỗi đoạn dùng một vòng for riêng",
    "Đoạn 1: phải 2. Đoạn 2: lên 4. Đoạn 3: phải 2. Đoạn 4: lên 1. Đoạn 5: phải 1"
  ],
  "solution_steps": 10,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["for", "multi_loop", "i++"]
}',
'// Dùng nhiều vòng for cho từng đoạn đường\n// Điền số lần lặp thích hợp vào mỗi vòng\n\n// Đoạn 1: đi sang phải\nfor (let i = 0; i < ; i++) {\n    moveRight(1);\n}\n\n// Đoạn 2: đi lên\nfor (let i = 0; i < ; i++) {\n    moveUp(1);\n}\n\n// Đoạn 3: đi sang phải\nfor (let i = 0; i < ; i++) {\n    moveRight(1);\n}\n\n// Đoạn 4: đi lên\nfor (let i = 0; i < ; i++) {\n    moveUp(1);\n}\n\n// Đoạn 5: đi sang phải\nfor (let i = 0; i < ; i++) {\n    moveRight(1);\n}\n',
TRUE),

-- ═══════════════════════════════════════════
-- LEVEL 18: Dùng biến i trong thân vòng lặp
-- ═══════════════════════════════════════════
(18,
'Dùng biến đếm i',
'Biến i trong vòng for không chỉ để đếm — bạn có thể dùng giá trị của i để tính số bước di chuyển. Mỗi vòng lặp i có giá trị khác nhau!',
'{
  "rows": 5,
  "cols": 7,
  "player": { "x": 0, "y": 4 },
  "target": { "x": 6, "y": 0 },
  "obstacles": [
    { "x": 1, "y": 4 },
    { "x": 1, "y": 3 },
    { "x": 3, "y": 3 },
    { "x": 3, "y": 2 },
    { "x": 3, "y": 1 },
    { "x": 5, "y": 2 },
    { "x": 5, "y": 1 },
    { "x": 5, "y": 0 }
  ],
  "hints": [
    "i bắt đầu từ 1, mỗi vòng tăng thêm 1",
    "Vòng 1: i=1 → moveRight(1) rồi moveUp(1)",
    "Vòng 2: i=2 → moveRight(2) rồi moveUp(2) — nhưng chỉ di chuyển lên 1 thôi",
    "Dùng i làm số bước sang phải, còn lên luôn là 1 bước mỗi tầng"
  ],
  "solution_steps": 12,
  "allowed_commands": ["moveRight", "moveLeft", "moveUp", "moveDown"],
  "concepts": ["for", "use_i", "i_as_steps", "i++"]
}',
'// Dùng giá trị i bên trong thân vòng lặp:\n//   for (let i = 1; i <= 3; i++) {\n//       moveRight(i);   // vòng 1: đi 1, vòng 2: đi 2, vòng 3: đi 3\n//   }\n\n// Hành trình chia thành 3 tầng, mỗi tầng đi phải i bước rồi lên 1\nfor (let i = 1; i <= ; i++) {\n    moveRight(i);\n    moveUp( );\n}\n\n// Đến đích — còn thiếu mấy bước phải?\nfor (let i = 0; i < ; i++) {\n    moveRight(1);\n}\n',
TRUE);