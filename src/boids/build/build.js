let traits;
let boids;
let colorShader;
let boidsCanvas;
const SHADER_SIZE = 512;
const SHADER_HALF_SIZE = 256;
function canvasSize() {
    return min(windowWidth, windowHeight) - 40;
}
function preload() {
    colorShader = loadShader('base.vert', 'color.frag');
}
function setup() {
    traits = hashToTraits(tokenData.hash);
    const c = canvasSize();
    createCanvas(c, c);
    boidsCanvas = createGraphics(SHADER_SIZE, SHADER_SIZE, WEBGL);
    boids = new Boids(500);
    frameRate(60);
    noStroke();
    boidsCanvas.shader(colorShader);
}
function draw() {
    background(0);
    boids.update();
    const u = boids.boids
        .map(b => b.position)
        .map(p => [p.x, p.y])
        .flat(1);
    colorShader.setUniform("boids", u);
    boidsCanvas.rect(0, 0, 1, 1);
    image(boidsCanvas, 0, 0, width, height);
}
function windowResized() {
    const c = canvasSize();
    resizeCanvas(c, c);
}
class Boids {
    constructor(size) {
        this.boids = Array(size).fill(0).map(() => new Boid());
    }
    flock(boid) {
        const others = this.boids.filter(b => b != boid);
        const inDist = others.map(o => {
            return { d: boid.position.dist(o.position), o };
        }).filter(({ d }) => {
            return d < Boids.perceptionRadius;
        });
        const cohesion = createVector();
        const alignment = createVector();
        const separation = createVector();
        inDist.forEach(({ d, o }) => {
            alignment.add(o.velocity);
            cohesion.add(o.position);
            const diff = p5.Vector.sub(boid.position, o.position);
            diff.div(d * d);
            separation.add(diff);
        });
        const total = inDist.length;
        const v = boid.velocity;
        const p = boid.position;
        if (total > 0) {
            alignment.div(total);
            alignment.setMag(Boids.maxSpeed);
            alignment.sub(v);
            alignment.limit(Boids.maxForce);
            cohesion.div(total);
            cohesion.sub(p);
            cohesion.setMag(Boids.maxSpeed);
            cohesion.sub(v);
            cohesion.limit(Boids.maxForce);
            separation.div(total);
            separation.setMag(Boids.maxForce);
            separation.sub(v);
            separation.limit(Boids.maxForce);
        }
        alignment.mult(2);
        boid.acceleration.add(alignment);
        cohesion.mult(0.2);
        boid.acceleration.add(cohesion);
        separation.mult(2);
        boid.acceleration.add(separation);
    }
    update() {
        for (const b of this.boids) {
            this.flock(b);
            b.update();
        }
    }
}
Boids.maxForce = 0.5;
Boids.maxSpeed = 5;
Boids.perceptionRadius = 30;
class Boid {
    constructor() {
        this.position = createVector(random(0, 512), random(0, 512));
        this.velocity = p5.Vector.random2D();
        this.velocity.setMag(random(2, 4));
        this.acceleration = createVector();
    }
    update() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.limit(Boids.maxSpeed);
        this.acceleration.mult(0);
        if (this.position.x > SHADER_SIZE) {
            this.position.x = 0;
        }
        else if (this.position.x < 0.1) {
            this.position.x = SHADER_SIZE;
        }
        if (this.position.y > SHADER_SIZE) {
            this.position.y = 0;
        }
        else if (this.position.y < 0.1) {
            this.position.y = SHADER_SIZE;
        }
    }
    show() {
        fill(255, 0, 255);
        circle(this.position.x, this.position.y, 12);
    }
}
const u64 = (n) => BigInt.asUintN(64, n);
const rotl = (x, k) => u64((x << k) | (x >> (64n - k)));
const xoshiro256strstr = (s) => () => {
    const result = u64(rotl(u64(s[1] * 5n), 7n) * 9n);
    const t = u64(s[1] << 17n);
    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = rotl(s[3], 45n);
    return result;
};
const randomDecimal = (xss) => () => {
    const t = xss();
    return parseInt((t % 9007199254740991n).toString()) / 9007199254740991;
};
const randomNumber = (r) => (a, b) => a + (b - a) * r();
const randomInt = (rn) => (a, b) => Math.floor(rn(a, b + 1));
const mkRandom = (hash) => {
    const s = Array(4).fill(0)
        .map((_, i) => i * 16 + 2)
        .map(idx => u64(BigInt(`0x${hash.slice(idx, idx + 16)}`)));
    const xss = xoshiro256strstr(s);
    const r = randomDecimal(xss);
    const rn = randomNumber(r);
    const ri = randomInt(rn);
    return { r, rn, ri };
};
const _shuffle = (array, r) => {
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(r() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
};
const repeat = (item, n) => Array.from({ length: n }).map(_ => item);
const selectRandom = (array, r) => array[Math.floor(r() * array.length)];
const selectRandomDist = (dist, r) => {
    const keys = Object.keys(dist)
        .reduce((a, k) => a.concat(repeat(k, dist[k] * 100)), []);
    return selectRandom(_shuffle(keys, r), r);
};
const toHex = (x) => x.toString(16).padStart(2, '0');
const fromHex = (hex) => parseInt(hex, 16);
const randomColorHex = (r) => {
    const rc = () => toHex(Math.floor(r() * 256));
    const red = rc();
    const green = rc();
    const blue = rc();
    return `#${red}${green}${blue}`;
};
const hashToTraits = (hash) => {
    const R = mkRandom(hash);
    return {
        numberOfShapes: R.ri(4, 50)
    };
};
//# sourceMappingURL=build.js.map