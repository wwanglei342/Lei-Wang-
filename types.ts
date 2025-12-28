
export interface SpindleParams {
  pressure: number; // MPa
  speed: number;    // RPM
  load: number;     // N
  eccentricity: number; // 0 to 1 ratio
  material: 'steel' | 'titanium' | 'ceramic';
  maintenanceMode: boolean;
}

export interface SimulationState extends SpindleParams {
  isRunning: boolean;
  showPressureMap: boolean;
  showAirParticles: boolean;
  activeExplanationIndex: number;
  viewMode: '2d' | '3d';
}

export interface ExplanatoryStep {
  title: string;
  content: string;
  cameraTarget?: { x: number, y: number, z: number };
}
