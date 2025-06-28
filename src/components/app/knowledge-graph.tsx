
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';

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

const SVG_WIDTH = 800;
const SVG_HEIGHT = 600;
const RADIUS = 280;
const NODE_WIDTH = 120;
const NODE_HEIGHT = 50;
const MAX_LABEL_LENGTH = 16;


function getIntersectionPoint(source: {x: number, y: number}, target: {x: number, y: number}, width: number, height: number) {
    const w = width / 2;
    const h = height / 2;

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    
    if (dx === 0 && dy === 0) return source;

    let x, y;
    
    if (Math.abs(dy) * w > Math.abs(dx) * h) {
        // Intersects top or bottom
        y = dy > 0 ? h : -h;
        x = dy !== 0 ? dx * y / dy : 0;
    } else {
        // Intersects left or right
        x = dx > 0 ? w : -w;
        y = dx !== 0 ? dy * x / dx : 0;
    }
    
    return {x: source.x + x, y: source.y + y};
}


export default function KnowledgeGraph({ nodes, relationships, zoom, setZoom }: KnowledgeGraphProps) {
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const newPositions = new Map<string, { x: number; y: number }>();
    if (nodes.length === 0) {
        setNodePositions(newPositions);
        return;
    }

    const angleStep = (2 * Math.PI) / nodes.length;
    const centerX = SVG_WIDTH / 2;
    const centerY = SVG_HEIGHT / 2;

    nodes.forEach((node, i) => {
      const x = centerX + RADIUS * Math.cos(i * angleStep - Math.PI / 2);
      const y = centerY + RADIUS * Math.sin(i * angleStep - Math.PI / 2);
      newPositions.set(node.id, { x, y });
    });
    setNodePositions(newPositions);
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).closest('.graph-node')) return;
    e.preventDefault();
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;

    const scaleAmount = -e.deltaY * 0.001;
    const newZoom = Math.max(0.1, Math.min(5, zoom + scaleAmount));
    
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = e.clientX;
    svgPoint.y = e.clientY;

    const pointInSVG = svgPoint.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    
    setPan({
      x: pan.x - (pointInSVG.x - pan.x) * (newZoom/zoom - 1),
      y: pan.y - (pointInSVG.y - pan.y) * (newZoom/zoom - 1)
    });

    setZoom(newZoom);
  };

  const edges = useMemo(() => {
    return relationships.map((rel) => {
      const sourcePos = nodePositions.get(rel.source);
      const targetPos = nodePositions.get(rel.target);
      if (!sourcePos || !targetPos) return null;

      const sourceIntersect = getIntersectionPoint(sourcePos, targetPos, NODE_WIDTH, NODE_HEIGHT);
      const targetIntersect = getIntersectionPoint(targetPos, sourcePos, NODE_WIDTH, NODE_HEIGHT);

      return {
        ...rel,
        startX: sourceIntersect.x,
        startY: sourceIntersect.y,
        endX: targetIntersect.x,
        endY: targetIntersect.y,
        midX: (sourcePos.x + targetPos.x) / 2,
        midY: (sourcePos.y + targetPos.y) / 2,
      };
    }).filter((edge): edge is NonNullable<typeof edge> => edge !== null);
  }, [relationships, nodePositions]);
  
  const truncate = (str: string, n: number) => {
    return (str.length > n) ? str.slice(0, n-1) + '…' : str;
  };

  if (nodes.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        .graph-node:hover .node-rect {
          stroke: hsl(var(--ring));
          stroke-width: 2.5px;
          fill: hsl(var(--card));
        }
        .graph-svg {
          cursor: grab;
        }
        .graph-svg:active {
          cursor: grabbing;
        }
      `}</style>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        width="100%"
        height="100%"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        className="graph-svg"
      >
        <defs>
          <marker
            id="arrowhead"
            viewBox="0 0 10 10"
            markerWidth="6"
            markerHeight="6"
            refX="8"
            refY="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" />
          </marker>
        </defs>
        <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
          {edges.map((edge, i) => (
            <g key={`edge-${i}`}>
              <line
                x1={edge.startX}
                y1={edge.startY}
                x2={edge.endX}
                y2={edge.endY}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1.5"
                markerEnd="url(#arrowhead)"
              />
              <text
                x={edge.midX}
                y={edge.midY}
                fontSize="12"
                fill="hsl(var(--accent-foreground))"
                textAnchor="middle"
                dy="-6"
                className="font-sans font-medium"
              >
                {edge.type}
              </text>
            </g>
          ))}

          {Array.from(nodePositions.entries()).map(([id, pos]) => {
            const node = nodes.find(n => n.id === id);
            return (
              <g key={`node-${id}`} transform={`translate(${pos.x - NODE_WIDTH / 2}, ${pos.y - NODE_HEIGHT / 2})`} className="graph-node">
                <title>{node?.id}</title>
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx="8"
                  ry="8"
                  fill="hsl(var(--background))"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  className="node-rect transition-all"
                />
                <text
                  x={NODE_WIDTH / 2}
                  y={NODE_HEIGHT / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="12"
                  fill="hsl(var(--card-foreground))"
                  className="font-sans pointer-events-none"
                >
                  {truncate(node?.id || '', MAX_LABEL_LENGTH)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </>
  );
}
