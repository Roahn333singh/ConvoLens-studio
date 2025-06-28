
"use client";

import { useState, useEffect, useMemo } from 'react';

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
};

const SVG_WIDTH = 800;
const SVG_HEIGHT = 600;
const RADIUS = 250;
const NODE_RADIUS = 25;

export default function KnowledgeGraph({ nodes, relationships }: KnowledgeGraphProps) {
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());

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
      const x = centerX + RADIUS * Math.cos(i * angleStep - Math.PI / 2); // Start from top
      const y = centerY + RADIUS * Math.sin(i * angleStep - Math.PI / 2);
      newPositions.set(node.id, { x, y });
    });
    setNodePositions(newPositions);
  }, [nodes]);

  const edges = useMemo(() => {
    return relationships.map((rel) => {
      const sourcePos = nodePositions.get(rel.source);
      const targetPos = nodePositions.get(rel.target);
      if (!sourcePos || !targetPos) return null;

      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nx = dx / dist;
      const ny = dy / dist;

      const startX = sourcePos.x + nx * NODE_RADIUS;
      const startY = sourcePos.y + ny * NODE_RADIUS;
      const endX = targetPos.x - nx * NODE_RADIUS;
      const endY = targetPos.y - ny * NODE_RADIUS;

      return {
        ...rel,
        startX,
        startY,
        endX,
        endY,
        midX: (sourcePos.x + targetPos.x) / 2,
        midY: (sourcePos.y + targetPos.y) / 2,
      };
    }).filter((edge): edge is NonNullable<typeof edge> => edge !== null);
  }, [relationships, nodePositions]);

  if (nodes.length === 0) {
    return null;
  }

  return (
    <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} width="100%" height="100%">
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
          <g key={`node-${id}`} transform={`translate(${pos.x}, ${pos.y})`}>
            <circle
              r={NODE_RADIUS}
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth="2"
            />
            <text
              textAnchor="middle"
              dy="4"
              fontSize="10"
              fill="hsl(var(--primary-foreground))"
              className="font-bold font-sans pointer-events-none"
            >
              {node?.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
