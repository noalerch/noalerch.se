
export default function AudioVisualizer() {
  if (typeof window === "undefined") return;

  import("p5").then(({ default: p5 }) => {
    interface Circle {
        x: number;
        y: number;
        size: number;
        alpha: number;
      }

    let circles: Circle[] = [];

    const sketch = (p: p5) => {
      p.setup = () => {
        p.createCanvas(window.innerWidth, window.innerHeight);
        p.background(20, 20, 60);
      };

      p.draw = () => {
        p.background(0, 20);
        p.fill(150);
        circles.push({x: p.mouseX, y: p.mouseY, size: 20, alpha: 100});

        // update and draw circles
        for (let i = circles.length - 1; i >= 0; i--) {
          const c = circles[i];
          c.alpha -= 1; 

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

    const moveLeft = (x: Number) => {
        return x - 8
    }

    new p5(sketch);


  });
}