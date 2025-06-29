
// "use client";

// import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
// import { cn } from '@/lib/utils';

// type Node = {
//   id: string;
//   detail: string;
//   type: string;
// };

// type Relationship = {
//   source: string;
//   target: string;
//   type: string;
// };

// type KnowledgeGraphProps = {
//   nodes: Node[];
//   relationships: Relationship[];
//   zoom: number;
//   setZoom: (zoom: number) => void;
// };

// type NodePosition = {
//   x: number;
//   y: number;
//   vx: number;
//   vy: number;
//   fx: number;
//   fy: number;
// };

// const SVG_WIDTH = 800;
// const SVG_HEIGHT = 600;
// const NODE_WIDTH = 140;
// const NODE_HEIGHT = 60;
// const MAX_LABEL_LENGTH = 20;

// // Simulation parameters
// const REPULSION_STRENGTH = 25000;
// const LINK_DISTANCE = 280;
// const LINK_STRENGTH = 0.5;
// const CENTER_FORCE_STRENGTH = 0.03;
// const DAMPING = 0.8;


// // Color palette for node types
// const NODE_COLORS = [
//   'hsl(var(--chart-1))',
//   'hsl(var(--chart-2))',
//   'hsl(var(--chart-3))',
//   'hsl(var(--chart-4))',
//   'hsl(var(--chart-5))',
//   'hsl(var(--primary))',
//   'hsl(var(--secondary-foreground))',
// ];

// function getIntersectionPoint(source: { x: number, y: number }, target: { x: number, y: number }, width: number, height: number) {
//   const w = width / 2;
//   const h = height / 2;
//   const dx = target.x - source.x;
//   const dy = target.y - source.y;
//   if (dx === 0 && dy === 0) return source;

//   const tan_phi = h / w;
//   const tan_theta = Math.abs(dy / dx);

//   let x, y;
//   if (tan_theta < tan_phi) {
//     // Intersects left or right
//     x = dx > 0 ? w : -w;
//     y = dy * (x / dx);
//   } else {
//     // Intersects top or bottom
//     y = dy > 0 ? h : -h;
//     x = dx * (y / dy);
//   }
//   return { x: source.x + x, y: source.y + y };
// }

// export default function KnowledgeGraph({ nodes, relationships, zoom, setZoom }: KnowledgeGraphProps) {
//   const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
//   const [pan, setPan] = useState({ x: 0, y: 0 });
//   const [isPanning, setIsPanning] = useState(false);
//   const [startPan, setStartPan] = useState({ x: 0, y: 0 });
//   const [draggedNode, setDraggedNode] = useState<string | null>(null);
//   const [hoveredNode, setHoveredNode] = useState<string | null>(null);
//   const svgRef = useRef<SVGSVGElement>(null);
//   const simulationRef = useRef<number | null>(null);

//   const nodeTypeColors = useMemo(() => {
//     const typeColorMap = new Map<string, string>();
//     const uniqueTypes = [...new Set(nodes.map(n => n.type))];
//     uniqueTypes.forEach((type, i) => {
//       typeColorMap.set(type, NODE_COLORS[i % NODE_COLORS.length]);
//     });
//     return typeColorMap;
//   }, [nodes]);

//   const getNodeColor = useCallback((nodeType: string) => {
//     return nodeTypeColors.get(nodeType) || 'hsl(var(--muted-foreground))';
//   }, [nodeTypeColors]);

//   // Initialize node positions
//   useEffect(() => {
//     setNodePositions(currentPositions => {
//       const newPositions = new Map<string, NodePosition>();
//       const centerX = SVG_WIDTH / 2;
//       const centerY = SVG_HEIGHT / 2;

//       nodes.forEach(node => {
//         const existing = currentPositions.get(node.id);
//         if (existing) {
//           newPositions.set(node.id, existing);
//         } else {
//           newPositions.set(node.id, {
//             x: centerX + (Math.random() - 0.5) * 100,
//             y: centerY + (Math.random() - 0.5) * 100,
//             vx: 0, vy: 0, fx: 0, fy: 0
//           });
//         }
//       });
//       return newPositions;
//     });
//   }, [nodes]);


//   // Force-directed layout simulation
//   useEffect(() => {
//     const runSimulation = () => {
//       setNodePositions(currentPositions => {
//         const newPositions = new Map(currentPositions);
//         const nodeIds = Array.from(newPositions.keys());

//         // Reset forces
//         nodeIds.forEach(id => {
//           const node = newPositions.get(id)!;
//           node.fx = 0;
//           node.fy = 0;
//         });

//         // Calculate forces
//         for (let i = 0; i < nodeIds.length; i++) {
//           const nodeA = newPositions.get(nodeIds[i])!;

//           // Center force
//           const dxCenter = SVG_WIDTH / 2 - nodeA.x;
//           const dyCenter = SVG_HEIGHT / 2 - nodeA.y;
//           nodeA.fx += dxCenter * CENTER_FORCE_STRENGTH;
//           nodeA.fy += dyCenter * CENTER_FORCE_STRENGTH;

//           // Repulsion force
//           for (let j = i + 1; j < nodeIds.length; j++) {
//             const nodeB = newPositions.get(nodeIds[j])!;
//             const dx = nodeA.x - nodeB.x;
//             const dy = nodeA.y - nodeB.y;
//             let distance = Math.sqrt(dx * dx + dy * dy);
//             if (distance < 1) distance = 1;

//             const force = REPULSION_STRENGTH / (distance * distance);
//             const MAX_FORCE = 5;
//             const forceX = Math.max(Math.min((dx / distance) * force, MAX_FORCE), -MAX_FORCE);
//             const forceY = Math.max(Math.min((dy / distance) * force, MAX_FORCE), -MAX_FORCE);



//             // const forceX = (dx / distance) * force;
//             // const forceY = (dy / distance) * force;

//             nodeA.fx += forceX;
//             nodeA.fy += forceY;
//             nodeB.fx -= forceX;
//             nodeB.fy -= forceY;
//           }
//         }
//         // Collision detection to avoid overlapping
//         const MIN_DISTANCE = 100;
//         for (let i = 0; i < nodeIds.length; i++) {
//           const nodeA = newPositions.get(nodeIds[i])!;
//           for (let j = i + 1; j < nodeIds.length; j++) {
//             const nodeB = newPositions.get(nodeIds[j])!;
//             const dx = nodeA.x - nodeB.x;
//             const dy = nodeA.y - nodeB.y;
//             const dist = Math.sqrt(dx * dx + dy * dy);

//             if (dist < MIN_DISTANCE && dist > 0) {
//               const overlap = (MIN_DISTANCE - dist) / 2;
//               const offsetX = (dx / dist) * overlap;
//               const offsetY = (dy / dist) * overlap;

//               nodeA.x += offsetX;
//               nodeA.y += offsetY;
//               nodeB.x -= offsetX;
//               nodeB.y -= offsetY;
//             }
//           }
//         }


//         // Link force
//         relationships.forEach(rel => {
//           const source = newPositions.get(rel.source);
//           const target = newPositions.get(rel.target);
//           if (!source || !target) return;

//           const dx = target.x - source.x;
//           const dy = target.y - source.y;
//           const distance = Math.sqrt(dx * dx + dy * dy);
//           if (distance > 0) {
//             const diff = distance - LINK_DISTANCE;
//             const forceX = (dx / distance) * diff * LINK_STRENGTH;
//             const forceY = (dy / distance) * diff * LINK_STRENGTH;
//             source.fx += forceX;
//             source.fy += forceY;
//             target.fx -= forceX;
//             target.fy -= forceY;
//           }
//         });

//         // Update velocities and positions
//         newPositions.forEach((node, id) => {
//           if (id === draggedNode) return;
//           node.vx = (node.vx + node.fx) * DAMPING;
//           node.vy = (node.vy + node.fy) * DAMPING;
//           node.x += node.vx;
//           node.y += node.vy;
//         });

//         return newPositions;
//       });

//       simulationRef.current = requestAnimationFrame(runSimulation);
//     };

//     if (nodes.length > 0) {
//       simulationRef.current = requestAnimationFrame(runSimulation);
//     }

//     return () => {
//       if (simulationRef.current) {
//         cancelAnimationFrame(simulationRef.current);
//       }
//     };
//   }, [nodes, relationships, draggedNode]);

//   const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
//     e.stopPropagation();
//     setDraggedNode(nodeId);
//     setNodePositions(currentPositions => {
//       const newPositions = new Map(currentPositions);
//       const node = newPositions.get(nodeId);
//       if (node) {
//         node.vx = 0;
//         node.vy = 0;
//       }
//       return newPositions;
//     });
//   };

//   const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
//     if ((e.target as SVGElement).closest('.graph-node')) return;
//     e.preventDefault();
//     setIsPanning(true);
//     setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
//   };

//   const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
//     e.preventDefault();
//     if (draggedNode && svgRef.current) {
//       const ctm = svgRef.current.getScreenCTM()?.inverse();
//       if (!ctm) return;

//       const svgPoint = svgRef.current.createSVGPoint();
//       svgPoint.x = e.clientX;
//       svgPoint.y = e.clientY;
//       const { x, y } = svgPoint.matrixTransform(ctm);
//       const transformedX = (x - pan.x) / zoom;
//       const transformedY = (y - pan.y) / zoom;

//       setNodePositions(currentPositions => {
//         const newPositions = new Map(currentPositions);
//         const node = newPositions.get(draggedNode);
//         if (node) {
//           node.x = transformedX;
//           node.y = transformedY;
//           node.vx = 0;
//           node.vy = 0;
//         }
//         return newPositions;
//       });
//     } else if (isPanning) {
//       setPan({
//         x: e.clientX - startPan.x,
//         y: e.clientY - startPan.y,
//       });
//     }
//   };

//   const handleMouseUpOrLeave = (e: React.MouseEvent<SVGSVGElement>) => {
//     e.preventDefault();
//     setDraggedNode(null);
//     setIsPanning(false);
//   };

//   const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
//     e.preventDefault();
//     if (!svgRef.current) return;

//     const scaleAmount = -e.deltaY * 0.001;
//     const newZoom = Math.max(0.1, Math.min(5, zoom + scaleAmount));

//     const svgPoint = svgRef.current.createSVGPoint();
//     svgPoint.x = e.clientX;
//     svgPoint.y = e.clientY;

//     const pointInSVG = svgPoint.matrixTransform(svgRef.current.getScreenCTM()?.inverse());

//     setPan({
//       x: pan.x - (pointInSVG.x - pan.x) * (newZoom / zoom - 1),
//       y: pan.y - (pointInSVG.y - pan.y) * (newZoom / zoom - 1)
//     });

//     setZoom(newZoom);
//   };

//   const connectedIds = useMemo(() => {
//     if (!hoveredNode) return new Set<string>();
//     const connected = new Set<string>([hoveredNode]);
//     relationships.forEach(rel => {
//       if (rel.source === hoveredNode) connected.add(rel.target);
//       if (rel.target === hoveredNode) connected.add(rel.source);
//     });
//     return connected;
//   }, [hoveredNode, relationships]);

//   const edges = useMemo(() => {
//     return relationships.map((rel) => {
//       const sourcePos = nodePositions.get(rel.source);
//       const targetPos = nodePositions.get(rel.target);
//       if (!sourcePos || !targetPos) return null;

//       const sourceIntersect = getIntersectionPoint(sourcePos, targetPos, NODE_WIDTH, NODE_HEIGHT);
//       const targetIntersect = getIntersectionPoint(targetPos, sourcePos, NODE_WIDTH, NODE_HEIGHT);

//       return {
//         ...rel,
//         startX: sourceIntersect.x,
//         startY: sourceIntersect.y,
//         endX: targetIntersect.x,
//         endY: targetIntersect.y,
//         midX: (sourcePos.x + targetPos.x) / 2,
//         midY: (sourcePos.y + targetPos.y) / 2,
//       };
//     }).filter((edge): edge is NonNullable<typeof edge> => edge !== null);
//   }, [relationships, nodePositions]);

//   const truncate = (str: string, n: number) => {
//     return (str.length > n) ? str.slice(0, n - 1) + '…' : str;
//   };

//   if (nodes.length === 0) {
//     return null;
//   }

//   return (
//     <>
//       <style>{`
//         .graph-node { cursor: pointer; }
//         .graph-svg { cursor: grab; }
//         .graph-svg:active { cursor: grabbing; }
//       `}</style>
//       <svg
//         ref={svgRef}
//         viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
//         width="100%"
//         height="100%"
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUpOrLeave}
//         onMouseLeave={handleMouseUpOrLeave}
//         onWheel={handleWheel}
//         className="graph-svg"
//       >
//         <defs>
//           <marker id="arrowhead" viewBox="0 0 10 10" markerWidth="6" markerHeight="6" refX="8" refY="5" orient="auto-start-reverse">
//             <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" />
//           </marker>
//           <marker id="arrowhead-highlight" viewBox="0 0 10 10" markerWidth="6" markerHeight="6" refX="8" refY="5" orient="auto-start-reverse">
//             <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--primary))" />
//           </marker>
//         </defs>
//         <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
//           {edges.map((edge, i) => {
//             const isHighlighted = hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);
//             return (
//               <g key={`edge-${i}`} className={cn("transition-opacity", hoveredNode && !isHighlighted ? 'opacity-30' : 'opacity-100')}>
//                 <line
//                   x1={edge.startX}
//                   y1={edge.startY}
//                   x2={edge.endX}
//                   y2={edge.endY}
//                   stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
//                   strokeWidth={isHighlighted ? "2.5" : "1.5"}
//                   markerEnd={isHighlighted ? "url(#arrowhead-highlight)" : "url(#arrowhead)"}
//                 />

//                 <text
//                   x={edge.midX}
//                   y={edge.midY}
//                   fontSize={isHighlighted ? "14" : "12"}
//                   fontWeight={isHighlighted ? "bold" : "normal"}
//                   fill={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--accent-foreground))'}
//                   textAnchor="middle"
//                   dy="-6"
//                   className="font-sans transition-all duration-200"
//                 >
//                   {edge.type}
//                 </text>

//               </g>
//             )
//           })}

//           {Array.from(nodePositions.entries()).map(([id, pos]) => {
//             const node = nodes.find(n => n.id === id);
//             if (!node) return null;

//             const isHighlighted = id === hoveredNode;
//             const isDimmed = hoveredNode && !connectedIds.has(id);
//             const nodeColor = getNodeColor(node.type);

//             return (
//               <g key={`node-${id}`} transform={`translate(${pos.x - NODE_WIDTH / 2}, ${pos.y - NODE_HEIGHT / 2})`}
//                 className="graph-node"
//                 onMouseDown={(e) => handleNodeMouseDown(e, id)}
//                 onMouseEnter={() => setHoveredNode(id)}
//                 onMouseLeave={() => setHoveredNode(null)}
//               >
//                 <title>{node.id}\nType: {node.type}\nDetail: {node.detail}</title>
//                 <rect
//                   width={NODE_WIDTH}
//                   height={NODE_HEIGHT}
//                   rx="10"
//                   ry="10"
//                   fill={nodeColor}
//                   stroke={isHighlighted ? 'hsl(var(--ring))' : nodeColor}
//                   strokeWidth={isHighlighted ? 3 : 1.5}
//                   className={cn(
//                     "transition-all",
//                     isDimmed ? 'opacity-30' : 'opacity-90',
//                     isHighlighted && 'opacity-100'
//                   )}
//                 />
//                 <foreignObject x="5" y="5" width={NODE_WIDTH - 10} height={NODE_HEIGHT - 10}>
//                   <div className="flex flex-col items-center justify-center h-full text-center pointer-events-none">
//                     <div className="font-bold text-sm" style={{ color: 'white' }}>{truncate(node.id, MAX_LABEL_LENGTH)}</div>
//                     <div className="text-xs" style={{ color: 'white', opacity: 0.8 }}>{node.type}</div>
//                   </div>
//                 </foreignObject>
//               </g>
//             );
//           })}
//         </g>
//       </svg>
//     </>
//   );
// }



"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

type Node = {
  id: string;
  detail: string;
  type: string;
};

type Relationship = {
  source: string;
  target: string;
  type: string;
};

type KnowledgeGraphProps = {
  nodes: Node[];
  relationships: Relationship[];
  zoom: number;
  setZoom: (zoom: number) => void;
};

type NodePosition = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number;
  fy: number;
};

const SVG_WIDTH = 800;
const SVG_HEIGHT = 600;
const NODE_WIDTH = 140;
const NODE_HEIGHT = 60;
const MAX_LABEL_LENGTH = 20;


// Updated simulation parameters
const REPULSION_STRENGTH = 10000; // Reduced repulsion
const LINK_DISTANCE = 250; // Adjusted link distance
const LINK_STRENGTH = 0.1; // Reduced link strength
const CENTER_FORCE_STRENGTH = 0.01; // Reduced center force
const DAMPING = 0.85; // Increased damping
const MIN_DISTANCE = 150; // Increased minimum distance
const MAX_FORCE = 15; // Force cap to prevent overshooting

const NODE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--primary))',
  'hsl(var(--secondary-foreground))',
];

function getIntersectionPoint(source: { x: number, y: number }, target: { x: number, y: number }, width: number, height: number) {
  const w = width / 2;
  const h = height / 2;
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (dx === 0 && dy === 0) return source;

  const tan_phi = h / w;
  const tan_theta = Math.abs(dy / dx);

  let x, y;
  if (tan_theta < tan_phi) {
    x = dx > 0 ? w : -w;
    y = dy * (x / dx);
  } else {
    y = dy > 0 ? h : -h;
    x = dx * (y / dy);
  }

  return { x: source.x + x, y: source.y + y };
}

export default function KnowledgeGraph({ nodes, relationships, zoom, setZoom }: KnowledgeGraphProps) {
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | null>(null);

  const nodeTypeColors = useMemo(() => {
    const map = new Map<string, string>();
    [...new Set(nodes.map(n => n.type))].forEach((type, i) => {
      map.set(type, NODE_COLORS[i % NODE_COLORS.length]);
    });
    return map;
  }, [nodes]);

  const getNodeColor = useCallback((type: string) => {
    return nodeTypeColors.get(type) ?? 'hsl(var(--muted-foreground))';
  }, [nodeTypeColors]);

  // Initialize node positions
  useEffect(() => {
    setNodePositions(prev => {
      const newMap = new Map(prev);
      const centerX = SVG_WIDTH / 2;
      const centerY = SVG_HEIGHT / 2;
      const radius = Math.min(SVG_WIDTH, SVG_HEIGHT) * 0.4;

      nodes.forEach((node, i) => {
        if (!newMap.has(node.id)) {
          const angle = (i * 2 * Math.PI) / nodes.length;
          newMap.set(node.id, {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
            vx: 0, vy: 0, fx: 0, fy: 0
          });
        }
      });

      return newMap;
    });
  }, [nodes]);

  // Force simulation
  useEffect(() => {
    const step = () => {
      setNodePositions(prev => {
        const next = new Map(prev);
        const ids = Array.from(next.keys());

        // Reset forces and apply center force
        ids.forEach(id => {
          const n = next.get(id)!;
          n.fx = 0;
          n.fy = 0;
          
          if (id !== draggedNode) {
            const dxCenter = SVG_WIDTH / 2 - n.x;
            const dyCenter = SVG_HEIGHT / 2 - n.y;
            const distCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter) || 1;
            
            n.fx += (dxCenter / distCenter) * CENTER_FORCE_STRENGTH * distCenter;
            n.fy += (dyCenter / distCenter) * CENTER_FORCE_STRENGTH * distCenter;
          }
        });

        for (let i = 0; i < ids.length; i++) {
          const a = next.get(ids[i])!;
          for (let j = i + 1; j < ids.length; j++) {
            const b = next.get(ids[j])!;
            let dx = a.x - b.x;
            let dy = a.y - b.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            dist = Math.max(1, dist);

            // Apply repulsion only when too close
            if (dist < MIN_DISTANCE * 1.5) {
              let force = REPULSION_STRENGTH / (dist * dist);
              force = Math.min(force, MAX_FORCE);
              
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              
              a.fx += fx;
              a.fy += fy;
              b.fx -= fx;
              b.fy -= fy;
            }
          }
        }

        // Link force
        relationships.forEach(rel => {
          const src = next.get(rel.source);
          const tgt = next.get(rel.target);
          if (!src || !tgt) return;
          
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Only apply link force when too far apart
          if (dist > LINK_DISTANCE) {
            const diff = dist - LINK_DISTANCE;
            const force = diff * LINK_STRENGTH;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            
            src.fx += fx;
            src.fy += fy;
            tgt.fx -= fx;
            tgt.fy -= fy;
          }
        });

        // Collision avoidance
        for (let i = 0; i < ids.length; i++) {
          const a = next.get(ids[i])!;
          for (let j = i + 1; j < ids.length; j++) {
            const b = next.get(ids[j])!;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < MIN_DISTANCE) {
              const overlap = (MIN_DISTANCE - dist) / 2;
              const moveX = (dx / dist) * overlap * 0.5;
              const moveY = (dy / dist) * overlap * 0.5;
              
              a.x += moveX;
              a.y += moveY;
              b.x -= moveX;
              b.y -= moveY;
            }
          }
        }

        // Update positions with damping
        ids.forEach(id => {
          if (id === draggedNode) return;
          const n = next.get(id)!;
          n.vx = (n.vx + n.fx) * DAMPING;
          n.vy = (n.vy + n.fy) * DAMPING;
          n.x += n.vx;
          n.y += n.vy;
          
          // Boundary constraints
          n.x = Math.max(NODE_WIDTH/2, Math.min(SVG_WIDTH - NODE_WIDTH/2, n.x));
          n.y = Math.max(NODE_HEIGHT/2, Math.min(SVG_HEIGHT - NODE_HEIGHT/2, n.y));
        });

        return next;
      });

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [nodes, relationships, draggedNode]);


  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).closest('.graph-node')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedNode && svgRef.current) {
      const ctm = svgRef.current.getScreenCTM()?.inverse();
      if (!ctm) return;

      const pt = svgRef.current.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const svgCoords = pt.matrixTransform(ctm);
      const transformedX = (svgCoords.x - pan.x) / zoom;
      const transformedY = (svgCoords.y - pan.y) / zoom;

      setNodePositions(prev => {
        const next = new Map(prev);
        const n = next.get(draggedNode!);
        if (n) {
          n.x = transformedX;
          n.y = transformedY;
          n.vx = 0;
          n.vy = 0;
        }
        return next;
      });
    } else if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;

    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = Math.max(0.1, Math.min(5, zoom + scaleAmount));
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgCoords = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    setPan({
      x: pan.x - (svgCoords.x - pan.x) * (newZoom / zoom - 1),
      y: pan.y - (svgCoords.y - pan.y) * (newZoom / zoom - 1),
    });
    setZoom(newZoom);
  };

  const edges = useMemo(() => {
    return relationships.map(rel => {
      const src = nodePositions.get(rel.source);
      const tgt = nodePositions.get(rel.target);
      if (!src || !tgt) return null;
      const start = getIntersectionPoint(src, tgt, NODE_WIDTH, NODE_HEIGHT);
      const end = getIntersectionPoint(tgt, src, NODE_WIDTH, NODE_HEIGHT);
      return {
        ...rel,
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
        midX: (src.x + tgt.x) / 2,
        midY: (src.y + tgt.y) / 2,
      };
    }).filter(Boolean) as any[];
  }, [relationships, nodePositions]);

  const connectedIds = useMemo(() => {
    const connected = new Set<string>();
    if (!hoveredNode) return connected;
    connected.add(hoveredNode);
    relationships.forEach(r => {
      if (r.source === hoveredNode) connected.add(r.target);
      if (r.target === hoveredNode) connected.add(r.source);
    });
    return connected;
  }, [hoveredNode, relationships]);

  const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  if (!nodes.length) return null;

  return (
    <>
      <style>{`
        .graph-node { cursor: pointer; }
        .graph-svg { cursor: grab; }
        .graph-svg:active { cursor: grabbing; }
      `}</style>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        width="100%"
        height="100%"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="graph-svg"
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {edges.map((edge, i) => {
            const isHighlighted = hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);
            return (
              <g key={`edge-${i}`} className={cn(hoveredNode && !isHighlighted ? 'opacity-30' : 'opacity-100')}>
                <line
                  x1={edge.startX}
                  y1={edge.startY}
                  x2={edge.endX}
                  y2={edge.endY}
                  stroke={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                />
                <text
                  x={edge.midX}
                  y={edge.midY}
                  fontSize={isHighlighted ? 14 : 12}
                  fill={isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                  textAnchor="middle"
                  dy="-6"
                >
                  {edge.type}
                </text>
              </g>
            );
          })}

          {Array.from(nodePositions.entries()).map(([id, pos]) => {
            const node = nodes.find(n => n.id === id);
            if (!node) return null;
            const isDimmed = hoveredNode && !connectedIds.has(id);
            const isHighlighted = id === hoveredNode;
            const nodeColor = getNodeColor(node.type);

            return (
              <g
                key={id}
                transform={`translate(${pos.x - NODE_WIDTH / 2}, ${pos.y - NODE_HEIGHT / 2})`}
                className="graph-node"
                onMouseDown={(e) => { e.stopPropagation(); setDraggedNode(id); }}
                onMouseEnter={() => setHoveredNode(id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={10}
                  ry={10}
                  fill={nodeColor}
                  stroke={isHighlighted ? 'hsl(var(--ring))' : nodeColor}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  className={cn(isDimmed ? 'opacity-30' : 'opacity-100')}
                />
                <foreignObject x={5} y={5} width={NODE_WIDTH - 10} height={NODE_HEIGHT - 10}>
                  <div className="flex flex-col items-center justify-center h-full text-white text-sm text-center pointer-events-none">
                    <div className="font-bold">{truncate(node.id, MAX_LABEL_LENGTH)}</div>
                    <div className="text-xs opacity-80">{node.type}</div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>
    </>
  );
}
