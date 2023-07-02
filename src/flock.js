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
