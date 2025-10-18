
export default function AudioVisualizer() {
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

        const accFactor = 0.4

        // update and draw circles
        for (let i = circles.length - 1; i >= 0; i--) {
          const c = circles[i];
          c.alpha -= 1; 


          const directionToMouse: Vector = Vector.subtract(mousePosition, c.position)
          const acceleration: Vector = Vector.scale(accFactor, directionToMouse)

          p.noStroke();
          p.fill(255, 150, 50, c.alpha);
          p.circle(c.x, c.y, c.size);

          if (c.x < -c.size || c.alpha <= 0) {
            circles.splice(i, 1);
          }

          c.x = moveLeft(c.x)
        }
      };
    };

    const moveLeft = (x: number) => {
        return x - 8
    }

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