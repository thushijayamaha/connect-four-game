import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ROWS = 6;
const COLUMNS = 7;
const CELL_SPACING = 1.08;
const BOARD_WIDTH = 7.75;
const BOARD_HEIGHT = 6.7;
const BOARD_DEPTH = 0.34;
const HOLE_RADIUS = 0.46;
const DISC_RADIUS = 0.425;
const DISC_DEPTH = 0.18;
const DISC_FRONT = DISC_DEPTH / 2 + 0.018;
const DROP_DURATION = 440;

const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null));
const cellPosition = (row, column) => ({
  x: (column - (COLUMNS - 1) / 2) * CELL_SPACING,
  y: ((ROWS - 1) / 2 - row) * CELL_SPACING,
});

const createCanvasTexture = (paint) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  paint(canvas.getContext('2d'));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

const createTokenTexture = (computer) => createCanvasTexture((context) => {
  const gradient = context.createRadialGradient(76, 64, 8, 133, 139, 176);
  const stops = computer
    ? [[0, '#fff8cf'], [0.2, '#ffe98a'], [0.48, '#f6ca4f'], [0.76, '#e8a928'], [1, '#aa621a']]
    : [[0, '#ffd8ce'], [0.2, '#ff9b86'], [0.48, '#f15d52'], [0.76, '#d83e3c'], [1, '#8f252e']];
  stops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  const reflection = context.createRadialGradient(78, 59, 4, 78, 59, 104);
  reflection.addColorStop(0, 'rgba(255,255,255,0.48)');
  reflection.addColorStop(0.28, 'rgba(255,255,255,0.17)');
  reflection.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = reflection;
  context.beginPath();
  context.ellipse(88, 66, 84, 39, -0.42, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = computer ? 'rgba(255,246,196,0.54)' : 'rgba(255,218,206,0.52)';
  context.lineWidth = 2;
  context.beginPath();
  context.arc(128, 128, 105, 0, Math.PI * 2);
  context.stroke();
});

const createBoardTexture = () => createCanvasTexture((context) => {
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, '#44a5b9');
  gradient.addColorStop(0.12, '#2188a0');
  gradient.addColorStop(0.68, '#176b85');
  gradient.addColorStop(1, '#0b405a');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  const sheen = context.createLinearGradient(0, 0, 0, 60);
  sheen.addColorStop(0, 'rgba(255,255,255,0.22)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = sheen;
  context.fillRect(0, 0, 256, 60);
});

const createHoleTexture = () => createCanvasTexture((context) => {
  const gradient = context.createRadialGradient(128, 132, 42, 128, 128, 128);
  gradient.addColorStop(0, '#03121d');
  gradient.addColorStop(0.68, '#081f30');
  gradient.addColorStop(0.9, '#12364a');
  gradient.addColorStop(1, '#267289');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  context.strokeStyle = 'rgba(141,222,230,0.3)';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(128, 128, 119, 0, Math.PI * 2);
  context.stroke();
});

const createBoardShape = () => {
  const shape = new THREE.Shape();
  shape.moveTo(-BOARD_WIDTH / 2, -BOARD_HEIGHT / 2);
  shape.lineTo(BOARD_WIDTH / 2, -BOARD_HEIGHT / 2);
  shape.lineTo(BOARD_WIDTH / 2, BOARD_HEIGHT / 2);
  shape.lineTo(-BOARD_WIDTH / 2, BOARD_HEIGHT / 2);
  shape.closePath();

  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      const { x, y } = cellPosition(row, column);
      const hole = new THREE.Path();
      hole.absarc(x, y, HOLE_RADIUS, 0, Math.PI * 2, true);
      shape.holes.push(hole);
    }
  }
  return shape;
};

const ConnectFourScene = ({ board, winningCells, hoveredColumn, showPreview }) => {
  const hostRef = useRef(null);
  const sceneStateRef = useRef(null);
  const previousBoardRef = useRef(emptyBoard());

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    if (typeof window.WebGLRenderingContext === 'undefined' && typeof window.WebGL2RenderingContext === 'undefined') {
      host.dataset.sceneUnavailable = 'true';
      return undefined;
    }

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    } catch (error) {
      host.dataset.sceneUnavailable = 'true';
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, BOARD_WIDTH / BOARD_HEIGHT, 0.1, 60);
    camera.position.set(0, 0.15, 13.2);
    camera.lookAt(0, 0, 0);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.appendChild(renderer.domElement);

    const boardGroup = new THREE.Group();
    boardGroup.rotation.set(-0.055, 0.07, -0.012);
    scene.add(boardGroup);

    scene.add(new THREE.HemisphereLight(0xe5fbff, 0x132b38, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-5, 7, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    scene.add(keyLight);
    const edgeLight = new THREE.PointLight(0x54d1d8, 30, 18);
    edgeLight.position.set(5, -2, 6);
    scene.add(edgeLight);

    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD_WIDTH - 0.14, BOARD_HEIGHT - 0.14, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x092a37, roughness: 0.52, metalness: 0.12 }),
    );
    backing.position.z = -BOARD_DEPTH / 2 - 0.08;
    backing.receiveShadow = true;
    boardGroup.add(backing);

    const boardGeometry = new THREE.ExtrudeGeometry(createBoardShape(), {
      depth: BOARD_DEPTH,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.035,
      bevelThickness: 0.035,
      curveSegments: 32,
      steps: 1,
    });
    boardGeometry.translate(0, 0, -BOARD_DEPTH / 2);
    const boardTexture = createBoardTexture();
    const boardMesh = new THREE.Mesh(boardGeometry, new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: boardTexture,
      roughness: 0.31,
      metalness: 0.19,
      clearcoat: 0.38,
      clearcoatRoughness: 0.32,
    }));
    boardMesh.castShadow = true;
    boardMesh.receiveShadow = true;
    boardGroup.add(boardMesh);

    const holeTexture = createHoleTexture();
    const holeGeometry = new THREE.CircleGeometry(HOLE_RADIUS * 0.99, 48);
    const holeMaterial = new THREE.MeshStandardMaterial({ map: holeTexture, roughness: 0.46, metalness: 0.12 });
    const holeRimGeometry = new THREE.TorusGeometry(HOLE_RADIUS * 0.975, 0.012, 8, 48);
    const holeRimMaterial = new THREE.MeshStandardMaterial({ color: 0x70bdc9, roughness: 0.36, metalness: 0.22 });
    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLUMNS; column += 1) {
        const { x, y } = cellPosition(row, column);
        const socket = new THREE.Mesh(holeGeometry, holeMaterial);
        socket.position.set(x, y, -BOARD_DEPTH / 2 + 0.018);
        socket.receiveShadow = true;
        boardGroup.add(socket);
        const lip = new THREE.Mesh(holeRimGeometry, holeRimMaterial);
        lip.position.set(x, y, -BOARD_DEPTH / 2 + 0.025);
        boardGroup.add(lip);
      }
    }

    const topHighlight = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD_WIDTH - 0.35, 0.025, 0.012),
      new THREE.MeshBasicMaterial({ color: 0xaff4f2, transparent: true, opacity: 0.42 }),
    );
    topHighlight.position.set(0, BOARD_HEIGHT / 2 - 0.09, BOARD_DEPTH / 2 + 0.008);
    boardGroup.add(topHighlight);
    const bottomEdge = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD_WIDTH - 0.3, 0.035, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x082e48, transparent: true, opacity: 0.82 }),
    );
    bottomEdge.position.set(0, -BOARD_HEIGHT / 2 + 0.07, BOARD_DEPTH / 2 + 0.01);
    boardGroup.add(bottomEdge);

    const discGeometry = new THREE.CylinderGeometry(DISC_RADIUS, DISC_RADIUS, DISC_DEPTH, 48, 1, false);
    discGeometry.rotateX(Math.PI / 2);
    const innerRingGeometry = new THREE.TorusGeometry(DISC_RADIUS * 0.82, 0.012, 8, 48);
    const winnerHaloGeometry = new THREE.TorusGeometry(DISC_RADIUS * 1.035, 0.027, 10, 56);
    const moveGlowGeometry = new THREE.TorusGeometry(DISC_RADIUS * 1.08, 0.04, 8, 48);
    const winnerInnerRingMaterial = new THREE.MeshBasicMaterial({ color: 0xffe7a0, transparent: true, opacity: 0.82 });
    const tokenTextures = { human: createTokenTexture(false), computer: createTokenTexture(true) };
    const tokenStyles = {
      human: {
        side: new THREE.MeshPhysicalMaterial({ color: 0xa52e35, roughness: 0.24, metalness: 0.08, clearcoat: 0.7 }),
        face: new THREE.MeshPhysicalMaterial({ map: tokenTextures.human, roughness: 0.2, metalness: 0.04, clearcoat: 0.85, clearcoatRoughness: 0.16, emissive: 0x200706, emissiveIntensity: 0.08 }),
        ring: new THREE.MeshStandardMaterial({ color: 0xffc6b9, roughness: 0.25, metalness: 0.16, transparent: true, opacity: 0.58 }),
      },
      computer: {
        side: new THREE.MeshPhysicalMaterial({ color: 0xa9681d, roughness: 0.24, metalness: 0.08, clearcoat: 0.7 }),
        face: new THREE.MeshPhysicalMaterial({ map: tokenTextures.computer, roughness: 0.2, metalness: 0.04, clearcoat: 0.85, clearcoatRoughness: 0.16, emissive: 0x241604, emissiveIntensity: 0.08 }),
        ring: new THREE.MeshStandardMaterial({ color: 0xffedac, roughness: 0.24, metalness: 0.18, transparent: true, opacity: 0.62 }),
      },
    };
    const winnerHaloMaterial = new THREE.MeshBasicMaterial({ color: 0xffd46c, transparent: true, opacity: 0.72, depthWrite: false });
    const moveGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xffd35c, transparent: true, opacity: 0.32, depthWrite: false });
    const discMeshes = Array.from({ length: ROWS }, () => Array(COLUMNS));

    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLUMNS; column += 1) {
        const disc = new THREE.Mesh(discGeometry, [tokenStyles.human.side, tokenStyles.human.face, tokenStyles.human.face]);
        const { x, y } = cellPosition(row, column);
        disc.position.set(x, y, DISC_FRONT);
        disc.castShadow = true;
        disc.visible = false;

        const innerRing = new THREE.Mesh(innerRingGeometry, tokenStyles.human.ring);
        innerRing.position.z = DISC_DEPTH / 2 + 0.004;
        disc.add(innerRing);
        const winnerInnerRing = new THREE.Mesh(innerRingGeometry, winnerInnerRingMaterial);
        winnerInnerRing.position.z = DISC_DEPTH / 2 + 0.006;
        winnerInnerRing.visible = false;
        disc.add(winnerInnerRing);
        const winnerHalo = new THREE.Mesh(winnerHaloGeometry, winnerHaloMaterial);
        winnerHalo.position.z = DISC_DEPTH / 2 + 0.008;
        winnerHalo.visible = false;
        disc.add(winnerHalo);
        const moveGlow = new THREE.Mesh(moveGlowGeometry, moveGlowMaterial);
        moveGlow.position.z = DISC_DEPTH / 2 + 0.01;
        moveGlow.visible = false;
        disc.add(moveGlow);
        disc.userData = { winnerHalo, winnerInnerRing, moveGlow, player: null, isWinning: false, computerGlowStartedAt: 0 };
        boardGroup.add(disc);
        discMeshes[row][column] = disc;
      }
    }

    const previewMaterial = new THREE.MeshPhysicalMaterial({
      map: tokenTextures.human,
      color: 0xffffff,
      roughness: 0.2,
      clearcoat: 0.85,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const preview = new THREE.Mesh(discGeometry, [tokenStyles.human.side, previewMaterial, previewMaterial]);
    preview.visible = false;
    preview.position.z = DISC_FRONT + 0.24;
    boardGroup.add(preview);

    const bounds = host.getBoundingClientRect();
    const initialWidth = Math.max(bounds.width, 320);
    const initialHeight = initialWidth * BOARD_HEIGHT / BOARD_WIDTH;
    renderer.setSize(initialWidth, initialHeight, false);
    sceneStateRef.current = { boardGroup, camera, renderer, scene, discMeshes, animations: [], preview, tokenStyles, winnerHaloMaterial, moveGlowMaterial };

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    resizeObserver?.observe(host);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event) => {
      const bounds = host.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    const onPointerLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };
    host.addEventListener('pointermove', onPointerMove);
    host.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', resize);

    let animationFrame;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const animate = (time) => {
      boardGroup.rotation.y += ((0.07 + pointer.x * 0.12) - boardGroup.rotation.y) * 0.035;
      boardGroup.rotation.x += ((-0.055 - pointer.y * 0.07) - boardGroup.rotation.x) * 0.035;
      for (let index = sceneStateRef.current.animations.length - 1; index >= 0; index -= 1) {
        const drop = sceneStateRef.current.animations[index];
        const progress = reducedMotion ? 1 : Math.min((time - drop.startedAt) / DROP_DURATION, 1);
        if (progress < 0.86) {
          const fallProgress = progress / 0.86;
          drop.mesh.position.y = drop.startY + (drop.targetY - drop.startY) * fallProgress * fallProgress;
        } else {
          const bounceProgress = (progress - 0.86) / 0.14;
          drop.mesh.position.y = drop.targetY - Math.sin(bounceProgress * Math.PI) * 0.075;
        }
        drop.mesh.position.z = DISC_FRONT + Math.sin(progress * Math.PI) * 0.08;
        if (progress >= 1) {
          drop.mesh.position.y = drop.targetY;
          drop.mesh.position.z = DISC_FRONT;
          drop.mesh.rotation.z = 0;
          sceneStateRef.current.animations.splice(index, 1);
        }
      }

      const pulse = 0.3 + (Math.sin(time * 0.004) + 1) * 0.11;
      for (const row of sceneStateRef.current.discMeshes) {
        for (const disc of row) {
          if (disc.userData.isWinning) {
            const scale = 1 + (Math.sin(time * 0.005) + 1) * 0.03;
            disc.scale.setScalar(scale);
            disc.userData.winnerHalo.material.opacity = pulse;
            disc.userData.winnerInnerRing.material.opacity = 0.72 + (Math.sin(time * 0.005) + 1) * 0.12;
          } else if (disc.scale.x !== 1) {
            disc.scale.setScalar(1);
          }
          const glowAge = time - disc.userData.computerGlowStartedAt;
          const glowActive = disc.userData.computerGlowStartedAt > 0 && glowAge < 600;
          disc.userData.moveGlow.visible = glowActive;
          if (glowActive) disc.userData.moveGlow.material.opacity = 0.34 * (1 - glowAge / 600);
        }
      }
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      resizeObserver?.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      host.removeEventListener('pointerleave', onPointerLeave);
      boardGeometry.dispose();
      discGeometry.dispose();
      innerRingGeometry.dispose();
      winnerHaloGeometry.dispose();
      moveGlowGeometry.dispose();
      holeGeometry.dispose();
      holeRimGeometry.dispose();
      tokenTextures.human.dispose();
      tokenTextures.computer.dispose();
      boardTexture.dispose();
      holeTexture.dispose();
      scene.traverse((object) => {
        if (object.geometry && object.geometry !== boardGeometry && object.geometry !== discGeometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      sceneStateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const sceneState = sceneStateRef.current;
    if (!sceneState) return;
    const previousBoard = previousBoardRef.current;

    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLUMNS; column += 1) {
        const player = board[row][column];
        const previousPlayer = previousBoard[row][column];
        const disc = sceneState.discMeshes[row][column];
        if (!player) {
          disc.visible = false;
          disc.userData.isWinning = false;
          disc.userData.player = null;
          continue;
        }
        if (player !== previousPlayer) {
          const computer = player === 'computer';
          const style = sceneState.tokenStyles[player];
          disc.material = [style.side, style.face, style.face];
          disc.userData.player = player;
          const { y } = cellPosition(row, column);
          disc.visible = true;
          disc.position.y = y + 6.4;
          sceneState.animations.push({ mesh: disc, startY: disc.position.y, targetY: y, startedAt: performance.now() });
          if (computer) disc.userData.computerGlowStartedAt = performance.now();
        }
      }
    }
    previousBoardRef.current = board.map((row) => [...row]);
  }, [board]);

  useEffect(() => {
    const sceneState = sceneStateRef.current;
    if (!sceneState) return;
    const winners = new Set(winningCells.slice(0, 4).map(([row, column]) => `${row}:${column}`));
    for (let row = 0; row < ROWS; row += 1) {
      for (let column = 0; column < COLUMNS; column += 1) {
        const disc = sceneState.discMeshes[row][column];
        const isWinning = winners.has(`${row}:${column}`);
        disc.userData.isWinning = isWinning;
        disc.userData.winnerHalo.visible = isWinning;
        disc.userData.winnerInnerRing.visible = isWinning;
      }
    }
  }, [winningCells]);

  useEffect(() => {
    const sceneState = sceneStateRef.current;
    if (!sceneState) return;
    const preview = sceneState.preview;
    const visible = showPreview && hoveredColumn !== null && hoveredColumn !== undefined;
    preview.visible = visible;
    if (visible) {
      const { x, y } = cellPosition(0, hoveredColumn);
      preview.position.set(x, y + CELL_SPACING * 0.45, DISC_FRONT + 0.24);
    }
  }, [hoveredColumn, showPreview]);

  return (
    <div className='scene-frame'>
      <div className='scene-host' ref={hostRef} aria-hidden='true' />
      <div className='scene-fallback' aria-hidden='true'>
        {board.map((row, rowIndex) => (
          <div className='fallback-row' key={rowIndex}>
            {row.map((cell, columnIndex) => {
              const isWinning = winningCells.slice(0, 4).some(([winRow, winColumn]) => winRow === rowIndex && winColumn === columnIndex);
              return (
                <div className='fallback-hole' key={columnIndex}>
                  {cell && <span className={`fallback-disc ${cell} ${isWinning ? 'winning' : ''}`} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className='scene-accessibility' role='grid' aria-label='Connect Four board, 7 columns by 6 rows'>
        {board.map((row, rowIndex) => (
          <div role='row' key={rowIndex}>
            {row.map((cell, columnIndex) => (
              <div
                role='gridcell'
                aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}: ${cell || 'empty'}`}
                key={columnIndex}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConnectFourScene;