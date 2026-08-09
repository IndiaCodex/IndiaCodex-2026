"use client";

import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Edge,
  type Connection,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import AgentNode from "@/components/agents/agent-node";
import { cn } from "@/lib/utils";

interface ExecutionCanvasProps {
  nodes: Node[];
  edges: Edge[];
  className?: string;
}

const nodeTypes = { agent: AgentNode };

const edgeOptions = {
  style: { stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 },
  activeStyle: { stroke: "#0033ad", strokeWidth: 2 },
  completedStyle: { stroke: "#10b981", strokeWidth: 2 },
};

export function ExecutionCanvas({ nodes: initialNodes, edges: initialEdges, className }: ExecutionCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => [...eds, params as Edge]),
    [setEdges],
  );

  return (
    <div className={cn("h-full w-full", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          style: { stroke: "rgba(255,255,255,0.1)", strokeWidth: 2 },
          animated: true,
        }}
      >
        <Background color="rgba(255,255,255,0.03)" gap={20} />
        <Controls
          className="!bg-surface !border-border !text-foreground-muted [&>button]:!border-border [&>button]:!bg-surface [&>button]:!text-foreground-muted"
        />
        <MiniMap
          style={{ background: "rgba(15,15,25,0.95)" }}
          nodeColor="rgba(99,102,241,0.5)"
          maskColor="rgba(0,0,0,0.7)"
          className="!border-border"
        />
      </ReactFlow>
    </div>
  );
}
