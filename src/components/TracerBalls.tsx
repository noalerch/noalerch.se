
export default function TracerBalls() {
  if (typeof window === "undefined") return;

  import("p5").then(({ default: p5 }) => {

    let circles: Circle[] = [];

    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight);
        p.background(20, 20, 60);
      };

      p.draw = () => {
        p.background(0, 20);
        p.fill(150);
        const mousePosition = new Vector(p.mouseX, p.mouseY)

        circles.push(new Circle(
          mousePosition, new Vector(), new Vector(), 20, 150
        ))

        const accFactor = 0.005
        const friction = 0.98

        // update and draw circles
        for (let i = circles.length - 1; i >= 0; i--) {
          const c = circles[i];

          p.noStroke();
          p.fill(255, 150, 50, c.alpha);
          p.circle(c.position.x, c.position.y, c.size);

          const directionToMouse: Vector = Vector.subtract(mousePosition, c.position)
          const acceleration: Vector = Vector.scale(accFactor, directionToMouse)
          const velocity = Vector.scale(friction, Vector.add(c.velocity, acceleration))
          const nextPosition = Vector.add(c.position, velocity)

          if (nextPosition.x < -c.size || nextPosition.y < -c.size || c.alpha <= 0) {
            circles.splice(i, 1);
          }

          c.alpha -= 2; 
          c.position = nextPosition
        }
      };
    };

    new p5(sketch);


  });
}

class Circle {
  constructor(
    public position: Vector,
    public velocity: Vector,
    public acceleration: Vector,
    public size: number,
    public alpha: number
  ) {}
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