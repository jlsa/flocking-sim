const editModes = {
    default: 'default',
    erase: 'erase',
    spawn: 'spawn',
}

let flock;
let paused = true;
let totalTicks = 0;
let showStats = true;
let mouseSpawnColor = -1;
let currentEditMode = editModes.default;

let spawnRadius = 300;
let eraseRadius = 200;

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
    console.log(mode, currentEditMode);
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
    noLoop();
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
    renderStats();
    flock.run();

    // draw spawn radius around cursor
    if (currentEditMode === editModes.spawn) {
        stroke(255, 255, 255, 100);
        noFill();
        circle(mouseX, mouseY, spawnRadius);
    }

    // draw erase radius around cursor
    if (currentEditMode === editModes.erase) {
        stroke(255, 0, 0, 100);
        noFill();
        circle(mouseX, mouseY, eraseRadius);
    }
}

const renderStats = () => {
    if (!showStats) {
        return;
    }
    noStroke();
    textSize(32);
    fill(0, 102, 153);

    const messages = [
        'ticks: ' + totalTicks,
        'boids: ' + flock.boids.length,
        'fps: ' + Math.floor(frameRate()),
        'paused: ' + (paused ? 'yes' : 'no'),
        'press p to pause',
        'press h to toggle stats',
    ];

    if (currentEditMode === editModes.erase) {
        messages.push('press s to switch to spawn mode');
    }
    if (currentEditMode === editModes.spawn) {
        messages.push('click to add 10 boids');
        messages.push('drag to add 1 boid');
        messages.push('press e to use erase mode');
        messages.push('press 1-7 to toggle spawn colors');
        messages.push('press 0 to random spawn colors');
        const spawnColor = teamColors[mouseSpawnColor] ?? null;
        messages.push('current mouse spawn color: ' + (spawnColor ? spawnColor.name : 'random'));
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

    if (currentEditMode === editModes.erase) {
        flock.boids = flock.boids.filter(boid => {
            // check if boid is inside erase radius
            if (dist(boid.position.x, boid.position.y, mouseX, mouseY) <= eraseRadius / 2) {
                return false;
            }

            return dist(boid.position.x, boid.position.y, mouseX, mouseY) > eraseRadius / 2;
        });

        return;
    }

    spawnNewBoidsOnMouseLocation();
}

const spawnNewBoidsOnMouseLocation = () => {
    if (currentEditMode !== editModes.spawn) {
        return;
    }
    console.log('flock.boids', flock.boids.length);
    const diff = maxBoids - flock.boids.length;
    if (flock.boids.length <= maxBoids) {
        // if ()
        flock.boids.sort((a, b) => a.timeAlive - b.timeAlive).reverse().splice(0, 10);
    } // if number of boids is below max, don't remove any, just spawn new ones


    for (i = 0; i < 10; i++) {
        spawnBoids(1, mouseX, mouseY, 300);
    }
}

function keyPressed() {
    if (key === 'e') {
        switchToMode(editModes.erase);
    }
    if (key === 's') {
        switchToMode(editModes.spawn);
    }
    if (key === 'p') {
        if (paused) {
            loop();
            paused = false;
        } else {
            noLoop();
            paused = true;
        }
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

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Flock object
// Does very little, simply manages the array of all the boids
class Flock {
    constructor() {
        this.boids = [];
    }

    run = () => {
        const amountToSpawn = this.boids.filter(boid => boid.lifeSpan <= 0).length;
        const spawnX = Math.floor(Math.random() * width);
        const spawnY = Math.floor(Math.random() * height);
        spawnBoids(amountToSpawn, spawnX, spawnY);

        this.boids = this.boids.filter(boid => boid.lifeSpan > 0);
        this.boids.forEach(boid => boid.run(this.boids));
        totalTicks++;
    };

    addBoid = boid => {
        this.boids.push(boid);
    };
}

// The Nature of Code
// Daniel Shiffman
// http://natureofcode.com

// Boid class
// Methods for Separation, Cohesion, Alignment added
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
    }

    run = boids => {
        this.flock(boids);
        this.update(boids);
        this.borders();
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
        let desired = p5.Vector.sub(target,this.position);  // A vector pointing from the location to the target
        // Normalize desired and scale to maximum speed
        desired.normalize();
        desired.mult(this.maxspeed);
        // Steering = Desired minus Velocity
        let steer = p5.Vector.sub(desired,this.velocity);
        steer.limit(this.maxforce);  // Limit to maximum steering force

        return steer;
    }

    render = () => {
        // Draw a triangle rotated in the direction of velocity
        let theta = this.velocity.heading() + radians(90);
        fill(this.color.r, this.color.g, this.color.b);
        stroke(this.color.r, this.color.g, this.color.b);
        push();
        translate(this.position.x, this.position.y);
        rotate(theta);
        beginShape();
        vertex(0, -this.r * 2);
        vertex(-this.r, this.r * 2);
        vertex(this.r, this.r * 2);
        endShape(CLOSE);
        pop();
    }

    // Wraparound
    borders = () => {
        if (this.position.x < -this.r)  this.position.x = width + this.r;
        if (this.position.y < -this.r)  this.position.y = height + this.r;
        if (this.position.x > width + this.r) this.position.x = -this.r;
        if (this.position.y > height + this.r) this.position.y = -this.r;
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
                    if (this.timeAlive > 50) {
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
}
