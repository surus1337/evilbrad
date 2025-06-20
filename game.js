// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Game state
let gameRunning = false;
let score = 0;
let currentLevel = 1;
let gameOver = false;
let victory = false;
let levelBonus = 0;
let powerUpActive = false;
let powerUpTimer = 0;
let gameOverReason = '';
let screenShake = 0;

// Player (Developer)
const player = {
    x: 500,
    y: 600,
    width: 24,
    height: 24,
    speed: 3,
    baseSpeed: 3,
    coding: false,
    codingProgress: 0,
    currentComputer: null,
    inBreakRoom: false,
    coffeeBoost: 0,
    beingDragged: false,
    draggedTo: null,
    invulnerable: 0
};

// Game objects
let brads = [];
let computers = [];
let walls = [];
let particles = [];
let robot = null;
let customer = null;
let breakRoom = null;
let customerRequirements = [];
let coffees = [];
let productManager = null;
let decorations = [];
let lawyer = null;
let complianceTraps = [];
let soundEffects = [];

// Multiple rooms system
let currentRoom = 'main';
let rooms = {};
let doorways = [];
let roomTransitions = [];

// Input handling
const keys = {};
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') e.preventDefault();
});
document.addEventListener('keyup', (e) => keys[e.key] = false);

// Sound effect text
function createSoundEffect(x, y, text, color, size = 16) {
    soundEffects.push({
        x: x,
        y: y,
        text: text,
        color: color,
        size: size,
        life: 30,
        vy: -2
    });
}

// Initialize level
function initLevel(levelNum) {
    brads = [];
    computers = [];
    walls = [];
    particles = [];
    customerRequirements = [];
    coffees = [];
    decorations = [];
    complianceTraps = [];
    soundEffects = [];
    doorways = [];
    roomTransitions = [];
    player.coding = false;
    player.codingProgress = 0;
    player.currentComputer = null;
    player.inBreakRoom = false;
    player.coffeeBoost = 0;
    player.beingDragged = false;
    player.invulnerable = 0;
    powerUpActive = false;
    powerUpTimer = 0;
    screenShake = 0;
    currentRoom = 'main';
    
    // Create multiple connected office rooms
    createMultiRoomOffice();
    
    // Create break room
    breakRoom = {
        x: 850,
        y: 550,
        width: 130,
        height: 130,
        safeZone: true
    };
    
    // Place computers in a more realistic office layout
    const computerPositions = [
        // Row 1 - Reception area
        { x: 150, y: 150 },
        
        // Row 2 - Main work area
        { x: 250, y: 250 }, { x: 450, y: 250 }, { x: 650, y: 250 },
        
        // Row 3 - Middle cubicles
        { x: 150, y: 400 }, { x: 350, y: 400 }, { x: 550, y: 400 }, { x: 750, y: 400 },
        
        // Row 4 - Back office
        { x: 250, y: 550 }, { x: 450, y: 550 }, { x: 650, y: 550 },
        
        // Conference room area
        { x: 850, y: 250 }, { x: 850, y: 350 }
    ];
    
    // Number of computers based on level - FIXED calculation
    const baseComputers = 3;
    const numComputers = Math.min(baseComputers + levelNum, computerPositions.length);
    
    // Only create the exact number of computers we need
    for (let i = 0; i < numComputers; i++) {
        computers.push({
            x: computerPositions[i].x,
            y: computerPositions[i].y,
            width: 32,
            height: 32,
            codeWritten: 0,
            codeRequired: levelNum === 1 ? 50 : 60 + (levelNum * 15), // More gradual difficulty
            completed: false,
            isRequired: false
        });
    }
    
    // Place coffee machines
    const coffeePositions = [
        { x: 100, y: 300 },
        { x: 500, y: 150 },
        { x: 800, y: 450 },
        { x: 300, y: 500 }
    ];
    
    // Add 2-4 coffee pickups
    const numCoffees = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numCoffees; i++) {
        coffees.push({
            x: coffeePositions[i].x,
            y: coffeePositions[i].y,
            width: 20,
            height: 20,
            collected: false,
            respawnTimer: 0
        });
    }
    
    // Create compliance traps (start from level 3)
    const numTraps = levelNum > 2 ? Math.min(levelNum - 2, 5) : 0;
    for (let i = 0; i < numTraps; i++) {
        complianceTraps.push({
            x: 150 + Math.random() * 700,
            y: 150 + Math.random() * 400,
            width: 40,
            height: 40,
            active: false,
            warmupTimer: 60 + Math.random() * 120,
            activeTimer: 0,
            cooldown: 0
        });
    }
    
    // Create friendly robot
    robot = {
        x: 150,
        y: 100,
        width: 26,
        height: 26,
        targetX: 150,
        targetY: 100,
        distractingBrad: false,
        distractTimer: 0,
        cooldown: 0
    };
    
    // Create Product Manager (randomly appears)
    productManager = {
        x: -50,
        y: 300,
        width: 28,
        height: 28,
        active: false,
        targetBrad: null,
        slowingTimer: 0,
        cooldown: 600 + Math.random() * 600
    };
    
    // Create Lawyer (appears after level 2)
    if (levelNum > 2) {
        lawyer = {
            x: 900,
            y: 400,
            width: 28,
            height: 28,
            targetX: 900,
            targetY: 400,
            hunting: false,
            speed: 1.8,
            cooldown: 0,
            desk: { x: 900, y: 400 }
        };
    } else {
        lawyer = null;
    }
    
    // Create customer (start from level 3 instead of level 2)
    if (levelNum > 2) {
        customer = {
            x: 100,
            y: 80,
            width: 28,
            height: 28,
            hasRequirement: true,
            alive: true,
            deathTimer: 0
        };
        
        // Set customer requirements (fewer to make it achievable)
        const requiredCount = Math.min(1 + Math.floor(levelNum / 2), 3);
        for (let i = 0; i < requiredCount && i < computers.length; i++) {
            computers[i].isRequired = true;
            customerRequirements.push(i);
        }
    } else {
        customer = null;
    }
    
    // Create Brads with adjusted speeds - gentler difficulty curve
    if (levelNum === 1) {
        brads.push(createBrad(300, 300, 1.2, 'smart-patrol', 150));
    } else if (levelNum === 2) {
        // Even gentler - just one Brad with slightly increased stats
        brads.push(createBrad(500, 300, 1.3, 'smart-patrol', 170));
    } else if (levelNum === 3) {
        // Introduce predictive behavior
        brads.push(createBrad(200, 200, 1.4, 'smart-patrol', 180));
        brads.push(createBrad(700, 500, 1.4, 'predictive', 200));
        brads.push(createBrad(500, 350, 1.35, 'smart-patrol', 190));
    } else if (levelNum === 4) {
        // Introduce interceptor behavior
        brads.push(createBrad(150, 150, 1.6, 'interceptor', 240));
        brads.push(createBrad(850, 150, 1.6, 'smart-patrol', 240));
        brads.push(createBrad(150, 550, 1.6, 'predictive', 260));
        brads.push(createBrad(850, 550, 1.5, 'interceptor', 280));
    } else if (levelNum >= 5) {
        // Insanely hard - full chaos
        brads.push(createBrad(150, 150, 2.0, 'interceptor', 320));
        brads.push(createBrad(850, 150, 2.0, 'interceptor', 320));
        brads.push(createBrad(150, 550, 2.0, 'predictive', 340));
        brads.push(createBrad(850, 550, 2.0, 'predictive', 340));
        brads.push(createBrad(500, 350, 2.3, 'mastermind', 400));
    }
    
    // Reset player position
    player.x = 500;
    player.y = 600;
    player.speed = player.baseSpeed;
    
    // Level start message
    createSoundEffect(canvas.width/2, 200, `LEVEL ${levelNum}!`, '#ffd700', 32);
    
    // Debug: Log level details
    console.log(`=== LEVEL ${levelNum} INITIALIZED ===`);
    console.log(`Brads: ${brads.length}`);
    brads.forEach((brad, i) => {
        console.log(`  Brad ${i+1}: speed=${brad.speed}, sight=${brad.sightRange}, behavior=${brad.behavior}`);
    });
    console.log(`Computers: ${computers.length}`);
    console.log(`Compliance traps: ${complianceTraps.length}`);
    console.log(`Customer: ${customer ? 'Yes' : 'No'}`);
}

// Create office layout with elevators to other floors
function createMultiRoomOffice() {
    walls = [];
    
    // Outer walls with elevator gaps
    walls.push({ x: 0, y: 0, width: 1000, height: 20 });
    walls.push({ x: 0, y: 680, width: 400, height: 20 }); // Left part of bottom wall
    walls.push({ x: 600, y: 680, width: 400, height: 20 }); // Right part of bottom wall (elevator gap)
    walls.push({ x: 0, y: 0, width: 20, height: 300 }); // Left wall top
    walls.push({ x: 0, y: 400, width: 20, height: 300 }); // Left wall bottom (elevator gap)
    walls.push({ x: 980, y: 0, width: 20, height: 700 });
    
    // Front door area (gap in top wall)
    walls.push({ x: 20, y: 20, width: 80, height: 60 });
    walls.push({ x: 180, y: 20, width: 820, height: 60 });
    
    // Reception desk
    walls.push({ x: 100, y: 120, width: 200, height: 20 });
    
    // Main office cubicles - improved layout
    // Left cubicle block
    walls.push({ x: 200, y: 200, width: 20, height: 120 });
    walls.push({ x: 200, y: 320, width: 120, height: 20 });
    
    // Middle cubicle block
    walls.push({ x: 400, y: 200, width: 20, height: 120 });
    walls.push({ x: 420, y: 200, width: 180, height: 20 });
    walls.push({ x: 600, y: 200, width: 20, height: 120 });
    
    // Right cubicle block
    walls.push({ x: 700, y: 200, width: 20, height: 120 });
    walls.push({ x: 700, y: 320, width: 120, height: 20 });
    
    // Lower cubicles
    walls.push({ x: 100, y: 450, width: 120, height: 20 });
    walls.push({ x: 300, y: 450, width: 120, height: 20 });
    walls.push({ x: 500, y: 450, width: 120, height: 20 });
    walls.push({ x: 700, y: 450, width: 120, height: 20 });
    
    // Conference room
    walls.push({ x: 800, y: 200, width: 20, height: 200 });
    walls.push({ x: 800, y: 400, width: 100, height: 20 });
    
    // Break room walls - with entrance on the left
    walls.push({ x: 830, y: 530, width: 150, height: 20 }); // Top wall
    walls.push({ x: 830, y: 620, width: 20, height: 60 }); // Left wall bottom part (leaving gap for door)
    walls.push({ x: 830, y: 530, width: 20, height: 40 }); // Left wall top part (leaving gap for door)
    
    // Add decorative elements
    decorations = [
        { type: 'plant', x: 50, y: 150, width: 20, height: 20 },
        { type: 'plant', x: 930, y: 150, width: 20, height: 20 },
        { type: 'plant', x: 350, y: 350, width: 20, height: 20 },
        { type: 'watercooler', x: 750, y: 100, width: 24, height: 30 },
        { type: 'printer', x: 450, y: 100, width: 30, height: 24 }
    ];
    
    // Add elevators/doorways
    doorways.push({
        x: 400,
        y: 680,
        width: 200,
        height: 20,
        type: 'elevator',
        label: 'TO CAFETERIA',
        destination: 'cafeteria',
        color: '#4CAF50'
    });
    
    doorways.push({
        x: 0,
        y: 300,
        width: 20,
        height: 100,
        type: 'elevator',
        label: 'TO EXECUTIVE',
        destination: 'executive',
        color: '#9C27B0'
    });
}

// Create a Brad with specific properties
function createBrad(x, y, speed, behavior, sightRange) {
    return {
        x: x,
        y: y,
        width: 28,
        height: 28,
        speed: speed,
        baseSpeed: speed,
        behavior: behavior,
        state: 'patrol',
        targetX: x,
        targetY: y,
        patrolIndex: 0,
        sightRange: sightRange,
        chaseTimer: 0,
        lastSeen: { x: 0, y: 0 },
        predictedPos: { x: 0, y: 0 },
        distracted: false,
        distractTimer: 0,
        slowed: false,
        slowTimer: 0,
        path: [],
        stuckCounter: 0,
        lastPosition: { x: x, y: y },
        sizeMultiplier: 1,
        growing: false,
        growTimer: 0
    };
}

// Update compliance traps
function updateComplianceTraps() {
    complianceTraps.forEach(trap => {
        if (!trap.active) {
            trap.warmupTimer--;
            if (trap.warmupTimer <= 0) {
                trap.active = true;
                trap.activeTimer = 180 + Math.random() * 120; // 3-5 seconds active
                createSoundEffect(trap.x + 20, trap.y, 'WARNING!', '#ff0000', 20);
                screenShake = 10;
            }
        } else {
            trap.activeTimer--;
            if (trap.activeTimer <= 0) {
                trap.active = false;
                trap.warmupTimer = 300 + Math.random() * 300; // 5-10 seconds cooldown
            }
            
            // Check collisions with trap
            // Player collision
            if (player.invulnerable <= 0 &&
                player.x < trap.x + trap.width &&
                player.x + player.width > trap.x &&
                player.y < trap.y + trap.height &&
                player.y + player.height > trap.y) {
                
                gameOver = true;
                gameOverReason = 'COMPLIANCE VIOLATION!';
                createParticles(player.x + 12, player.y + 12, '#ff0000', 50);
                createSoundEffect(player.x, player.y - 20, 'VIOLATED!', '#ff0000', 24);
            }
            
            // Customer collision
            if (customer && customer.alive &&
                customer.x < trap.x + trap.width &&
                customer.x + customer.width > trap.x &&
                customer.y < trap.y + trap.height &&
                customer.y + customer.height > trap.y) {
                
                customer.alive = false;
                customer.deathTimer = 60;
                createParticles(customer.x + 14, customer.y + 14, '#ff0000', 30);
                createSoundEffect(customer.x, customer.y - 20, 'NO!!!', '#ff0000', 20);
                screenShake = 15;
            }
            
            // Brad collision - makes them bigger!
            brads.forEach(brad => {
                if (brad.x < trap.x + trap.width &&
                    brad.x + brad.width > trap.x &&
                    brad.y < trap.y + trap.height &&
                    brad.y + brad.height > trap.y &&
                    !brad.growing) {
                    
                    brad.growing = true;
                    brad.growTimer = 60;
                    brad.sizeMultiplier = Math.min(brad.sizeMultiplier * 1.3, 2.5);
                    brad.sightRange *= 1.2;
                    brad.speed *= 1.1;
                    createParticles(brad.x + 14, brad.y + 14, '#ff00ff', 20);
                    createSoundEffect(brad.x, brad.y - 20, 'POWER UP!', '#ff00ff', 16);
                }
            });
        }
    });
}

// Update lawyer
function updateLawyer() {
    if (!lawyer || player.beingDragged) return;
    
    lawyer.cooldown--;
    
    // Start hunting when player has enough code
    if (!lawyer.hunting && score > 100 && lawyer.cooldown <= 0) {
        lawyer.hunting = true;
        createSoundEffect(lawyer.x, lawyer.y - 20, 'OBJECTION!', '#ff0000', 20);
    }
    
    if (lawyer.hunting) {
        // Chase player
        moveTowards(lawyer, player.x, player.y, lawyer.speed);
        handleWallCollision(lawyer);
        
        // Catch player
        const dist = Math.sqrt(
            Math.pow(player.x - lawyer.x, 2) + 
            Math.pow(player.y - lawyer.y, 2)
        );
        
        if (dist < 30) {
            // Drag player to desk!
            player.beingDragged = true;
            player.draggedTo = lawyer.desk;
            lawyer.hunting = false;
            lawyer.cooldown = 600; // 10 second cooldown
            createSoundEffect(player.x, player.y - 20, 'SUED!', '#ff0000', 24);
            screenShake = 20;
        }
    } else {
        // Return to desk
        moveTowards(lawyer, lawyer.desk.x, lawyer.desk.y, lawyer.speed * 0.5);
    }
}

// Improved pathfinding for Brad
function findPath(brad, targetX, targetY) {
    const actualSpeed = brad.speed * brad.sizeMultiplier;
    const steps = [
        { x: 0, y: -actualSpeed },
        { x: actualSpeed, y: 0 },
        { x: 0, y: actualSpeed },
        { x: -actualSpeed, y: 0 },
        { x: actualSpeed * 0.7, y: -actualSpeed * 0.7 },
        { x: actualSpeed * 0.7, y: actualSpeed * 0.7 },
        { x: -actualSpeed * 0.7, y: actualSpeed * 0.7 },
        { x: -actualSpeed * 0.7, y: -actualSpeed * 0.7 }
    ];
    
    let bestStep = null;
    let minDistance = Infinity;
    
    steps.forEach(step => {
        const newX = brad.x + step.x;
        const newY = brad.y + step.y;
        
        let hitWall = false;
        const testBrad = { 
            x: newX, 
            y: newY, 
            width: brad.width * brad.sizeMultiplier, 
            height: brad.height * brad.sizeMultiplier 
        };
        
        walls.forEach(wall => {
            if (testBrad.x < wall.x + wall.width &&
                testBrad.x + testBrad.width > wall.x &&
                testBrad.y < wall.y + wall.height &&
                testBrad.y + testBrad.height > wall.y) {
                hitWall = true;
            }
        });
        
        if (!hitWall) {
            const distance = Math.sqrt(Math.pow(targetX - newX, 2) + Math.pow(targetY - newY, 2));
            if (distance < minDistance) {
                minDistance = distance;
                bestStep = step;
            }
        }
    });
    
    if (!bestStep) {
        const randomStep = steps[Math.floor(Math.random() * 4)];
        return { x: brad.x + randomStep.x, y: brad.y + randomStep.y };
    }
    
    return { x: brad.x + bestStep.x, y: brad.y + bestStep.y };
}

// Smarter Brad AI with better pathfinding
function updateBrad(brad) {
    // Update grow animation
    if (brad.growing && brad.growTimer > 0) {
        brad.growTimer--;
        if (brad.growTimer <= 0) {
            brad.growing = false;
        }
    }
    
    // Check if stuck
    if (Math.abs(brad.x - brad.lastPosition.x) < 0.5 && Math.abs(brad.y - brad.lastPosition.y) < 0.5) {
        brad.stuckCounter++;
        if (brad.stuckCounter > 30) {
            brad.x = 100 + Math.random() * 800;
            brad.y = 100 + Math.random() * 500;
            brad.stuckCounter = 0;
        }
    } else {
        brad.stuckCounter = 0;
    }
    brad.lastPosition = { x: brad.x, y: brad.y };
    
    // Check if slowed by Product Manager
    if (brad.slowed && brad.slowTimer > 0) {
        brad.slowTimer--;
        brad.speed = brad.baseSpeed * 0.3;
        if (brad.slowTimer <= 0) {
            brad.slowed = false;
            brad.speed = brad.baseSpeed;
        }
    }
    
    // Check if distracted by robot
    if (brad.distracted && brad.distractTimer > 0) {
        brad.distractTimer--;
        brad.state = 'distracted';
        if (robot) {
            const angle = Math.atan2(robot.y - brad.y, robot.x - brad.x);
            brad.targetX = brad.x + Math.cos(angle) * 50;
            brad.targetY = brad.y + Math.sin(angle) * 50;
        }
        if (brad.distractTimer <= 0) {
            brad.distracted = false;
            brad.state = 'patrol';
        }
        return;
    }
    
    // Check if Brad can see the player
    const dx = player.x - brad.x;
    const dy = player.y - brad.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const canSeePlayer = distance < brad.sightRange && hasLineOfSight(brad, player) && !player.inBreakRoom && !player.beingDragged;
    
    if (canSeePlayer) {
        brad.state = 'chase';
        brad.chaseTimer = 300;
        brad.lastSeen.x = player.x;
        brad.lastSeen.y = player.y;
        
        // Create alert effect
        if (brad.chaseTimer === 300) {
            createSoundEffect(brad.x, brad.y - 30, '!', '#ff0000', 24);
        }
        
        // Predict player movement
        if (brad.behavior === 'predictive' || brad.behavior === 'interceptor' || brad.behavior === 'mastermind') {
            const playerVelX = player.x - brad.lastSeen.x;
            const playerVelY = player.y - brad.lastSeen.y;
            brad.predictedPos.x = player.x + playerVelX * 30;
            brad.predictedPos.y = player.y + playerVelY * 30;
        }
        
        // Alert nearby Brads if mastermind
        if (brad.behavior === 'mastermind') {
            brads.forEach(otherBrad => {
                if (otherBrad !== brad && otherBrad.state !== 'chase') {
                    otherBrad.state = 'chase';
                    otherBrad.chaseTimer = 180;
                    otherBrad.lastSeen.x = player.x;
                    otherBrad.lastSeen.y = player.y;
                    createSoundEffect(otherBrad.x, otherBrad.y - 30, '!', '#ff0000', 20);
                }
            });
        }
    }
    
    // Update based on state
    if (brad.state === 'chase') {
        brad.speed = brad.baseSpeed * 1.3;
        
        let targetPos;
        if (canSeePlayer) {
            if (brad.behavior === 'interceptor' || brad.behavior === 'mastermind') {
                let nearestComputer = null;
                let minDist = Infinity;
                computers.forEach(comp => {
                    if (!comp.completed) {
                        const dist = Math.sqrt(Math.pow(player.x - comp.x, 2) + Math.pow(player.y - comp.y, 2));
                        if (dist < minDist) {
                            minDist = dist;
                            nearestComputer = comp;
                        }
                    }
                });
                
                if (nearestComputer) {
                    targetPos = {
                        x: (player.x + nearestComputer.x) / 2,
                        y: (player.y + nearestComputer.y) / 2
                    };
                } else {
                    targetPos = { x: player.x, y: player.y };
                }
            } else if (brad.behavior === 'predictive') {
                targetPos = brad.predictedPos;
            } else {
                targetPos = { x: player.x, y: player.y };
            }
        } else {
            targetPos = brad.lastSeen;
        }
        
        const nextPos = findPath(brad, targetPos.x, targetPos.y);
        brad.x = nextPos.x;
        brad.y = nextPos.y;
        
        brad.chaseTimer--;
        if (brad.chaseTimer <= 0) {
            brad.state = 'patrol';
            brad.speed = brad.baseSpeed;
        }
    } else {
        brad.speed = brad.baseSpeed;
        
        if (brad.behavior === 'smart-patrol' || brad.behavior === 'interceptor' || brad.behavior === 'mastermind') {
            const patrolPoints = [];
            computers.forEach(comp => {
                if (!comp.completed) {
                    patrolPoints.push({ x: comp.x, y: comp.y });
                }
            });
            
            patrolPoints.push(
                { x: 500, y: 350 }, 
                { x: 150, y: 150 }, 
                { x: 850, y: 150 },
                { x: 150, y: 550 },
                { x: 850, y: 550 }
            );
            
            if (patrolPoints.length > 0) {
                const target = patrolPoints[brad.patrolIndex % patrolPoints.length];
                const nextPos = findPath(brad, target.x, target.y);
                brad.x = nextPos.x;
                brad.y = nextPos.y;
                
                if (Math.abs(brad.x - target.x) < 40 && Math.abs(brad.y - target.y) < 40) {
                    brad.patrolIndex++;
                }
            }
        } else {
            if (Math.abs(brad.x - brad.targetX) < 30 && Math.abs(brad.y - brad.targetY) < 30) {
                brad.targetX = 100 + Math.random() * 800;
                brad.targetY = 100 + Math.random() * 500;
            }
            const nextPos = findPath(brad, brad.targetX, brad.targetY);
            brad.x = nextPos.x;
            brad.y = nextPos.y;
        }
    }
    
    brad.x = Math.max(20, Math.min(canvas.width - brad.width * brad.sizeMultiplier - 20, brad.x));
    brad.y = Math.max(80, Math.min(canvas.height - brad.height * brad.sizeMultiplier - 20, brad.y));
}

// Update Product Manager
function updateProductManager() {
    if (!productManager) return;
    
    productManager.cooldown--;
    
    if (!productManager.active && productManager.cooldown <= 0) {
        productManager.active = true;
        productManager.x = Math.random() < 0.5 ? -50 : canvas.width + 50;
        productManager.y = 100 + Math.random() * 500;
        
        let nearestBrad = null;
        let minDist = Infinity;
        brads.forEach(brad => {
            const dist = Math.sqrt(Math.pow(brad.x - productManager.x, 2) + Math.pow(brad.y - productManager.y, 2));
            if (dist < minDist) {
                minDist = dist;
                nearestBrad = brad;
            }
        });
        
        productManager.targetBrad = nearestBrad;
        productManager.slowingTimer = 180;
        createSoundEffect(productManager.x, productManager.y - 20, 'MEETING!', '#9b59b6', 16);
    }
    
    if (productManager.active && productManager.targetBrad) {
        moveTowards(productManager, productManager.targetBrad.x, productManager.targetBrad.y, 4);
        
        const dist = Math.sqrt(
            Math.pow(productManager.x - productManager.targetBrad.x, 2) + 
            Math.pow(productManager.y - productManager.targetBrad.y, 2)
        );
        
        if (dist < 40) {
            productManager.targetBrad.slowed = true;
            productManager.targetBrad.slowTimer = 180;
            createParticles(productManager.targetBrad.x, productManager.targetBrad.y, '#ff00ff', 15);
            createSoundEffect(productManager.targetBrad.x, productManager.targetBrad.y - 20, 'SLOW!', '#ff00ff', 14);
        }
        
        productManager.slowingTimer--;
        if (productManager.slowingTimer <= 0) {
            productManager.active = false;
            productManager.cooldown = 600 + Math.random() * 600;
            productManager.x = -50;
        }
    }
}

// Update robot behavior
function updateRobot() {
    if (!robot) return;
    
    if (Math.abs(robot.x - robot.targetX) < 20 && Math.abs(robot.y - robot.targetY) < 20) {
        robot.targetX = 100 + Math.random() * 800;
        robot.targetY = 100 + Math.random() * 500;
    }
    
    moveTowards(robot, robot.targetX, robot.targetY, 2);
    handleWallCollision(robot);
    
    const playerDist = Math.sqrt(Math.pow(player.x - robot.x, 2) + Math.pow(player.y - robot.y, 2));
    
    if (playerDist < 60 && robot.cooldown <= 0) {
        let nearestBrad = null;
        let minDist = Infinity;
        
        brads.forEach(brad => {
            if (brad.state === 'chase' && !brad.slowed) {
                const dist = Math.sqrt(Math.pow(brad.x - robot.x, 2) + Math.pow(brad.y - robot.y, 2));
                if (dist < minDist && dist < 200) {
                    minDist = dist;
                    nearestBrad = brad;
                }
            }
        });
        
        if (nearestBrad) {
            robot.distractingBrad = true;
            robot.distractTimer = 120;
            robot.cooldown = 300;
            
            nearestBrad.distracted = true;
            nearestBrad.distractTimer = 120;
            
            createParticles(robot.x, robot.y, '#ffff00', 10);
            createSoundEffect(robot.x, robot.y - 20, 'BEEP!', '#3498db', 16);
        }
    }
    
    if (robot.cooldown > 0) robot.cooldown--;
    if (robot.distractTimer > 0) {
        robot.distractTimer--;
        if (robot.distractTimer <= 0) {
            robot.distractingBrad = false;
        }
    }
}

// Update customer
function updateCustomer() {
    if (!customer) return;
    
    if (customer.alive) {
        let requirementsMet = true;
        customerRequirements.forEach(idx => {
            if (idx < computers.length && !computers[idx].completed) {
                requirementsMet = false;
            }
        });
        
        if (requirementsMet && customer.hasRequirement) {
            customer.hasRequirement = false;
            score += 200;
            createParticles(customer.x, customer.y, '#ffd700', 20);
            createSoundEffect(customer.x, customer.y - 20, '+200!', '#ffd700', 20);
        }
    } else if (customer.deathTimer > 0) {
        customer.deathTimer--;
    }
}

// Move entity towards target
function moveTowards(entity, targetX, targetY, customSpeed) {
    const speed = customSpeed || entity.speed;
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        entity.x += (dx / distance) * speed;
        entity.y += (dy / distance) * speed;
    }
}

// Check line of sight
function hasLineOfSight(from, to) {
    const steps = 20;
    const dx = (to.x - from.x) / steps;
    const dy = (to.y - from.y) / steps;
    
    for (let i = 0; i < steps; i++) {
        const checkX = from.x + dx * i;
        const checkY = from.y + dy * i;
        
        for (let wall of walls) {
            if (checkX > wall.x && checkX < wall.x + wall.width &&
                checkY > wall.y && checkY < wall.y + wall.height) {
                return false;
            }
        }
    }
    return true;
}

// Handle wall collisions
function handleWallCollision(entity) {
    walls.forEach(wall => {
        if (entity.x < wall.x + wall.width &&
            entity.x + entity.width > wall.x &&
            entity.y < wall.y + wall.height &&
            entity.y + entity.height > wall.y) {
            
            const overlapX = Math.min(entity.x + entity.width - wall.x, wall.x + wall.width - entity.x);
            const overlapY = Math.min(entity.y + entity.height - wall.y, wall.y + wall.height - entity.y);
            
            if (overlapX < overlapY) {
                if (entity.x < wall.x) {
                    entity.x = wall.x - entity.width;
                } else {
                    entity.x = wall.x + wall.width;
                }
            } else {
                if (entity.y < wall.y) {
                    entity.y = wall.y - entity.height;
                } else {
                    entity.y = wall.y + wall.height;
                }
            }
        }
    });
}

// Create particles
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: color,
            life: 30
        });
    }
}

// Update game
function update() {
    if (!gameRunning || gameOver || victory) return;
    
    // Update screen shake
    if (screenShake > 0) screenShake--;
    
    // Update invulnerability
    if (player.invulnerable > 0) player.invulnerable--;
    
    // Handle being dragged by lawyer
    if (player.beingDragged && player.draggedTo) {
        moveTowards(player, player.draggedTo.x, player.draggedTo.y, 8);
        const dist = Math.sqrt(
            Math.pow(player.x - player.draggedTo.x, 2) + 
            Math.pow(player.y - player.draggedTo.y, 2)
        );
        
        if (dist < 20) {
            // Take away half the code!
            const codeLost = Math.floor(score * 0.5);
            score = Math.max(0, score - codeLost);
            player.beingDragged = false;
            player.invulnerable = 120; // 2 seconds invulnerability
            createSoundEffect(player.x, player.y - 20, `-${codeLost}!`, '#ff0000', 24);
            createParticles(player.x, player.y, '#ff0000', 30);
        }
        return; // Skip other updates while being dragged
    }
    
    // Update power-ups
    if (powerUpActive && powerUpTimer > 0) {
        powerUpTimer--;
        player.speed = player.baseSpeed * 1.5;
        if (powerUpTimer <= 0) {
            powerUpActive = false;
            player.speed = player.baseSpeed;
        }
    }
    
    // Update coffee boost
    if (player.coffeeBoost > 0) {
        player.coffeeBoost--;
        player.speed = player.baseSpeed * 1.8;
    } else if (!powerUpActive) {
        player.speed = player.baseSpeed;
    }
    
    // Check if in break room
    player.inBreakRoom = (player.x > breakRoom.x && 
                         player.x < breakRoom.x + breakRoom.width &&
                         player.y > breakRoom.y && 
                         player.y < breakRoom.y + breakRoom.height);
    
    // Lose code in break room
    if (player.inBreakRoom && score > 0) {
        score -= 0.5;
        if (Math.random() < 0.1) {
            createParticles(player.x, player.y, '#ff6b6b', 1);
        }
    }
    
    // Check doorway transitions
    doorways.forEach(door => {
        if (player.x < door.x + door.width &&
            player.x + player.width > door.x &&
            player.y < door.y + door.height &&
            player.y + player.height > door.y) {
            
            // Show transition message instead of actually changing rooms for now
            createSoundEffect(canvas.width/2, 200, `${door.destination.toUpperCase()} COMING SOON!`, door.color, 20);
            
            // Push player away from doorway
            if (door.width > door.height) {
                // Horizontal doorway
                player.y = door.y < canvas.height/2 ? door.y + door.height + 5 : door.y - player.height - 5;
            } else {
                // Vertical doorway
                player.x = door.x < canvas.width/2 ? door.x + door.width + 5 : door.x - player.width - 5;
            }
        }
    });
    
    // Player movement
    let moveX = 0, moveY = 0;
    
    if (!player.coding && !player.beingDragged) {
        if (keys['ArrowLeft']) moveX = -player.speed;
        if (keys['ArrowRight']) moveX = player.speed;
        if (keys['ArrowUp']) moveY = -player.speed;
        if (keys['ArrowDown']) moveY = player.speed;
        
        if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.707;
            moveY *= 0.707;
        }
        
        player.x += moveX;
        player.y += moveY;
        
        handleWallCollision(player);
    }
    
    // Check coffee collection
    coffees.forEach((coffee, index) => {
        if (!coffee.collected &&
            player.x < coffee.x + coffee.width &&
            player.x + player.width > coffee.x &&
            player.y < coffee.y + coffee.height &&
            player.y + player.height > coffee.y) {
            
            coffee.collected = true;
            coffee.respawnTimer = 600; // Respawn after 10 seconds
            player.coffeeBoost = 300;
            createParticles(coffee.x, coffee.y, '#8B4513', 10);
            createSoundEffect(coffee.x, coffee.y - 20, 'CAFFEINE!', '#8B4513', 16);
        }
        
        // Respawn coffee
        if (coffee.collected && coffee.respawnTimer > 0) {
            coffee.respawnTimer--;
            if (coffee.respawnTimer <= 0) {
                coffee.collected = false;
            }
        }
    });
    
    // Check computer interaction
    let nearComputer = null;
    computers.forEach(computer => {
        if (!computer.completed &&
            Math.abs(player.x - computer.x) < 40 &&
            Math.abs(player.y - computer.y) < 40) {
            nearComputer = computer;
        }
    });
    
    if (nearComputer && keys[' ']) {
        player.coding = true;
        player.currentComputer = nearComputer;
    } else if (!keys[' ']) {
        player.coding = false;
        player.currentComputer = null;
    }
    
    // Update coding progress
    if (player.coding && player.currentComputer) {
        const codeSpeed = currentLevel === 1 ? 4 : 2;
        player.currentComputer.codeWritten += codeSpeed;
        score += codeSpeed;
        
        if (Math.random() < 0.3) {
            createParticles(
                player.currentComputer.x + 16,
                player.currentComputer.y,
                player.currentComputer.isRequired ? '#ffd700' : '#00ff00',
                2
            );
        }
        
        if (player.currentComputer.codeWritten >= player.currentComputer.codeRequired) {
            player.currentComputer.completed = true;
            createParticles(player.currentComputer.x + 16, player.currentComputer.y + 16, '#00ffff', 20);
            createSoundEffect(player.currentComputer.x, player.currentComputer.y - 20, 'DONE!', '#00ff00', 16);
        }
    }
    
    // Update entities
    brads.forEach(brad => updateBrad(brad));
    updateRobot();
    updateCustomer();
    updateProductManager();
    updateLawyer();
    updateComplianceTraps();
    
    // Update sound effects
    soundEffects.forEach((effect, index) => {
        effect.y += effect.vy;
        effect.life--;
        if (effect.life <= 0) {
            soundEffects.splice(index, 1);
        }
    });
    
    // Check Brad collisions (not in break room)
    if (!player.inBreakRoom && player.invulnerable <= 0) {
        brads.forEach(brad => {
            const bradWidth = brad.width * brad.sizeMultiplier;
            const bradHeight = brad.height * brad.sizeMultiplier;
            
            if (player.x < brad.x + bradWidth &&
                player.x + player.width > brad.x &&
                player.y < brad.y + bradHeight &&
                player.y + player.height > brad.y) {
                
                gameOver = true;
                gameOverReason = 'CAUGHT BY BRAD!';
                createParticles(player.x + 12, player.y + 12, '#ff0000', 30);
                createSoundEffect(player.x, player.y - 20, 'BUSTED!', '#ff0000', 24);
            }
        });
    }
    
    // Update particles
    particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.3;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(index, 1);
        }
    });
    
    // Check level completion - FIXED
    let levelComplete = false;
    
    if (customer && customer.hasRequirement) {
        // Must complete customer requirements
        levelComplete = customerRequirements.length > 0 && 
                       customerRequirements.every(idx => idx < computers.length && computers[idx].completed);
    } else {
        // Must complete ALL computers in the level
        levelComplete = computers.length > 0 && computers.every(computer => computer.completed);
    }
    
    if (levelComplete) {
        if (currentLevel >= 5) {
            victory = true;
            score += 1000;
            createSoundEffect(canvas.width/2, canvas.height/2 - 100, 'VICTORY!', '#ffd700', 48);
        } else {
            levelBonus = 100 * currentLevel;
            score += levelBonus;
            
            powerUpActive = true;
            powerUpTimer = 300;
            
            createSoundEffect(canvas.width/2, canvas.height/2, `LEVEL ${currentLevel} COMPLETE!`, '#00ff00', 32);
            createSoundEffect(canvas.width/2, canvas.height/2 + 40, `+${levelBonus} BONUS!`, '#ffd700', 24);
            
            // Delay before next level
            setTimeout(() => {
                currentLevel++;
                initLevel(currentLevel);
            }, 2000);
            
            for (let i = 0; i < 50; i++) {
                createParticles(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height,
                    ['#ffd700', '#00ff00', '#00ffff'][Math.floor(Math.random() * 3)],
                    1
                );
            }
        }
    }
    
    // Update UI
    document.getElementById('score').textContent = Math.floor(score);
    document.getElementById('level').textContent = currentLevel;
    
    let status = 'Ready to Code!';
    if (player.inBreakRoom) status = 'In Break Room (losing code!)';
    else if (player.coding) status = 'Writing Code...';
    else if (player.beingDragged) status = 'Being sued!';
    else if (nearComputer) status = 'Press SPACE to code';
    else if (brads.some(brad => brad.state === 'chase')) status = 'RUN! Brad sees you!';
    else if (customer && customer.hasRequirement) status = 'Complete customer requirements!';
    else if (powerUpActive) status = 'SPEED BOOST ACTIVE!';
    else if (player.coffeeBoost > 0) status = 'COFFEE RUSH!';
    else if (lawyer && lawyer.hunting) status = 'LAWYER INCOMING!';
    
    document.getElementById('status').textContent = status;
}

// Draw everything with improved graphics
function draw() {
    // Apply screen shake
    ctx.save();
    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake;
        const shakeY = (Math.random() - 0.5) * screenShake;
        ctx.translate(shakeX, shakeY);
    }
    
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw office floor with carpet pattern
    ctx.fillStyle = '#d0d0d0';
    for (let x = 0; x < canvas.width; x += 50) {
        for (let y = 0; y < canvas.height; y += 50) {
            if ((x / 50 + y / 50) % 2 === 0) {
                ctx.fillRect(x, y, 50, 50);
            }
        }
    }
    
    // Draw compliance traps
    complianceTraps.forEach(trap => {
        if (trap.active) {
            // Danger zone
            const pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
            ctx.fillStyle = `rgba(255, 0, 0, ${0.3 * pulse})`;
            ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
            
            // Warning stripes
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            for (let i = 0; i < trap.width; i += 10) {
                ctx.beginPath();
                ctx.moveTo(trap.x + i, trap.y);
                ctx.lineTo(trap.x + i + 5, trap.y + trap.height);
                ctx.stroke();
            }
            
            // Warning sign
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(trap.x + 10, trap.y + 10, 20, 20);
            ctx.fillStyle = '#000';
            ctx.font = '16px Arial';
            ctx.fillText('!', trap.x + 18, trap.y + 26);
        } else if (trap.warmupTimer < 60) {
            // Warning before activation
            ctx.strokeStyle = '#ff8800';
            ctx.lineWidth = 2;
            ctx.strokeRect(trap.x, trap.y, trap.width, trap.height);
        }
    });
    
    // Draw front door area
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(100, 20, 80, 60);
    ctx.fillStyle = '#654321';
    ctx.fillRect(110, 30, 60, 50);
    ctx.fillStyle = '#000';
    ctx.font = '10px "Press Start 2P"';
    ctx.fillText('ENTRANCE', 105, 55);
    
    // Draw break room
    if (breakRoom) {
        ctx.fillStyle = '#98D8C8';
        ctx.fillRect(breakRoom.x, breakRoom.y, breakRoom.width, breakRoom.height);
        
        ctx.fillStyle = '#7FCDCD';
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.fillRect(
                    breakRoom.x + 10 + i * 40,
                    breakRoom.y + 10 + j * 40,
                    30, 30
                );
            }
        }
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('BREAK', breakRoom.x + breakRoom.width/2, breakRoom.y + breakRoom.height/2 - 5);
        ctx.fillText('ROOM', breakRoom.x + breakRoom.width/2, breakRoom.y + breakRoom.height/2 + 10);
        ctx.textAlign = 'left';
    }
    
    // Draw walls with better style
    walls.forEach(wall => {
        ctx.fillStyle = '#666';
        ctx.fillRect(wall.x + 2, wall.y + 2, wall.width, wall.height);
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        
        ctx.fillStyle = '#34495e';
        ctx.fillRect(wall.x, wall.y, wall.width, Math.min(3, wall.height));
        ctx.fillRect(wall.x, wall.y, Math.min(3, wall.width), wall.height);
    });
    
    // Draw decorations
    decorations.forEach(deco => {
        if (deco.type === 'plant') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(deco.x + 2, deco.y + 10, deco.width - 4, deco.height - 10);
            
            ctx.fillStyle = '#228B22';
            ctx.fillRect(deco.x + 4, deco.y, deco.width - 8, 12);
            ctx.fillRect(deco.x + 2, deco.y + 2, deco.width - 4, 8);
        } else if (deco.type === 'watercooler') {
            ctx.fillStyle = '#4682B4';
            ctx.fillRect(deco.x, deco.y + 10, deco.width, deco.height - 10);
            
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(deco.x + 4, deco.y, deco.width - 8, 12);
        } else if (deco.type === 'printer') {
            ctx.fillStyle = '#696969';
            ctx.fillRect(deco.x, deco.y, deco.width, deco.height);
            ctx.fillStyle = '#D3D3D3';
            ctx.fillRect(deco.x + 2, deco.y + 2, deco.width - 4, deco.height - 4);
        }
    });
    
    // Draw doorways/elevators
    doorways.forEach(door => {
        // Draw glowing effect
        const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        ctx.fillStyle = door.color + '40';
        ctx.fillRect(door.x - 5, door.y - 5, door.width + 10, door.height + 10);
        
        // Draw doorway
        ctx.fillStyle = door.color;
        ctx.fillRect(door.x, door.y, door.width, door.height);
        
        // Draw darker center
        ctx.fillStyle = '#000';
        ctx.fillRect(door.x + 5, door.y + 5, door.width - 10, door.height - 10);
        
        // Draw label
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        
        if (door.width > door.height) {
            // Horizontal doorway
            ctx.fillText(door.label, door.x + door.width/2, door.y + door.height/2 + 3);
        } else {
            // Vertical doorway - rotate text
            ctx.translate(door.x + door.width/2, door.y + door.height/2);
            ctx.rotate(-Math.PI/2);
            ctx.fillText(door.label, 0, 3);
        }
        ctx.restore();
    });
    
    // Draw coffee pickups
    coffees.forEach(coffee => {
        if (!coffee.collected) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(coffee.x, coffee.y, coffee.width, coffee.height);
            
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(coffee.x + 2, coffee.y + 2, coffee.width - 4, coffee.height - 6);
            
            ctx.fillStyle = '#ddd';
            const steamOffset = Math.sin(Date.now() * 0.003) * 2;
            ctx.fillRect(coffee.x + coffee.width/2 - 1 + steamOffset, coffee.y - 5, 2, 5);
            ctx.fillRect(coffee.x + coffee.width/2 + 3 + steamOffset, coffee.y - 3, 2, 3);
        }
    });
    
    // Draw computers with better graphics
    computers.forEach(computer => {
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(computer.x - 6, computer.y - 6, computer.width + 12, computer.height + 12);
        
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(computer.x - 4, computer.y - 4, computer.width + 8, computer.height + 8);
        
        if (computer.isRequired && !computer.completed) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3;
            ctx.strokeRect(computer.x - 8, computer.y - 8, computer.width + 16, computer.height + 16);
        }
        
        ctx.fillStyle = '#000';
        ctx.fillRect(computer.x + computer.width/2 - 4, computer.y + computer.height - 8, 8, 8);
        
        ctx.fillStyle = computer.completed ? '#2ecc71' : (computer.isRequired ? '#f39c12' : '#3498db');
        ctx.fillRect(computer.x, computer.y, computer.width, computer.height - 8);
        
        if (!computer.completed) {
            ctx.fillStyle = '#000';
            ctx.fillRect(computer.x + 2, computer.y + 2, computer.width - 4, computer.height - 12);
            
            ctx.fillStyle = '#0f0';
            ctx.font = '6px monospace';
            for (let i = 0; i < 3; i++) {
                ctx.fillText('> code...', computer.x + 4, computer.y + 8 + i * 6);
            }
        } else {
            ctx.fillStyle = '#fff';
            ctx.fillRect(computer.x + 12, computer.y + 8, 8, 2);
            ctx.fillRect(computer.x + 8, computer.y + 12, 8, 2);
        }
        
        if (computer.codeWritten > 0 && !computer.completed) {
            ctx.fillStyle = '#000';
            ctx.fillRect(computer.x, computer.y + computer.height - 10, computer.width, 4);
            ctx.fillStyle = '#2ecc71';
            const progress = computer.codeWritten / computer.codeRequired;
            ctx.fillRect(computer.x, computer.y + computer.height - 10, computer.width * progress, 4);
        }
        
        ctx.fillStyle = '#333';
        ctx.fillRect(computer.x + 2, computer.y + computer.height - 4, computer.width - 4, 4);
    });
    
    // Draw robot
    if (robot) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(robot.x + 2, robot.y + robot.height - 2, robot.width - 4, 4);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(robot.x, robot.y + robot.height - 6, 6, 6);
        ctx.fillRect(robot.x + robot.width - 6, robot.y + robot.height - 6, 6, 6);
        
        ctx.fillStyle = robot.distractingBrad ? '#f39c12' : '#3498db';
        ctx.fillRect(robot.x + 2, robot.y + 6, robot.width - 4, robot.height - 12);
        
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(robot.x + 4, robot.y, robot.width - 8, 10);
        
        ctx.fillStyle = robot.distractingBrad ? '#e74c3c' : '#2c3e50';
        const eyeBlink = Math.sin(Date.now() * 0.002) > 0.9 ? 0 : 4;
        ctx.fillRect(robot.x + 6, robot.y + 3, 4, eyeBlink);
        ctx.fillRect(robot.x + robot.width - 10, robot.y + 3, 4, eyeBlink);
        
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(robot.x + robot.width/2 - 1, robot.y - 4, 2, 4);
        
        if (robot.distractingBrad) {
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(robot.x + robot.width/2, robot.y - 6, 5 + Math.sin(Date.now() * 0.01) * 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // Draw Product Manager
    if (productManager && productManager.active) {
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(productManager.x + 2, productManager.y + 10, productManager.width - 4, productManager.height - 10);
        
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(productManager.x + 4, productManager.y, productManager.width - 8, 12);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(productManager.x + 5, productManager.y + 4, 5, 3);
        ctx.fillRect(productManager.x + productManager.width - 10, productManager.y + 4, 5, 3);
        ctx.fillRect(productManager.x + 10, productManager.y + 5, 8, 1);
        
        ctx.fillStyle = '#8B6914';
        ctx.fillRect(productManager.x - 4, productManager.y + 12, 8, 10);
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(productManager.x + productManager.width, productManager.y - 10, 60, 20);
        ctx.fillStyle = '#000';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('STATUS?', productManager.x + productManager.width + 5, productManager.y + 2);
    }
    
    // Draw customer
    if (customer && customer.alive) {
        ctx.fillStyle = customer.hasRequirement ? '#c0392b' : '#27ae60';
        ctx.fillRect(customer.x + 2, customer.y + 10, customer.width - 4, customer.height - 10);
        
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(customer.x + 4, customer.y, customer.width - 8, 12);
        
        ctx.fillStyle = '#000';
        if (customer.hasRequirement) {
            ctx.fillRect(customer.x + 6, customer.y + 4, 4, 2);
            ctx.fillRect(customer.x + customer.width - 10, customer.y + 4, 4, 2);
            ctx.fillRect(customer.x + 8, customer.y + 8, customer.width - 16, 2);
        } else {
            ctx.fillRect(customer.x + 6, customer.y + 4, 4, 3);
            ctx.fillRect(customer.x + customer.width - 10, customer.y + 4, 4, 3);
            ctx.fillRect(customer.x + 8, customer.y + 7, 2, 2);
            ctx.fillRect(customer.x + 10, customer.y + 8, customer.width - 20, 2);
            ctx.fillRect(customer.x + customer.width - 10, customer.y + 7, 2, 2);
        }
        
        if (customer.hasRequirement) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText('!', customer.x + customer.width + 5, customer.y + 10);
        }
    } else if (customer && !customer.alive && customer.deathTimer > 0) {
        ctx.fillStyle = '#666';
        ctx.fillRect(customer.x + 2, customer.y + 10, customer.width - 4, customer.height - 10);
        ctx.fillStyle = '#999';
        ctx.fillRect(customer.x + 4, customer.y, customer.width - 8, 12);
        ctx.fillStyle = '#000';
        ctx.font = '10px Arial';
        ctx.fillText('X', customer.x + 5, customer.y + 9);
        ctx.fillText('X', customer.x + customer.width - 12, customer.y + 9);
    }
    
    // Draw developer (player)
    if (!gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(player.x + 2, player.y + player.height - 2, player.width - 4, 4);
        
        ctx.fillStyle = player.inBreakRoom ? '#95a5a6' : (player.beingDragged ? '#ff6666' : '#3498db');
        ctx.fillRect(player.x + 4, player.y + 8, player.width - 8, player.height - 8);
        
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(player.x + 6, player.y, player.width - 12, 10);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(player.x + 6, player.y, player.width - 12, 3);
        
        ctx.fillRect(player.x + 4, player.y + 3, 6, 3);
        ctx.fillRect(player.x + 14, player.y + 3, 6, 3);
        ctx.fillRect(player.x + 10, player.y + 4, 4, 1);
        
        if (player.coding) {
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(player.x + player.width/2, player.y + player.height/2, 20, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = '#2ecc71';
            ctx.font = '8px monospace';
            const typeText = ['<>', '{}', '[]', '()'][Math.floor(Date.now() / 200) % 4];
            ctx.fillText(typeText, player.x + player.width + 5, player.y + player.height/2);
        }
    }
    
    // Draw Brads with better graphics
    brads.forEach(brad => {
        const scale = brad.sizeMultiplier;
        const width = brad.width * scale;
        const height = brad.height * scale;
        
        ctx.save();
        if (brad.growing) {
            ctx.translate(brad.x + width/2, brad.y + height/2);
            ctx.scale(scale, scale);
            ctx.translate(-(brad.x + width/2), -(brad.y + height/2));
        }
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(brad.x + 2, brad.y + height - 2, width - 4, 4);
        
        // Body (suit)
        ctx.fillStyle = brad.state === 'chase' ? '#8B0000' : 
                       brad.state === 'distracted' ? '#CD853F' : 
                       brad.slowed ? '#696969' : '#2F4F4F';
        ctx.fillRect(brad.x + 2, brad.y + 10, width - 4, height - 10);
        
        // Tie
        ctx.fillStyle = brad.state === 'chase' ? '#FF0000' : '#DC143C';
        ctx.fillRect(brad.x + width/2 - 2, brad.y + 10, 4, 8);
        
        // Face/Head
        ctx.fillStyle = '#FDBCB4';
        ctx.fillRect(brad.x + 4, brad.y + 2, width - 8, 10);
        
        // Hair (slicked back)
        ctx.fillStyle = '#2F1B14';
        ctx.fillRect(brad.x + 4, brad.y, width - 8, 4);
        ctx.fillRect(brad.x + 2, brad.y + 1, width - 4, 2);
        
        // Eyes (angry)
        ctx.fillStyle = brad.state === 'chase' ? '#FF0000' : '#000';
        ctx.fillRect(brad.x + 6, brad.y + 5, 3, 2);
        ctx.fillRect(brad.x + width - 9, brad.y + 5, 3, 2);
        
        // Angry eyebrows
        ctx.fillStyle = '#000';
        ctx.fillRect(brad.x + 5, brad.y + 4, 4, 1);
        ctx.fillRect(brad.x + width - 9, brad.y + 4, 4, 1);
        
        // Mouth (frown or shouting)
        if (brad.state === 'chase') {
            ctx.fillStyle = '#000';
            ctx.fillRect(brad.x + width/2 - 3, brad.y + 8, 6, 2);
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(brad.x + width/2 - 2, brad.y + 8, 4, 1);
        }
        
        ctx.restore();
        
        if (brad.state === 'chase') {
            ctx.strokeStyle = 'rgba(231, 76, 60, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(brad.x + width/2, brad.y + height/2, brad.sightRange, 0, Math.PI * 2);
            ctx.stroke();
            
            const angle = Math.atan2(player.y - brad.y, player.x - brad.x);
            ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
            ctx.beginPath();
            ctx.moveTo(brad.x + width/2, brad.y + height/2);
            ctx.arc(brad.x + width/2, brad.y + height/2, brad.sightRange, 
                   angle - 0.5, angle + 0.5);
            ctx.closePath();
            ctx.fill();
        }
        
        if (brad.state === 'distracted') {
            ctx.fillStyle = '#f39c12';
            ctx.font = '12px "Press Start 2P"';
            ctx.fillText('?', brad.x + width/2 - 4, brad.y - 5);
        } else if (brad.slowed) {
            ctx.fillStyle = '#9b59b6';
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText('ZZZ', brad.x + width/2 - 10, brad.y - 5);
        }
        
        if (brad.sizeMultiplier > 1.5) {
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(brad.x + width/2, brad.y + height/2, width/2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (brad.growing) {
            ctx.restore();
        }
    });
    
    // Draw particles
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 40;
        ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
    });
    ctx.globalAlpha = 1;
    
    // Draw sound effects
    soundEffects.forEach(effect => {
        ctx.fillStyle = effect.color;
        ctx.globalAlpha = effect.life / 30;
        ctx.font = `${effect.size}px "Press Start 2P"`;
        ctx.textAlign = 'center';
        ctx.fillText(effect.text, effect.x, effect.y);
        ctx.textAlign = 'left';
    });
    ctx.globalAlpha = 1;
    
    // Draw current area indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(canvas.width - 200, 10, 190, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'right';
    ctx.fillText('FLOOR 1: MAIN', canvas.width - 20, 28);
    ctx.textAlign = 'left';
    
    // Draw game over screen
    if (gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#e74c3c';
        ctx.font = '36px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(gameOverReason, canvas.width/2, canvas.height/2 - 40);
        
        ctx.fillStyle = '#fff';
        ctx.font = '16px "Press Start 2P"';
        ctx.fillText('He made you attend a', canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('3-hour status meeting!', canvas.width/2, canvas.height/2 + 50);
        
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText(`Lines of code: ${Math.floor(score)}`, canvas.width/2, canvas.height/2 + 100);
        ctx.textAlign = 'left';
    }
    
    // Draw victory screen
    if (victory) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#2ecc71';
        ctx.font = '36px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2 - 40);
        
        ctx.fillStyle = '#fff';
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText('You survived all 5 levels!', canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Brad gave up and went golfing!', canvas.width/2, canvas.height/2 + 50);
        
        ctx.font = '12px "Press Start 2P"';
        ctx.fillText(`Total lines of code: ${Math.floor(score)}`, canvas.width/2, canvas.height/2 + 100);
        ctx.textAlign = 'left';
    }
    
    ctx.restore();
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    gameRunning = true;
    gameOver = false;
    victory = false;
    score = 0;
    currentLevel = 1;
    levelBonus = 0;
    gameOverReason = '';
    initLevel(currentLevel);
    document.getElementById('startButton').textContent = 'Restart';
}

// Button handler
document.getElementById('startButton').addEventListener('click', startGame);

// Start game loop
gameLoop(); 