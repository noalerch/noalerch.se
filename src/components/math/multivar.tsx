import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {Multivar2D, type Real2D} from './mathlib.ts'

const funcs: Multivar2D[] = [
    new Multivar2D(
        'sin(x)cos(y)',
        (x: number, y: number) => Math.sin(x) * Math.cos(y),
        (x: number, y: number) => Math.cos(x) * Math.cos(y),
        (x: number, y: number) => -Math.sin(x) * Math.sin(y)
    )
]

export default function MultivariateVisualizer() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x222222)

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5)
    camera.lookAt(0, 0, 0)

    // Renderer
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.current.appendChild(renderer.domElement)

    const light = new THREE.DirectionalLight(0xffe802, 1)
    light.position.set(5, 5, 5)
    scene.add(light)
    scene.add(new THREE.AmbientLight(0xffce00, 0.3))

    const geometry = new THREE.BufferGeometry()

    const resolution = 200

    let {vertices, indices, colors} = createGeometry(resolution, funcs[0].f)

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    const material = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
    })

    const surface = new THREE.Mesh(geometry, material)
    scene.add(surface)

    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let rotation = { x: 0.5, y: 0.8 };
    let radius = 12;

    const updateCamera = () => {
      camera.position.x = radius * Math.sin(rotation.y) * Math.cos(rotation.x);
      camera.position.y = radius * Math.sin(rotation.x);
      camera.position.z = radius * Math.cos(rotation.y) * Math.cos(rotation.x);
      camera.lookAt(0, 0, 0);
    };


    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - previousMouse.x;
      const deltaY = e.clientY - previousMouse.y;

      rotation.y += deltaX * 0.01;
      rotation.x += deltaY * 0.01;

      rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotation.x));

      updateCamera();
      previousMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius += e.deltaY * 0.01;
      radius = Math.max(3, Math.min(30, radius));
      updateCamera();
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)
      renderer.render(scene, camera)
    };

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    updateCamera();
    animate()

    // Cleanup
    return () => {
      material.dispose()
      renderer.dispose()
      containerRef.current?.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh' }} />
  );
};


// Create surface: z = sin(x) * cos(y)
const createGeometry = (resolution: number, func: Real2D) => {
    const size = 15
    
    const vertices: number[] = []
    const indices: number[] = []
    const colors: number[] = []

    for (let i = 0; i <= resolution; i++) {
      for (let j = 0; j <= resolution; j++) {
        const x = (i / resolution - 0.5) * size * 2
        const y = (j / resolution - 0.5) * size * 2
        const z = func(x, y)
        
        vertices.push(x, z, y)

        const t = (z + 1) / 2 
        const color = new THREE.Color();
        color.setHSL(0.6 - t * 0.5, 0.8, 0.5); // Blue to cyan gradient
        colors.push(color.r, color.g, color.b)

        if (i < resolution && j < resolution) {
          const a = i * (resolution + 1) + j
          const b = a + resolution + 1
          indices.push(a, b, a + 1)
          indices.push(b, b + 1, a + 1)
        }
      }
    }

    return {vertices, indices, colors}

} 