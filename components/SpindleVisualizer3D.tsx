
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { SpindleParams } from '../types';

interface Props {
  params: SpindleParams;
  isRunning: boolean;
}

const SpindleVisualizer3D: React.FC<Props> = ({ params, isRunning }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rotorRef = useRef<THREE.Group>(null);
  const gaugeNeedleRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 15, 60);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(35, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(15, 10, 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- Studio Lighting ---
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
    light1.position.set(10, 20, 10);
    light1.castShadow = true;
    scene.add(light1);

    const light2 = new THREE.PointLight(0x38bdf8, 0.8);
    light2.position.set(-10, 5, 5);
    scene.add(light2);

    // --- Materials ---
    const matGlass = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8, transmission: 0.9, thickness: 0.5, roughness: 0.1, transparent: true, opacity: 0.3
    });
    const matMetal = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8, metalness: 0.9, roughness: 0.1, clearcoat: 1.0
    });
    const matPlastic = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const matBrass = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });

    // --- 1. Gas Supply System (气源系统) ---
    const supplyGroup = new THREE.Group();
    supplyGroup.position.set(8, -4, 5);
    
    // Regulator Tank
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3, 32), matMetal);
    supplyGroup.add(tank);
    
    // Pressure Gauge
    const gaugeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.2, 32), matPlastic);
    gaugeBody.rotation.x = Math.PI / 2;
    gaugeBody.position.set(0, 1.8, 0.5);
    supplyGroup.add(gaugeBody);
    
    const needleGeom = new THREE.BoxGeometry(0.05, 0.5, 0.05);
    needleGeom.translate(0, 0.25, 0);
    const needle = new THREE.Mesh(needleGeom, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    needle.position.set(0, 1.8, 0.65);
    supplyGroup.add(needle);
    (gaugeNeedleRef as any).current = needle;

    scene.add(supplyGroup);

    // Main Pipe
    const pipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(8, -2.2, 5.5),
      new THREE.Vector3(5, -1, 4),
      new THREE.Vector3(2, 1, 2),
      new THREE.Vector3(0, 2, 0)
    ]);
    const pipe = new THREE.Mesh(new THREE.TubeGeometry(pipeCurve, 32, 0.15, 12, false), matGlass);
    scene.add(pipe);

    // --- 2. Spindle Structure (主轴结构) ---
    const spindleGroup = new THREE.Group();
    
    // Housing with internal galleries
    const housingOuter = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 10, 64, 1, true, 0, Math.PI * 1.5), matGlass);
    housingOuter.rotation.z = Math.PI / 2;
    spindleGroup.add(housingOuter);

    // Internal Distribution Gallery (配气室)
    const gallery = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.1, 16, 100), matBrass);
    gallery.rotation.y = Math.PI / 2;
    gallery.position.x = -1;
    spindleGroup.add(gallery);

    // Orifices (节流孔)
    const oriMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
    for(let i=0; i<8; i++){
      const angle = (i/8) * Math.PI * 2;
      const ori = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 8), oriMat);
      ori.position.set(-1, Math.cos(angle)*1.6, Math.sin(angle)*1.6);
      ori.rotation.z = Math.PI / 2;
      spindleGroup.add(ori);
    }

    scene.add(spindleGroup);

    // Rotor
    const rotorGroup = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 14, 64), matMetal);
    shaft.rotation.z = Math.PI / 2;
    rotorGroup.add(shaft);

    const disk = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 0.5, 64), matMetal);
    disk.rotation.z = Math.PI / 2;
    disk.position.x = -1.5;
    rotorGroup.add(disk);

    scene.add(rotorGroup);
    (rotorRef as any).current = rotorGroup;

    // --- 3. Fluid Flow (气流细节) ---
    const pCount = 5000;
    const pGeom = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for(let i=0; i<pCount; i++){
      pPos[i*3] = (Math.random() - 0.5) * 12;
      pPos[i*3+1] = Math.cos(Math.random()*Math.PI*2)*1.6;
      pPos[i*3+2] = Math.sin(Math.random()*Math.PI*2)*1.6;
    }
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.03, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const pPoints = new THREE.Points(pGeom, pMat);
    scene.add(pPoints);
    (particlesRef as any).current = pPoints;

    // --- Animation ---
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const speed = params.speed / 60000;
      const pressure = params.pressure / 0.8;

      if(isRunning){
        rotorGroup.rotation.x += speed * 15 * delta;
        
        // Needle dynamic
        if(gaugeNeedleRef.current){
          gaugeNeedleRef.current.rotation.z = -Math.PI/2 + (pressure * Math.PI);
        }

        // Particle Flow
        if(particlesRef.current){
          const attr = particlesRef.current.geometry.attributes.position;
          for(let i=0; i<pCount; i++){
            const idx = i*3;
            attr.array[idx] -= 0.15 * pressure; // Flow along axis
            
            // Tangential swirl
            const y = attr.array[idx+1];
            const z = attr.array[idx+2];
            const swirl = speed * 0.15;
            attr.array[idx+1] = y * Math.cos(swirl) - z * Math.sin(swirl);
            attr.array[idx+2] = y * Math.sin(swirl) + z * Math.cos(swirl);

            if(attr.array[idx] < -8) attr.array[idx] = 6;
          }
          attr.needsUpdate = true;
        }

        // Maintenance Pulsing
        if(params.maintenanceMode){
           oriMat.color.setHSL(0.5 + Math.sin(Date.now()*0.005)*0.1, 1, 0.5);
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if(!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [params.material, params.maintenanceMode]);

  return (
    <div ref={containerRef} className="w-full h-full relative cursor-move bg-slate-50">
      {/* 实时动态监测 HUD */}
      <div className="absolute top-8 left-8 space-y-4 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200 shadow-2xl shadow-sky-100 flex items-center space-x-6">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">进气压力仪表 (Primary)</p>
            <div className="flex items-baseline space-x-2">
               <span className="text-3xl font-mono font-black text-slate-800">{params.pressure.toFixed(2)}</span>
               <span className="text-xs font-bold text-sky-600">MPa</span>
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200"></div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">气路流速 (Flow)</p>
            <p className="text-xl font-mono font-bold text-emerald-500">{(params.pressure * 45).toFixed(1)} <span className="text-[10px]">SCFM</span></p>
          </div>
        </div>
        
        {/* 位移轨迹模拟 */}
        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200 w-48 shadow-lg">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">轴心位移轨迹 (Orbit)</p>
           <div className="h-32 w-full border border-slate-100 rounded-xl relative overflow-hidden bg-slate-50 flex items-center justify-center">
              <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10">
                <div className="border border-slate-900"></div><div className="border border-slate-900"></div><div className="border border-slate-900"></div><div className="border border-slate-900"></div>
              </div>
              {/* Animated Orbit Path */}
              <div className={`w-8 h-8 rounded-full border-2 border-sky-400/50 flex items-center justify-center ${isRunning ? 'animate-pulse' : ''}`}>
                 <div className="w-1.5 h-1.5 bg-sky-600 rounded-full" style={{
                   transform: `translate(${Math.sin(Date.now()*0.01) * (params.load/100)}px, ${Math.cos(Date.now()*0.01) * (params.load/100)}px)`
                 }}></div>
              </div>
              <p className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-400">Scale: 10nm/div</p>
           </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 flex flex-col items-end space-y-2 pointer-events-none">
        <div className="px-4 py-2 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200 text-xs font-bold flex items-center space-x-2">
           <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
           <span>静态刚度已锁定: {(params.pressure * 180).toFixed(0)} N/μm</span>
        </div>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">物理引擎: AeroDyn v4.2 Precision</p>
      </div>
    </div>
  );
};

export default SpindleVisualizer3D;
