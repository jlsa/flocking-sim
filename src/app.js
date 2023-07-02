
/**
 * @description This code is based on the flocking simulation code from The Nature of Code by Daniel Shiffman (http://natureofcode.com) and the p5.js flocking example (https://p5js.org/examples/simulate-flocking.html). It simulates the behavior of a flock of birds, where each bird (or "boid") follows three simple rules: alignment, cohesion, and separation. The flocking behavior emerges from the interaction of these individual boids.
 *
 * I, jlsa, have made modifications to the original code to add additional features such as different team colors, an edit mode system, and the ability to spawn and erase boids.
 *
 * @link https://github.com/jlsa/flocking-sim.git
 * @license MIT
 * @version 0.1.0
 * @author jlsa
 **/

const editModes = {
    default: {
        keyBind: 'd',
        value: 'default',
        radius: 50,
        color: { r: 255, g: 215, b: 141, a: 5 }
    },
    spawn: {
        keyBind: 's',
        value: 'spawn',
        radius: 300,
        color: { r: 94, g: 140, b: 102, a: 10 }
    },
    erase: {
        keyBind: 'e',
        value: 'erase',
        radius: 200,
        color: { r: 140, g: 80, b: 94, a: 10 }
    },
    select: {
        keyBind: 'v',
        value: 'select',
        radius: 25,
        color: { r: 164, g: 179, b: 193, a: 10 }
    },
};

let flock;
let paused = false;
let totalTicks = 0;
let showStats = true;
let mouseSpawnColor = -1;
let currentEditMode = editModes.default;

const maxEraseAtOnce = 10;
const maxSpawnAtOnce = 10;
const maxBoids = 250;
const originalLifeSpan = 10_000;//100_000;
const teamColors = [
    { r: 255, g: 0, b: 0, name: 'red' },
    { r: 0, g: 255, b: 0, name: 'green' },
    { r: 0, g: 0, b: 255, name: 'blue' },
    { r: 255, g: 255, b: 0, name: 'yellow' },
    { r: 255, g: 255, b: 255, name: 'white' },
    { r: 255, g: 165, b: 0, name: 'orange' },
    { r: 255, g: 192, b: 203, name: 'pink' },
];

const switchToMode = (mode) => {
    if (! Object.values(editModes).includes(mode)) {
        return;
    }
    if (mode === currentEditMode) {
        return;
    }

    currentEditMode = mode;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function setup() {
    createCanvas(windowWidth, windowHeight);

    flock = new Flock();
    // Add an initial set of boids into the system
    for (let i = 0; i < maxBoids; i++) {
        const spawnX = Math.floor(Math.random() * width);
        const spawnY = Math.floor(Math.random() * height);
        spawnBoids(1, spawnX, spawnY);
    }
    totalTicks = 0;
}

const spawnBoids = (amount, spawnX, spawnY, scatterRadius = 0) => {
    if (scatterRadius > 0) {
        const offsetX = Math.floor(Math.random() * scatterRadius) - Math.floor(scatterRadius / 2);
        const offsetY = Math.floor(Math.random() * scatterRadius) - Math.floor(scatterRadius / 2);
        spawnX += offsetX;
        spawnY += offsetY;
    }
    for (let i = 0; i < amount; i++) {
        flock.addBoid(new Boid(spawnX, spawnY, teamColors[mouseSpawnColor] ?? null));
    }
}

function draw() {
    background(51);
    flock.run();
    renderEditMode();
    renderStats();
}

const renderEditMode = () => {
    strokeWeight(1);
    stroke(currentEditMode.color.r, currentEditMode.color.g, currentEditMode.color.b, Math.max(currentEditMode.color.a * 2, 100));
    fill(currentEditMode.color.r, currentEditMode.color.g, currentEditMode.color.b, currentEditMode.color.a);

    ellipse(mouseX, mouseY, currentEditMode.radius, currentEditMode.radius);
};

const renderStats = () => {
    if (!showStats) {
        return;
    }
    noStroke();
    textSize(18);
    fill(255, 255, 255);

    const messages = [
        'ticks: ' + totalTicks,
        'boids: ' + flock.boids.length,
        'fps: ' + Math.floor(frameRate()),
        'paused: ' + (paused ? 'yes' : 'no'),
        'keybindings:',
        '    pause = p',
        '    stats = h',
        '    spawn = s',
        '    erase = e',
        '    select = v',
        '    default = d',
    ];

    if (currentEditMode === editModes.erase) {
        messages.push('click or drag to erase boids');
    }
    if (currentEditMode === editModes.spawn) {
        messages.push('click to add 10 boids');
        messages.push('drag to add 1 boid');
        messages.push('press 1-7 to toggle spawn colors');
        messages.push('press 0 to random spawn colors');
        const spawnColor = teamColors[mouseSpawnColor] ?? null;
        messages.push('current mouse spawn color: ' + (spawnColor ? spawnColor.name : 'random'));
        messages.push('click or drag to spawn boids');
    }
    if (currentEditMode === editModes.select) {
        messages.push('click to select boids');
        messages.push('selected boids: ' + flock.boids.filter(boid => boid.selected).length);
    }

    const colorsInPlay = flock.boids
    .map(boid => boid.color.name)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => {
        const aCount = flock.boids.filter(boid => boid.color.name === a).length;
        const bCount = flock.boids.filter(boid => boid.color.name === b).length;
        return bCount - aCount;
    });
    messages.push('');
    colorsInPlay.forEach(color => {
        messages.push(color + ': ' + flock.boids.filter(boid => boid.color.name === color).length);
    });

    const oldestBoid = flock.boids.sort((a, b) => a.timeAlive - b.timeAlive).slice(0, 1);

    const oldestBoidInfo = 'Oldest boid: ' + (oldestBoid[0]?.color?.name ?? 'none') + ' ' + oldestBoid[0]?.timeAlive ?? '';
    messages.push(oldestBoidInfo);

    messages.forEach((message, index) => {
        text(message, 10, 30 + (index * 30));
    });
}

// Add a new boid into the System
function mouseDragged() {
    handleMouseInput();
}

function mouseClicked() {
    handleMouseInput();
}

const handleMouseInput = () => {
    if (paused) {
        return;
    }

    handleSelectBoid();
    handleEraseBoids();
    handleSpawnBoids();
}

const handleSelectBoid = () => {
    if (currentEditMode !== editModes.select) {
        return;
    }

    flock.boids.forEach(boid => {
        if (dist(boid.position.x, boid.position.y, mouseX, mouseY) <= editModes.select.radius / 2) {
            boid.select();
        } else {
            if (keyIsDown(SHIFT)) {
                boid.deselect();
            }
        }
    });
}


const handleEraseBoids = () => {
    if (currentEditMode !== editModes.erase) {
        return;
    }

    flock.boids = flock.boids.filter(boid => {
        if (dist(boid.position.x, boid.position.y, mouseX, mouseY) <= editModes.erase.radius / 2) {
            return false;
        }

        return dist(boid.position.x, boid.position.y, mouseX, mouseY) > editModes.erase.radius / 2;
    });
}

const handleSpawnBoids = () => {
    if (currentEditMode !== editModes.spawn) {
        return;
    }

    let diff = maxBoids - flock.boids.length;
    if (diff === 0) {
        flock.boids.sort((a, b) => a.timeAlive - b.timeAlive).reverse().splice(0, maxEraseAtOnce);
    }
    diff = maxBoids - flock.boids.length;
    for (i = 0; i < Math.min(diff, maxSpawnAtOnce); i++) {
        spawnBoids(1, mouseX, mouseY, 300);
    }
}

function keyPressed() {
    Object.entries(editModes).forEach(([mode, value]) => {
        Object.entries(value).forEach(([k, val]) => {
            if (k === 'keyBind' && val === key) {
                switchToMode(editModes[mode]);
            }
        });
    });

    if (key === 'Escape') {
        paused = !paused;
    }
    if (key === 'h') {
        showStats = !showStats;
    }
    if (key === '0') {
        mouseSpawnColor = -1;
    }
    for (let i = 1; i <= 7; i++) {
        if (key === (i).toString()) {
            mouseSpawnColor = i - 1;
        }
    }
}
