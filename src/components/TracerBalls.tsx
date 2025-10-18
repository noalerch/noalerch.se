import type p5 from "p5";

export default function TracerBalls() {
  if (typeof window === "undefined") return;

  import("p5").then(({ default: p5 }) => {

    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight)
        p.background(20, 20, 60)
        p.smooth
      };

      let whiteCircles: Circle[] = []
      let lightRedCircles: Circle[] = []
      let lightningCircles: Circle[] = []
      let greenCircles: Circle[] = []
      let slowBlueCircles: Circle[] = []

      const lightRedWalk = new RandomWalk(new Vector(window.innerWidth / 2, window.innerHeight / 2))

      const lightningWalk = new RandomWalk(new Vector(window.innerWidth / 2, window.innerHeight / 2))
      lightningWalk.stepSize = 50
      lightningWalk.stepSizeDeviation = 8
      lightningWalk.thetaDeviation = Math.PI / 48
      
      const greenWalk = new RandomWalk(new Vector(window.innerWidth / 2, window.innerHeight / 2))
      greenWalk.stepSizeDeviation = 70
      greenWalk.thetaDeviation = Math.PI / 2

      const slowBlueWalk = new RandomWalk(new Vector(window.innerWidth / 2, window.innerHeight / 2))
      slowBlueWalk.stepSize = 5
      slowBlueWalk.thetaDeviation = Math.PI / 4

      p.draw = () => {
        let white: p5.Color = p.color(240, 240, 250)
        let lightRed: p5.Color = p.color(250, 100, 100)
        let lightning: p5.Color = p.color(250, 250, 125)
        let green: p5.Color = p.color(100, 250, 100)
        let slowBlue: p5.Color = p.color(60, 80, 220)
        p.background(5, 5, 20);
        p.fill(150);
        renderCircles(p, whiteCircles, white, new Vector(p.mouseX, p.mouseY));
        renderCircles(p, lightRedCircles, lightRed, lightRedWalk.position)
        renderCircles(p, lightningCircles, lightning, lightningWalk.position)
        renderCircles(p, greenCircles, green, greenWalk.position)
        renderCircles(p, slowBlueCircles, slowBlue, slowBlueWalk.position)
        
        lightRedWalk.step()
        lightningWalk.step()
        greenWalk.step()
        slowBlueWalk.step()
      };
      
      p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
      };
    };

    new p5(sketch);


  });
}

class Circle {
  private alphaDiff: number = 2

  constructor(
    public position: Vector,
    public velocity: Vector,
    public acceleration: Vector,
    public size: number,
    public color: p5.Color,
    public alpha: number = 255,
  ) {}
  
  lowerAlpha() {
    this.alpha -= this.alphaDiff
    this.color.setAlpha(this.alpha)
  }
}

class Vector {
  x: number
  y: number

  constructor(x: number = 0, y: number = 0) {
    this.x = x
    this.y = y
  }

  static normalize(u: Vector) {
    const length: number = Math.hypot(u.x, u.y)
    if (length > 0) {
        return Vector.scale(1 / length, u)
    }
    return new Vector()
  }

  static add(u: Vector, v: Vector) {
    return new Vector(u.x + v.x, u.y + v.y)
  }

  static subtract(u: Vector, v: Vector) {
    return new Vector(u.x - v.x, u.y - v.y)
  }

  static scale(s: number, v: Vector) {
    return new Vector(s * v.x, s * v.y)
  }
}

class RandomWalk {
  position: Vector
  theta: number
  stepSize: number = 15
  stepSizeDeviation: number = 0
  thetaDeviation: number = Math.PI / 12

  xDomain = {min: 0, max: window.innerWidth}
  yDomain = {min: 0, max: window.innerHeight}

  constructor(position: Vector) {
    this.position = position
    
    // random angle in radians
    this.theta = Math.random() * 2 * Math.PI
  }
  
  step() {
    this.stepForward(this.stepSize, this.stepSizeDeviation, this.thetaDeviation)
    this.constrainToWindow()
  }

  private stepForward(size: number, sizeDeviation: number, thetaDeviation: number) {
    const theta = this.gaussian(this.theta, thetaDeviation) % (2 * Math.PI) // domain: 0-2pi (radian)
    const stepSize = this.gaussian(size, sizeDeviation)
    const stepVector: Vector = new Vector(stepSize * Math.cos(theta), stepSize * Math.sin(theta))
    
    this.position = Vector.add(this.position, stepVector)
    this.theta = theta
  }

  private gaussian(mu: number, sigma: number): number {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      return mu + z * sigma;
  }
  
    private constrainToWindow() {
    if (this.position.x < this.xDomain.min || this.position.x > this.xDomain.max) {
      this.theta = Math.PI - this.theta;
      this.position.x = Math.max(this.xDomain.min, Math.min(this.xDomain.max, this.position.x))
    }
    if (this.position.y < this.yDomain.min || this.position.y > this.yDomain.max) {
      this.theta = -this.theta;
      this.position.y = Math.max(this.yDomain.min, Math.min(this.yDomain.max, this.position.y))
    }
  }
}

function renderCircles(p: p5, circles: Circle[], color: p5.Color, headPosition: Vector) {

  circles.push(new Circle(
    headPosition, new Vector(), new Vector(), 25, color
  ));

  const accFactor = 0.005;
  const friction = 0.90;

  // update and draw circles
  for (let i = circles.length - 1; i >= 0; i--) {
    const c = circles[i];

    p.noStroke();
    p.fill(c.color);
    p.circle(c.position.x, c.position.y, c.size);

    const directionToHead: Vector = Vector.subtract(headPosition, c.position);
    const acceleration: Vector = Vector.scale(accFactor, directionToHead);
    const velocity = Vector.scale(friction, Vector.add(c.velocity, acceleration));
    const nextPosition = Vector.add(c.position, velocity);

    if (nextPosition.x < -c.size || nextPosition.y < -c.size || c.alpha <= 0) {
      circles.splice(i, 1);
    }

    c.lowerAlpha()
    c.position = nextPosition;
  }
}
