import type p5 from "p5";

export default function TracerBalls() {
  if (typeof window === "undefined") return;

  import("p5").then(({ default: p5 }) => {

    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight);
        p.background(20, 20, 60);
      };

      let circles: Circle[] = [];

      p.draw = () => {
        let white: p5.Color = p.color(240, 240, 250)
        p.background(5, 5, 20);
        p.fill(150);
        renderCircles(p, circles, white, new Vector(p.mouseX, p.mouseY));
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

function renderCircles(p: p5, circles: Circle[], color: p5.Color, headPosition: Vector) {

  circles.push(new Circle(
    headPosition, new Vector(), new Vector(), 20, color
  ));

  const accFactor = 0.005;
  const friction = 0.98;

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
