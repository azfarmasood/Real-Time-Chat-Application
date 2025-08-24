import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import styles from './Join.module.scss';

const NebulaChat: React.FC = () => {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  // Mouse state kept in refs for animation loop without re-renders
  const [isMouseInitialized, setIsMouseInitialized] = useState(false);
  const mousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseInitializedRef = useRef<boolean>(false);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
  } | null>(null);
  const animationRef = useRef<number | null>(null);
  const objectsRef = useRef<THREE.Object3D[]>([]);
  const mouseNdcRef = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const heroGroupRef = useRef<THREE.Group | null>(null);
  const heroDotsRef = useRef<THREE.Mesh[]>([]);
  const messageTilesRef = useRef<THREE.Mesh[]>([]);
  const chatMeshesRef = useRef<THREE.Mesh[]>([]);
  const typingDotGroupsRef = useRef<THREE.Group[]>([]);
  
  const isValid = useMemo(() => Boolean(name.trim() && room.trim()), [name, room]);

  useEffect(() => {
    if (!mountRef.current) return;
    const mountElement = mountRef.current;

    // Scene setup
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x7c5cff, 0.3);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0x3bc9db, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight1 = new THREE.PointLight(0x7c5cff, 1, 50);
    pointLight1.position.set(-10, 10, -10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x3bc9db, 1, 50);
    pointLight2.position.set(10, -10, 10);
    scene.add(pointLight2);

    // Geometric shapes
    const geometries: Array<THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>> = [];
    const materials = [
      new THREE.MeshPhongMaterial({ 
        color: 0x7c5cff, 
        transparent: true, 
        opacity: 0.7,
        wireframe: true 
      }),
      new THREE.MeshPhongMaterial({ 
        color: 0x3bc9db, 
        transparent: true, 
        opacity: 0.5,
        emissive: 0x3bc9db,
        emissiveIntensity: 0.2
      }),
      new THREE.MeshPhongMaterial({ 
        color: 0xa089ff, 
        transparent: true, 
        opacity: 0.6,
        wireframe: true 
      })
    ];

    // Create floating geometric objects
    for (let i = 0; i < 20; i++) {
      const geometry = Math.random() > 0.5 
        ? new THREE.IcosahedronGeometry(Math.random() * 2 + 0.5, 1)
        : new THREE.OctahedronGeometry(Math.random() * 1.5 + 0.5, 2);
      
      const material = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(geometry, material);
      
      mesh.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      );
      
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      
      mesh.userData = {
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.005, // Much slower rotation
          y: (Math.random() - 0.5) * 0.005,
          z: (Math.random() - 0.5) * 0.005
        },
        originalPosition: mesh.position.clone(),
        velocity: new THREE.Vector3()
      };
      
      scene.add(mesh);
      geometries.push(mesh);
      objectsRef.current.push(mesh);
    }

    // Particle system
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

    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Chat bubble sprites behind the scene
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
      sprite.position.set(
        (Math.random() - 0.5) * 120,
        (Math.random() - 0.5) * 80,
        -60 - Math.random() * 20
      );
      sprite.userData = { baseY: sprite.position.y, floatSpeed: 0.2 + Math.random() * 0.3 };
      return sprite;
    };
    const chatSprites: THREE.Sprite[] = Array.from({ length: 12 }, createChatSprite);
    chatSprites.forEach(s => scene.add(s));

    // Build extruded rounded rectangle + tail shape (declare before use)
    const buildBubbleGeometry = (isRight: boolean) => {
      const w = 8;
      const h = 3.6;
      const r = 0.6;
      const x = -w / 2;
      const y = -h / 2;
      const s = new THREE.Shape();
      // rounded rectangle body
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      // add tail as outward extension on bottom edge
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

      const extrude = new THREE.ExtrudeGeometry(s, {
        depth: 0.35,
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.14,
        bevelThickness: 0.12,
      });
      extrude.computeVertexNormals();
      return extrude;
    };

    // 3D chat bubble meshes (extruded rounded rectangles with tails)
    const chatGroup = new THREE.Group();
    chatGroup.position.z = -12; // bring closer so it is clearly visible
    scene.add(chatGroup);

    // Hero bubble front-and-center
    const heroGeom = buildBubbleGeometry(true);
    const heroMat = new THREE.MeshPhysicalMaterial({
      color: 0x0e1322,
      transparent: true,
      opacity: 0.85,
      transmission: 0.28,
      thickness: 0.8,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: new THREE.Color(0x7c5cff),
      emissiveIntensity: 0.08,
    });
    const heroGroup = new THREE.Group();
    const heroMesh = new THREE.Mesh(heroGeom, heroMat);
    heroMesh.scale.set(1.6, 1.6, 1.6);
    heroGroup.add(heroMesh);
    const heroEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(heroGeom, 1),
      new THREE.LineBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: 0.4 })
    );
    heroMesh.add(heroEdges);
    heroGroup.position.set(0, -0.5, -6);
    scene.add(heroGroup);
    heroGroupRef.current = heroGroup;
    objectsRef.current.push(heroMesh);

    // Typing dots inside hero bubble
    const dotGeoHero = new THREE.SphereGeometry(0.22, 20, 20);
    const dotMatHero = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7c5cff, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.4 });
    for (let d = 0; d < 3; d++) {
      const dot = new THREE.Mesh(dotGeoHero, dotMatHero);
      dot.position.set(-0.7 + d * 0.7, 0.15, 0.25);
      heroGroup.add(dot);
      heroDotsRef.current.push(dot);
    }

    // Message tiles stack under hero bubble
    const messageGroup = new THREE.Group();
    messageGroup.position.set(0, -2.4, -5.5);
    scene.add(messageGroup);
    const tileGeo = new THREE.PlaneGeometry(3.2, 0.6);
    for (let t = 0; t < 7; t++) {
      const tileMat = new THREE.MeshBasicMaterial({ color: 0x7c5cff, transparent: true, opacity: 0.25 });
      const tile = new THREE.Mesh(tileGeo, tileMat);
      tile.position.set((Math.random() - 0.5) * 1.4, -t * 0.5, 0);
      (tile as any).userData = { speed: 0.006 + Math.random() * 0.004, resetY: -3 };
      messageGroup.add(tile);
      messageTilesRef.current.push(tile);
      const tileEdges = new THREE.LineSegments(new THREE.EdgesGeometry(tileGeo), new THREE.LineBasicMaterial({ color: 0x3bc9db, transparent: true, opacity: 0.35 }));
      tile.add(tileEdges);
    }

    const messages = ['Hey there!', 'Ready to chat?', 'Typing…', 'Real-time sync', 'Message sent', 'Delivered ✓'];
    messages.forEach((msg, i) => {
      const isRight = i % 2 === 0;
      const geom = buildBubbleGeometry(isRight);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x0e1322,
        roughness: 0.45,
        metalness: 0.35,
        envMapIntensity: 0.8,
        emissive: new THREE.Color(isRight ? 0x7c5cff : 0x3bc9db),
        emissiveIntensity: 0.16,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set((isRight ? 1 : -1) * (6.5 + Math.random() * 3), -5 + i * 2.0, -1.0 + Math.random() * 1.0);
      mesh.rotation.y = (isRight ? -1 : 1) * 0.25;
      chatGroup.add(mesh);
      chatMeshesRef.current.push(mesh);
      objectsRef.current.push(mesh);

      // glowing edges overlay for readability
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geom, 1),
        new THREE.LineBasicMaterial({ color: isRight ? 0x7c5cff : 0x3bc9db, transparent: true, opacity: 0.35 })
      );
      mesh.add(edges);

      // text overlay as small plane slightly in front of bubble
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

      if (msg.includes('Typing')) {
        const dotsGroup = new THREE.Group();
        const dotGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const dotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7c5cff, emissiveIntensity: 0.8, roughness: 0.4, metalness: 0.3 });
        for (let d = 0; d < 3; d++) {
          const dot = new THREE.Mesh(dotGeo, dotMat);
          dot.position.set(-0.4 + d * 0.4, 0.6, 0.01);
          dotsGroup.add(dot);
        }
        dotsGroup.position.copy(mesh.position).add(new THREE.Vector3(0, 0.6, 0));
        chatGroup.add(dotsGroup);
        typingDotGroupsRef.current.push(dotsGroup);
      }
    });

    // Camera position
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    // Raycaster for mouse interaction
    const raycaster = new THREE.Raycaster();

    // Animation loop
    const animate = (time: number) => {
      animationRef.current = requestAnimationFrame(animate);
      
      const elapsedTime = time * 0.001;
      
      // Rotate geometric shapes
      geometries.forEach((mesh, index) => {
        mesh.rotation.x += mesh.userData.rotationSpeed.x;
        mesh.rotation.y += mesh.userData.rotationSpeed.y;
        mesh.rotation.z += mesh.userData.rotationSpeed.z;
        
        // Base floating target and spring back
        const baseY = mesh.userData.originalPosition.y + Math.sin(elapsedTime + index) * 2;
        const baseTarget = new THREE.Vector3(
          mesh.userData.originalPosition.x,
          baseY,
          mesh.userData.originalPosition.z
        );
        const toBase = baseTarget.sub(mesh.position).multiplyScalar(0.02);
        mesh.userData.velocity.add(toBase);
        mesh.userData.velocity.multiplyScalar(0.96);
        mesh.position.add(mesh.userData.velocity);
      });

      // Raycast push effect
      if (isMouseInitializedRef.current && sceneRef.current) {
        const { camera } = sceneRef.current;
        raycaster.setFromCamera(mouseNdcRef.current, camera);
        const intersects = raycaster.intersectObjects(objectsRef.current, false);
        for (let i = 0; i < Math.min(intersects.length, 5); i++) {
          const hit = intersects[i];
          const m = hit.object as THREE.Mesh;
          const dir = m.position.clone().sub(hit.point).normalize();
          if (!m.userData.velocity) m.userData.velocity = new THREE.Vector3();
          m.userData.velocity.add(dir.multiplyScalar(0.08));
        }
      }

      // Rotate particles - much slower
      particles.rotation.y = elapsedTime * 0.01; // Much slower
      particles.rotation.x = Math.sin(elapsedTime * 0.1) * 0.02; // Much slower

      // Pulse typing dots
      typingDotGroupsRef.current.forEach((grp, gi) => {
        grp.children.forEach((c, ci) => {
          const scale = 0.9 + Math.sin(elapsedTime * 4 + gi + ci * 0.6) * 0.12;
          c.scale.setScalar(scale);
        });
      });

      // Animate hero
      if (heroGroupRef.current) {
        const g = heroGroupRef.current;
        g.rotation.y = Math.sin(elapsedTime * 0.25) * 0.12;
        const mp = mousePositionRef.current;
        g.position.x += (mp.x * 0.2 - g.position.x) * 0.04;
        g.position.y += (-0.5 + mp.y * -0.05 - g.position.y) * 0.04;
      }
      heroDotsRef.current.forEach((dot, i) => {
        const s = 0.9 + Math.sin(elapsedTime * 4 + i * 0.6) * 0.15;
        dot.scale.setScalar(s);
      });
      messageTilesRef.current.forEach((tile) => {
        const d = (tile as any).userData;
        tile.position.y += d.speed;
        if (tile.position.y > 2.2) {
          tile.position.y = d.resetY;
          tile.position.x = (Math.random() - 0.5) * 1.4;
        }
      });

      // Float chat sprites subtly
      chatSprites.forEach((s, i) => {
        const sp = s.userData.floatSpeed as number;
        s.position.y = (s.userData.baseY as number) + Math.sin(elapsedTime * sp + i) * 2;
        s.rotation.z = Math.sin(elapsedTime * 0.2 + i) * 0.1;
      });

      // Camera subtle movement - much slower
      camera.position.x = Math.sin(elapsedTime * 0.02) * 0.5; // Much slower and subtle
      camera.position.y = Math.cos(elapsedTime * 0.03) * 0.3; // Much slower and subtle
      camera.lookAt(0, 0, 0);
      
      renderer.render(scene, camera);
    };

    animate(0);

    // Handle resize
    const handleResize = () => {
      if (sceneRef.current) {
        const { camera, renderer } = sceneRef.current;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (mountElement && renderer.domElement) {
        mountElement.removeChild(renderer.domElement);
      }
      chatSprites.forEach(s => scene.remove(s));
      heroDotsRef.current = [];
      messageTilesRef.current = [];
      // Dispose chat meshes
      chatMeshesRef.current.forEach((m) => {
        m.geometry.dispose();
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat.map) mat.map.dispose();
        mat.dispose();
      });
      chatMeshesRef.current = [];
      renderer.dispose();
    };
  }, []);

  // Mouse movement handler with dampening
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const newX = (event.clientX / window.innerWidth - 0.5) * 10;
      const newY = (event.clientY / window.innerHeight - 0.5) * 10;
      const ndcX = (event.clientX / window.innerWidth) * 2 - 1;
      const ndcY = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseNdcRef.current.set(ndcX, ndcY);
      
      if (!isMouseInitialized) {
        // First mouse movement - set position immediately without animation
        mousePositionRef.current = { x: newX, y: newY };
        setIsMouseInitialized(true);
        isMouseInitializedRef.current = true;
      } else {
        // Subsequent movements - smooth interpolation
        const prev = mousePositionRef.current;
        mousePositionRef.current = {
          x: prev.x + (newX - prev.x) * 0.1,
          y: prev.y + (newY - prev.y) * 0.1,
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMouseInitialized]);

  const handleJoinClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isValid) {
      event.preventDefault();
      return;
    }
    
    // Add pulse animation class temporarily
    const button = event.currentTarget;
    button.classList.add(styles.pulse);
    setTimeout(() => {
      button.classList.remove(styles.pulse);
      // Navigate to chat (in real app, use router)
      console.log(`Joining room "${room}" as "${name}"`);
    }, 300);
  };

  return (
    <div className={styles.page}>
      <div ref={mountRef} className={styles.threeBg} />
      <div className={styles.gridGlow} />
      <div className={styles.card}>
        <div className={styles.logoRow}>
          <div className={styles.logoMark}><span role="img" aria-label="chat">💬</span></div>
          <div className={styles.logoText}>NebulaChat</div>
        </div>
        <h1 className={styles.heading}>Join the Neural Network</h1>
        <p className={styles.subheading}>Connect to the quantum communication grid. Real‑time consciousness sync.</p>
        <div className={styles.form}>
          <div className={styles.formRow}>
            <label className={styles.label} htmlFor="name">Neural ID</label>
            <input
              id="name"
              placeholder="e.g. Alex Quantum"
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.label} htmlFor="room">Dimension Portal</label>
            <input
              id="room"
              placeholder="e.g. quantum-realm"
              className={styles.input}
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>
          <button className={styles.cta} onClick={handleJoinClick} disabled={!isValid}>
            Initialize Connection
            <span className={styles.ctaShine} />
          </button>
        </div>
        <div className={styles.footerNote}>Neural link established. Quantum encryption active.</div>
      </div>
      <div className={styles.orbOne} />
      <div className={styles.orbTwo} />
    </div>
  );
};

export default NebulaChat;