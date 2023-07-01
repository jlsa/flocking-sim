// Based on code from
// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com
// found on p5js website
// https://p5js.org/examples/simulate-flocking.html

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
    if (mode === currentEditMode) {
        return;
    }

    // TODO check if mode is valid
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

class Flock {
    constructor() {
        this.boids = [];
    }

    run = () => {
        this.boids = this.boids.filter(boid => boid.lifeSpan > 0);
        this.boids.forEach(boid => boid.run(this.boids));
        totalTicks++;
    };

    addBoid = boid => {
        this.boids.push(boid);
    };
}

class Boid {
    constructor(x, y, teamColor = null) {
        this.acceleration = createVector(0, 0);
        this.velocity = createVector(random(-1, 1), random(-1, 1));
        this.position = createVector(x, y);
        this.r = Math.floor(Math.random() * 1.0) + 3.0; // 3.0;
        this.maxspeed = Math.floor(Math.random() * 4) + 1;    // Maximum speed
        this.maxforce = 0.05; // Maximum steering force
        this.color = teamColor ?? teamColors[Math.floor(Math.random() * teamColors.length)];
        this.lifeSpan = originalLifeSpan;
        this.originalColor = Object.assign({}, this.color);
        this.timeAlive = 0;
        this.selected = false;
    }

    run = boids => {
        if (!paused) {
            this.flock(boids);
            this.update(boids);
            this.borders();
        }
        this.render();
    }

    applyForce = force => {
        // We could add mass here if we want A = F / M
        this.acceleration.add(force);
    }

    // We accumulate a new acceleration each time based on three rules
    flock = boids => {
        let sep = this.separate(boids);   // Separation
        let ali = this.align(boids);      // Alignment
        let coh = this.cohesion(boids);   // Cohesion
        // Arbitrarily weight these forces
        sep.mult(1.5);
        ali.mult(1.0);
        coh.mult(1.0);
        // Add the force vectors to acceleration
        this.applyForce(sep);
        this.applyForce(ali);
        this.applyForce(coh);
    }

    // Method to update location
    update = boids => {
        this.doAge(boids);
        this.colorAlignment(boids);
        // Update velocity
        this.velocity.add(this.acceleration);
        // Limit speed
        this.velocity.limit(this.maxspeed);
        this.position.add(this.velocity);
        // Reset accelertion to 0 each cycle
        this.acceleration.mult(0);
    }

    // A method that calculates and applies a steering force towards a target
    // STEER = DESIRED MINUS VELOCITY
    seek = target => {
        let desired = p5.Vector.sub(target, this.position);  // A vector pointing from the location to the target
        // Normalize desired and scale to maximum speed
        desired.normalize();
        desired.mult(this.maxspeed);
        // Steering = Desired minus Velocity
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxforce);  // Limit to maximum steering force

        return steer;
    }

    render = () => {
        // Draw a triangle rotated in the direction of velocity
        let theta = this.velocity.heading() + radians(90);
        fill(this.color.r, this.color.g, this.color.b);
        strokeWeight(3);
        if (this.selected) {
            stroke(255, 255, 255, 100);
        } else {
            stroke(this.color.r, this.color.g, this.color.b);
        }
        push();
        translate(this.position.x, this.position.y);
        rotate(theta);

        if (this.selected) {
            scale(2);
        }
        beginShape();
        vertex(0, -this.r * 2);
        vertex(-this.r, this.r * 2);
        vertex(this.r, this.r * 2);
        endShape(CLOSE);
        pop();
    }

    // Wraparound
    borders = () => {
        if (this.position.x < -this.r) {
            this.position.x = width + this.r;
        }
        if (this.position.y < -this.r) {
            this.position.y = height + this.r;
        }
        if (this.position.x > width + this.r) {
            this.position.x = -this.r;
        }
        if (this.position.y > height + this.r) {
            this.position.y = -this.r;
        }
    }

    // Separation
    // Method checks for nearby boids and steers away
    separate = boids => {
        let desiredSeparation = 25.0;
        let steer = createVector(0, 0);
        let count = 0;

        // For every boid in the system, check if it's too close
        boids.forEach(boid => {
            let d = p5.Vector.dist(this.position, boid.position);
            // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
            if ((d > 0) && (d < desiredSeparation)) {
                // Calculate vector pointing away from neighbor
                let diff = p5.Vector.sub(this.position, boid.position);
                diff.normalize();
                diff.div(d);        // Weight by distance
                steer.add(diff);
                count++;            // Keep track of how many
            }
        });

        // Average -- divide by how many
        if (count > 0) {
            steer.div(count);
        }

        // As long as the vector is greater than 0
        if (steer.mag() > 0) {
            // Implement Reynolds: Steering = Desired - Velocity
            steer.normalize();
            steer.mult(this.maxspeed);
            steer.sub(this.velocity);
            steer.limit(this.maxforce);
        }

        return steer;
    }

    // Alignment
    // For every nearby boid in the system, calculate the average velocity
    align = boids => {
        let neighborDist = 50;
        let sum = createVector(0,0);
        let count = 0;
        boids.forEach(boid => {
            let d = p5.Vector.dist(this.position, boid.position);
            if ((d > 0) && (d < neighborDist)) {
                sum.add(boid.velocity);
                count++;
            }
        });

        if (count > 0) {
            sum.div(count);
            sum.normalize();
            sum.mult(this.maxspeed);
            let steer = p5.Vector.sub(sum, this.velocity);
            steer.limit(this.maxforce);

            return steer;
        } else {
            return createVector(0, 0);
        }
    }

    doAge = boids => {
        this.timeAlive++;
        let neighborDist = 80;
        let count = 0;
        let agePerTick = 10;
        boids.forEach(boid => {
            let d = p5.Vector.dist(this.position, boid.position);
            if ((d > 0) && (d < neighborDist)) {
                count++;
            }
        });

        if (count == 0) {
            // only age it when there are no neighbors
            this.lifeSpan -= Math.floor(Math.random() * agePerTick);
        } else {
            // slightly improve lifespan when there are neighbors
            this.lifeSpan += Math.floor(Math.random() * agePerTick / 5);
        }
    }

    // ColorAlignment
    // For every nearby boid in the system, calculate the average color and set it as the boid color
    colorAlignment = boids => {
        let neighborDist = 50;
        let count = 0;
        let neighorColors = [];
        boids.forEach(boid => {
            let d = p5.Vector.dist(this.position, boid.position);
            if ((d > 0) && (d < neighborDist)) {
                neighorColors.push(boid.color);
                count++;
            }
        });

        if (count > 0) {
            if (neighorColors.length > 0) {
                // count which color is most common
                let colorCounts = {};
                neighorColors.forEach(color => {
                    if (! colorCounts[color.name]) {
                        colorCounts[color.name] = 0;
                    }
                    colorCounts[color.name]++;
                });
                // select the most common color
                let mostCommonColor = null;
                let mostCommonColorCount = 0;
                Object.keys(colorCounts).forEach(colorName => {
                    if (colorCounts[colorName] > mostCommonColorCount) {
                        mostCommonColor = colorName;
                        mostCommonColorCount = colorCounts[colorName];
                    }
                });
                // if the most common color is not the current color, change to it
                if (mostCommonColor != this.color.name) {
                    if (this.timeAlive > 50) { // TODO make this based on the will of the of the boid
                        this.color = teamColors.find(color => color.name == mostCommonColor);
                    }
                }
            }
        }
    }

    // Cohesion
    // For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
    cohesion = boids => {
        let neighbordist = 50;
        let sum = createVector(0, 0);   // Start with empty vector to accumulate all locations
        let count = 0;

        boids.forEach(boid => {
            let d = p5.Vector.dist(this.position,boid.position);
            if ((d > 0) && (d < neighbordist)) {
                sum.add(boid.position); // Add location
                count++;
            }
        });

        if (count > 0) {
            sum.div(count);

            return this.seek(sum);  // Steer towards the location
        } else {
            return createVector(0, 0);
        }
    }

    select = () => {
        this.selected = true;
    }

    deselect = () => {
        this.selected = false;
    }
}
