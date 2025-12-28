
import { ExplanatoryStep } from './types';

export const EXPLANATORY_STEPS: ExplanatoryStep[] = [
  {
    title: "气源供应与管线系统",
    content: "外部高压气源通过透明管路进入主轴入口。在这个过程中，气体经过精密过滤与二级稳压，确保进入主轴内部的气体不含颗粒杂质。"
  },
  {
    title: "精密微孔节流技术",
    content: "主轴定子内壁分布着8-12个微米级节流孔。高压气体通过这些孔口时产生剧烈膨胀，在转子表面形成具有特定压力分布的高刚度气垫。"
  },
  {
    title: "动/静结合承载机理",
    content: "止推盘（中部的圆盘）不仅起到轴向定位作用，其两侧的微小间隙提供了极强的抗负载能力，确保主轴在轴向振动小于5纳米。"
  },
  {
    title: "流场动力学解析",
    content: "气体在高速旋转的转子带动下产生周向剪切力。通过流线可视化可以看到，气体从节流孔射入后，呈螺旋状流向两侧排气口。"
  },
  {
    title: "高性能材质与热力稳定性",
    content: "转子可选用钛合金或精密陶瓷。这些材料的热膨胀系数极低，配合排气流动的自然冷却，可在大负载加工下维持恒定的几何精度。"
  }
];

export const SPINDLE_COLORS = {
  stator: "#e2e8f0",
  rotor: "#94a3b8",
  airFilmHigh: "#0ea5e9",
  airFilmLow: "#38bdf8",
  pressureHot: "#ef4444",
  pressureCold: "#10b981"
};
