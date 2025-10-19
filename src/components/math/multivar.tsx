import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three'
import {Multivar2D} from './mathlib.ts'

const funcs: Multivar2D[] = [
    new Multivar2D(
        'sin(x)cos(y)',
        (x: number, y: number) => Math.sin(x) * Math.cos(y),
        (x: number, y: number) => Math.cos(x) * Math.cos(y),
        (x: number, y: number) => -Math.sin(x) * Math.sin(y)
    )
]

export default function MultivariateVisualizer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedFunc, setSelectedFunc] = useState<number>(0);
    const [showGradients, setShowGradients] = useState(true);
    const [resolution, setResolution] = useState(50);
    const sceneRef = useRef<{
        scene: THREE.Scene;
        camera: THREE.PerspectiveCamera;
        renderer: THREE.WebGLRenderer;
        surface: THREE.Mesh;
        gradients: THREE.Group;
    }>();

    useEffect(() => {
        let cleanup: (() => void) | undefined;
        const initScene = () => {
            console.log('Trying to init scene...');
            
            if (!containerRef.current) {
                console.log('Container not ready, retrying...');
                requestAnimationFrame(initScene);
                return;
            }

            // Scene setup
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x0a0a0a);
            
            const camera = new THREE.PerspectiveCamera(
                60,
                containerRef.current.clientWidth / containerRef.current.clientHeight,
                0.1,
                1000
            );
            camera.position.set(8, 6, 8);
            camera.lookAt(0, 0, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            containerRef.current.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            scene.add(ambientLight);
            
            const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight1.position.set(5, 10, 5);
            scene.add(directionalLight1);
            
            const directionalLight2 = new THREE.DirectionalLight(0x4466ff, 0.3);
            directionalLight2.position.set(-5, -5, -5);
            scene.add(directionalLight2);

            const axesHelper = new THREE.AxesHelper(5);
            scene.add(axesHelper);

            const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
            gridHelper.position.y = -2;
            scene.add(gridHelper);

            const surface = new THREE.Mesh();
            scene.add(surface);

            const gradients = new THREE.Group();
            scene.add(gradients);

            sceneRef.current = { scene, camera, renderer, surface, gradients };

            let isDragging = false;
            let previousMousePosition = { x: 0, y: 0 };
            let rotation = { x: 0, y: 0 };

            const onMouseDown = (e: MouseEvent) => {
                isDragging = true;
                previousMousePosition = { x: e.clientX, y: e.clientY };
            };

            const onMouseMove = (e: MouseEvent) => {
                if (!isDragging) return;
                
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;
                
                rotation.y += deltaX * 0.005;
                rotation.x += deltaY * 0.005;
                
                rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.x));
                
                const radius = 12;
                camera.position.x = radius * Math.cos(rotation.x) * Math.sin(rotation.y);
                camera.position.y = radius * Math.sin(rotation.x);
                camera.position.z = radius * Math.cos(rotation.x) * Math.cos(rotation.y);
                camera.lookAt(0, 0, 0);
                
                previousMousePosition = { x: e.clientX, y: e.clientY };
            };

            const onMouseUp = () => {
                isDragging = false;
            };

            renderer.domElement.addEventListener('mousedown', onMouseDown);
            renderer.domElement.addEventListener('mousemove', onMouseMove);
            renderer.domElement.addEventListener('mouseup', onMouseUp);

            const animate = () => {
                requestAnimationFrame(animate);
                renderer.render(scene, camera);
            };
            animate();

            // Handle resize
            const handleResize = () => {
            if (!containerRef.current) return;
                camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
            };
            window.addEventListener('resize', handleResize);

            cleanup = () => {
              window.removeEventListener('resize', handleResize);
              renderer.domElement.removeEventListener('mousedown', onMouseDown);
              renderer.domElement.removeEventListener('mousemove', onMouseMove);
              renderer.domElement.removeEventListener('mouseup', onMouseUp);
              renderer.dispose();
              if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
                  containerRef.current.removeChild(renderer.domElement);
              }
            };

            return () => {
                window.removeEventListener('resize', handleResize);
                renderer.domElement.removeEventListener('mousedown', onMouseDown);
                renderer.domElement.removeEventListener('mousemove', onMouseMove);
                renderer.domElement.removeEventListener('mouseup', onMouseUp);
                renderer.dispose();
                containerRef.current?.removeChild(renderer.domElement);
            };

        }
        initScene();
        return () => {
            if (cleanup) cleanup();
        };
    }, []);


    useEffect(() => {
        if (!sceneRef.current) return;
            console.log('Second effect running! sceneRef.current:', sceneRef.current);

        const { scene, surface, gradients } = sceneRef.current;
        const func = funcs[selectedFunc];

        if (surface.geometry) surface.geometry.dispose();
        if (surface.material) (surface.material as THREE.Material).dispose();

        const size = 6;
        const geometry = new THREE.BufferGeometry();
        const vertices: number[] = [];
        const indices: number[] = [];
        const colors: number[] = [];

        for (let i = 0; i <= resolution; i++) {
            for (let j = 0; j <= resolution; j++) {
                const x = (i / resolution - 0.5) * size * 2;
                const y = (j / resolution - 0.5) * size * 2;
                const z = func.f(x, y);
                
                vertices.push(x, z, y);
                
                // Color based on height
                const normalizedZ = (z + 1) / 2;
                const color = new THREE.Color();
                color.setHSL(0.6 - normalizedZ * 0.4, 0.8, 0.5);
                colors.push(color.r, color.g, color.b);

                if (i < resolution && j < resolution) {
                const a = i * (resolution + 1) + j;
                const b = a + resolution + 1;
                indices.push(a, b, a + 1);
                indices.push(b, b + 1, a + 1);
                }
            }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        shininess: 60,
        flatShading: false,
        });

        surface.geometry = geometry;
        surface.material = material;

        // Update gradients
        gradients.clear();

        if (showGradients) {
            const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff3366 });
            const step = Math.floor(resolution / 8);

            for (let i = 0; i <= resolution; i += step) {
                for (let j = 0; j <= resolution; j += step) {
                const x = (i / resolution - 0.5) * size * 2;
                const y = (j / resolution - 0.5) * size * 2;
                const z = func.f(x, y);

                const dx = func.df_dx(x, y);
                const dy = func.df_dy(x, y);
                
                const gradMag = Math.sqrt(dx * dx + dy * dy);
                if (gradMag < 0.01) continue;

                const scale = 0.3;
                const direction = new THREE.Vector3(dx, 0, dy).normalize();
                const arrow = new THREE.ArrowHelper(
                    direction,
                    new THREE.Vector3(x, z, y),
                    scale,
                    0xff3366,
                    0.1,
                    0.08
                );
                
                gradients.add(arrow);
                }
            }
        }
    }, [selectedFunc, showGradients, resolution]);
      
    return (
      <div className="w-full h-screen bg-gray-900 flex flex-col">
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Function: z = f(x, y)
              </label>
              <select
                value={selectedFunc}
                onChange={(e) => setSelectedFunc(Number(e.target.value))}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {funcs.map((func, idx) => (
                  <option key={idx} value={idx}>
                    {func.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Resolution: {resolution}
              </label>
              <input
                type="range"
                min="20"
                max="100"
                value={resolution}
                onChange={(e) => setResolution(Number(e.target.value))}
                className="w-32"
              />
            </div>

            <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showGradients}
                onChange={(e) => setShowGradients(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700"
              />
              <span className="text-sm font-medium">Show Gradients (∇f)</span>
            </label>
          </div>
        </div>

        <div ref={containerRef} className="flex-1" />

        <div className="bg-gray-800 border-t border-gray-700 p-3 text-center text-sm text-gray-400">
          Drag to rotate • Red arrows show gradient direction (steepest ascent)
        </div>
      </div>
    );
};

// TODO: move to funcs
const functions = {
  'sin(x)cos(y)': {
    f: (x: number, y: number) => Math.sin(x) * Math.cos(y),
    fx: (x: number, y: number) => Math.cos(x) * Math.cos(y),
    fy: (x: number, y: number) => -Math.sin(x) * Math.sin(y),
  },
  'x² - y²': {
    f: (x: number, y: number) => x * x - y * y,
    fx: (x: number, y: number) => 2 * x,
    fy: (x: number, y: number) => -2 * y,
  },

  'sin(√(x²+y²))': {
    f: (x: number, y: number) => {
      const r = Math.sqrt(x * x + y * y);
      return r === 0 ? 1 : Math.sin(r) / r;
    },
    fx: (x: number, y: number) => {
      const r = Math.sqrt(x * x + y * y);
      if (r === 0) return 0;
      return (x / r) * (Math.cos(r) / r - Math.sin(r) / (r * r));
    },
    fy: (x: number, y: number) => {
      const r = Math.sqrt(x * x + y * y);
      if (r === 0) return 0;
      return (y / r) * (Math.cos(r) / r - Math.sin(r) / (r * r));
    },
  },
  'e^(-(x²+y²))': {
    f: (x: number, y: number) => Math.exp(-(x * x + y * y)),
    fx: (x: number, y: number) => -2 * x * Math.exp(-(x * x + y * y)),
    fy: (x: number, y: number) => -2 * y * Math.exp(-(x * x + y * y)),
  },
};
