import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

type JoinBackGroundProps = {
  className?: string;
  heroY?: number;
  heroZ?: number;
};

const JoinBackGround: React.FC<JoinBackGroundProps> = ({ className, heroY = 4.2, heroZ = -10 }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
  } | null>(null);
  const animationRef = useRef<number | null>(null);
  const objectsRef = useRef<THREE.Object3D[]>([]);
  const chatMeshesRef = useRef<THREE.Mesh[]>([]);
  const heroGroupRef = useRef<THREE.Group | null>(null);
  const heroDotsRef = useRef<THREE.Mesh[]>([]);
  const messageTilesRef = useRef<THREE.Mesh[]>([]);
  const mouseNdcRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const mountElement = mountRef.current;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0e18, 10, 100);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0e18, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountElement.appendChild(renderer.domElement);
    sceneRef.current = { scene, camera, renderer };

    // Lights
    scene.add(new THREE.AmbientLight(0x7c5cff, 0.3));
    const d = new THREE.DirectionalLight(0x3bc9db, 0.8);
    d.position.set(5, 5, 5);
    d.castShadow = true;
    scene.add(d);
    const p1 = new THREE.PointLight(0x7c5cff, 1, 50);
    p1.position.set(-10, 10, -10);
    scene.add(p1);
    const p2 = new THREE.PointLight(0x3bc9db, 1, 50);
    p2.position.set(10, -10, 10);
    scene.add(p2);

    // Background shapes (smaller, further back)
    const geometries: Array<THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>> = [];
    const materials = [
      new THREE.MeshPhongMaterial({ color: 0x7c5cff, transparent: true, opacity: 0.3, wireframe: true }),
      new THREE.MeshPhongMaterial({ color: 0x3bc9db, transparent: true, opacity: 0.25, emissive: 0x3bc9db, emissiveIntensity: 0.1 }),
      new THREE.MeshPhongMaterial({ color: 0xa089ff, transparent: true, opacity: 0.3, wireframe: true }),
    ];
    for (let i = 0; i < 15; i++) {
      const geometry = Math.random() > 0.5
        ? new THREE.IcosahedronGeometry(Math.random() * 1.2 + 0.3, 1)
        : new THREE.OctahedronGeometry(Math.random() * 0.8 + 0.3, 2);
      const material = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, -20 - Math.random() * 40);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.userData = {
        rotationSpeed: { x: (Math.random() - 0.5) * 0.005, y: (Math.random() - 0.5) * 0.005, z: (Math.random() - 0.5) * 0.005 },
        originalPosition: mesh.position.clone(),
        velocity: new THREE.Vector3(),
      };
      scene.add(mesh);
      geometries.push(mesh);
      objectsRef.current.push(mesh);
    }

    // Particles
    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 200;
      particlePositions[i + 1] = (Math.random() - 0.5) * 200;
      particlePositions[i + 2] = (Math.random() - 0.5) * 200;
      const color = Math.random() > 0.5 ? new THREE.Color(0x7c5cff) : new THREE.Color(0x3bc9db);
      particleColors[i] = color.r;
      particleColors[i + 1] = color.g;
      particleColors[i + 2] = color.b;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    const particleMaterial = new THREE.PointsMaterial({ size: 2, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Chat sprites far back
    const createChatSprite = (): THREE.Sprite => {
      const size = 64;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = 'rgba(124, 92, 255, 0.15)';
        ctx.beginPath();
        const r = 16;
        ctx.moveTo(12 + r, 12);
        ctx.arcTo(size - 12, 12, size - 12, size - 24, r);
        ctx.arcTo(size - 12, size - 24, size / 2, size - 24, r);
        ctx.arcTo(size / 2 - 12, size - 24, 12, size - 24, r);
        ctx.arcTo(12, size - 24, 12, 12, r);
        ctx.closePath();
        ctx.fill();
      }
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: true });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(6, 6, 1);
      sprite.position.set((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 80, -60 - Math.random() * 20);
      sprite.userData = { baseY: sprite.position.y, floatSpeed: 0.2 + Math.random() * 0.3 };
      return sprite;
    };
    const chatSprites: THREE.Sprite[] = Array.from({ length: 12 }, createChatSprite);
    chatSprites.forEach(s => scene.add(s));

    // Build bubble geometry
    const buildBubbleGeometry = (isRight: boolean) => {
      const w = 8;
      const h = 3.6;
      const r = 0.6;
      const x = -w / 2;
      const y = -h / 2;
      const s = new THREE.Shape();
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      if (isRight) {
        s.lineTo(x + w - 1.8, y + h);
        s.lineTo(x + w - 0.6, y + h + 0.9);
        s.lineTo(x + w - 2.6, y + h - 0.1);
      } else {
        s.lineTo(x + r, y + h);
        s.lineTo(x + 0.6, y + h + 0.9);
        s.lineTo(x + 2.6, y + h - 0.1);
      }
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      const extrude = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.14, bevelThickness: 0.12 });
      extrude.computeVertexNormals();
      return extrude;
    };

    // Chat group and hero bubble
    const chatGroup = new THREE.Group();
    chatGroup.position.z = -12;
    scene.add(chatGroup);

    const heroGeom = buildBubbleGeometry(true);
    const heroMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a1f2e,
      transparent: true,
      opacity: 0.9,
      transmission: 0.15,
      thickness: 0.5,
      roughness: 0.3,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      emissive: new THREE.Color(0x7c5cff),
      emissiveIntensity: 0.12,
      ior: 1.4,
    });
    const heroGroup = new THREE.Group();
    const heroMesh = new THREE.Mesh(heroGeom, heroMat);
    heroMesh.scale.set(1.4, 1.4, 1.4);
    heroGroup.add(heroMesh);
    const heroEdges = new THREE.LineSegments(new THREE.EdgesGeometry(heroGeom, 1), new THREE.LineBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: 0.4 }));
    heroMesh.add(heroEdges);
    heroGroup.position.set(0, heroY, heroZ);
    scene.add(heroGroup);
    heroGroupRef.current = heroGroup;
    objectsRef.current.push(heroMesh);

    // Hero text overlays
    const createChatText = (text: string, yPos: number, size: number = 28) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 512, 64);
        ctx.font = `bold ${size}px system-ui, Segoe UI, Roboto`;
        ctx.fillStyle = 'rgba(230,234,246,0.95)';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(124,92,255,0.8)';
        ctx.shadowBlur = 8;
        ctx.fillText(text, 256, 40);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.1, depthWrite: false });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 1), material);
      plane.position.set(0, yPos, 0.3);
      return plane;
    };
    [
      createChatText('💬 Real-time Chat', 0.4, 32),
      createChatText('Connect & Communicate', -0.2, 20),
      createChatText('Instant Messaging', -0.6, 18),
    ].forEach(t => heroMesh.add(t));

    // Hero typing dots
    const dotGeoHero = new THREE.SphereGeometry(0.22, 20, 20);
    const dotMatHero = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7c5cff, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.4 });
    for (let dIdx = 0; dIdx < 3; dIdx++) {
      const dot = new THREE.Mesh(dotGeoHero, dotMatHero);
      dot.position.set(-0.7 + dIdx * 0.7, -1.0, 0.25);
      heroGroup.add(dot);
      heroDotsRef.current.push(dot);
    }

    // Message tiles
    const messageGroup = new THREE.Group();
    messageGroup.position.set(0, 0.5, -10);
    scene.add(messageGroup);
    const createMessageTile = (index: number) => {
      const tileGeo = new THREE.PlaneGeometry(3.2, 0.6, 1, 1);
      const isRight = index % 2 === 0;
      const tileMat = new THREE.MeshLambertMaterial({ color: isRight ? 0x7c5cff : 0x3bc9db, transparent: true, opacity: 0.4, emissive: isRight ? 0x7c5cff : 0x3bc9db, emissiveIntensity: 0.1 });
      const tile = new THREE.Mesh(tileGeo, tileMat);
      tile.position.set((Math.random() - 0.5) * 2.0, -index * 0.5, 0);
      (tile as any).userData = { speed: 0.008 + Math.random() * 0.006, resetY: -4, originalX: tile.position.x };
      messageGroup.add(tile);
      messageTilesRef.current.push(tile);
      const tileEdges = new THREE.LineSegments(new THREE.EdgesGeometry(tileGeo), new THREE.LineBasicMaterial({ color: isRight ? 0x7c5cff : 0x3bc9db, transparent: true, opacity: 0.6 }));
      tile.add(tileEdges);
    };
    for (let t = 0; t < 8; t++) createMessageTile(t);

    // Messages row (bubbles behind)
    const messages = ['Hey there!', 'Ready to chat?', 'Typing…', 'Real-time sync', 'Message sent', 'Delivered ✓'];
    messages.forEach((msg, i) => {
      const isRight = i % 2 === 0;
      const geom = buildBubbleGeometry(isRight);
      const mat = new THREE.MeshLambertMaterial({ color: 0x1a1f2e, transparent: true, opacity: 0.7, emissive: new THREE.Color(isRight ? 0x7c5cff : 0x3bc9db), emissiveIntensity: 0.2 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set((isRight ? 1 : -1) * (6.5 + Math.random() * 2), -5 + i * 1.8, -3.0 + Math.random() * 2.0);
      mesh.rotation.y = (isRight ? -1 : 1) * 0.15;
      chatGroup.add(mesh);
      chatMeshesRef.current.push(mesh);
      objectsRef.current.push(mesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geom, 1), new THREE.LineBasicMaterial({ color: isRight ? 0x7c5cff : 0x3bc9db, transparent: true, opacity: 0.35 }));
      mesh.add(edges);
      const textCanvas = document.createElement('canvas');
      textCanvas.width = 512; textCanvas.height = 128;
      const tctx = textCanvas.getContext('2d');
      if (tctx) {
        tctx.clearRect(0, 0, 512, 128);
        tctx.font = '700 36px system-ui, Segoe UI, Roboto';
        tctx.fillStyle = 'rgba(230,234,246,0.95)';
        tctx.fillText(msg, 28, 82);
      }
      const textTex = new THREE.CanvasTexture(textCanvas);
      const textMat = new THREE.MeshBasicMaterial({ map: textTex, transparent: true });
      const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), textMat);
      textPlane.position.set(0, 0.1, 0.22);
      mesh.add(textPlane);
    });

    // Camera
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    const raycaster = new THREE.Raycaster();

    const animate = (time: number) => {
      animationRef.current = requestAnimationFrame(animate);
      const elapsedTime = time * 0.001;
      geometries.forEach((mesh, index) => {
        mesh.rotation.x += mesh.userData.rotationSpeed.x;
        mesh.rotation.y += mesh.userData.rotationSpeed.y;
        mesh.rotation.z += mesh.userData.rotationSpeed.z;
        const baseY = mesh.userData.originalPosition.y + Math.sin(elapsedTime + index) * 2;
        const baseTarget = new THREE.Vector3(mesh.userData.originalPosition.x, baseY, mesh.userData.originalPosition.z);
        const toBase = baseTarget.sub(mesh.position).multiplyScalar(0.02);
        mesh.userData.velocity.add(toBase);
        mesh.userData.velocity.multiplyScalar(0.96);
        mesh.position.add(mesh.userData.velocity);
      });

      if (isMouseInitializedRef.current && sceneRef.current) {
        const { camera } = sceneRef.current;
        raycaster.setFromCamera(mouseNdcRef.current, camera);
        const intersects = raycaster.intersectObjects(objectsRef.current, false);
        for (let i = 0; i < Math.min(intersects.length, 3); i++) {
          const hit = intersects[i];
          const m = hit.object as THREE.Mesh;
          const dir = m.position.clone().sub(hit.point).normalize();
          if (!m.userData.velocity) m.userData.velocity = new THREE.Vector3();
          m.userData.velocity.add(dir.multiplyScalar(0.12));
        }
        objectsRef.current.forEach((obj) => {
          const mesh = obj as THREE.Mesh;
          const distance = mesh.position.distanceTo(camera.position);
          if (distance < 15) {
            const mouseWorld = new THREE.Vector3();
            mouseWorld.unproject(camera);
            const direction = mesh.position.clone().sub(mouseWorld).normalize();
            const attraction = direction.multiplyScalar(0.002);
            if (!mesh.userData.velocity) mesh.userData.velocity = new THREE.Vector3();
            mesh.userData.velocity.add(attraction);
          }
        });
      }

      particles.rotation.y = elapsedTime * 0.01;
      particles.rotation.x = Math.sin(elapsedTime * 0.1) * 0.02;

      heroDotsRef.current.forEach((dot, i) => {
        const s = 0.9 + Math.sin(elapsedTime * 4 + i * 0.6) * 0.15;
        dot.scale.setScalar(s);
      });
      if (heroGroupRef.current) {
        const g = heroGroupRef.current;
        g.rotation.y = Math.sin(elapsedTime * 0.25) * 0.12;
        const mp = mousePositionRef.current;
        g.position.x += (mp.x * 0.2 - g.position.x) * 0.04;
        g.position.y += (heroY + mp.y * -0.05 - g.position.y) * 0.04;
      }
      messageTilesRef.current.forEach((tile, index) => {
        const d = (tile as any).userData;
        tile.position.y += d.speed;
        if (tile.position.y > 3.0) {
          tile.position.y = d.resetY;
          tile.position.x = d.originalX + (Math.random() - 0.5) * 0.5;
        }
        tile.position.x += Math.sin(elapsedTime * 0.5 + index) * 0.002;
        tile.rotation.z = Math.sin(elapsedTime * 0.3 + index) * 0.02;
      });
      chatSprites.forEach((s, i) => {
        const sp = s.userData.floatSpeed as number;
        s.position.y = (s.userData.baseY as number) + Math.sin(elapsedTime * sp + i) * 2;
        s.rotation.z = Math.sin(elapsedTime * 0.2 + i) * 0.1;
      });

      camera.position.x = Math.sin(elapsedTime * 0.02) * 0.5;
      camera.position.y = Math.cos(elapsedTime * 0.03) * 0.3;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (!sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const newX = (event.clientX / window.innerWidth - 0.5) * 10;
      const newY = (event.clientY / window.innerHeight - 0.5) * 10;
      const ndcX = (event.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseNdcRef.current.set(ndcX, ndcY);
      if (!isMouseInitializedRef.current) {
        mousePositionRef.current = { x: newX, y: newY };
        isMouseInitializedRef.current = true;
      } else {
        const prev = mousePositionRef.current;
        mousePositionRef.current = { x: prev.x + (newX - prev.x) * 0.1, y: prev.y + (newY - prev.y) * 0.1 };
      }
    };

    animate(0);
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (mountElement && renderer.domElement) mountElement.removeChild(renderer.domElement);
      chatSprites.forEach(s => scene.remove(s));
      heroDotsRef.current = [];
      messageTilesRef.current = [];
      chatMeshesRef.current.forEach((m) => {
        m.geometry.dispose();
        const mat = m.material as THREE.Material & { map?: THREE.Texture };
        if (mat.map) mat.map.dispose();
        mat.dispose();
      });
      chatMeshesRef.current = [];
      renderer.dispose();
    };
  }, [heroY, heroZ]);

  return <div ref={mountRef} className={className} />;
};

export default JoinBackGround;


