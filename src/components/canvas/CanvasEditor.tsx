"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dynamic from 'next/dynamic';
const Joyride = dynamic(() => import('react-joyride').then((mod) => mod.Joyride), { ssr: false });
import { HelpCircle, Plus } from "lucide-react";

import { TextNode } from "./nodes/TextNode";
import { ImageNode } from "./nodes/ImageNode";
import { VideoNode } from "./nodes/VideoNode";
import { TTSNode } from "./nodes/TTSNode";
import { FaceReferenceNode } from "./nodes/FaceReferenceNode";

const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
  videoNode: VideoNode,
  ttsNode: TTSNode,
  faceNode: FaceReferenceNode,
};

const initialNodes: Node[] = [
  {
    id: "text-1",
    type: "textNode",
    position: { x: 50, y: 150 },
    data: { text: "" },
  },
];

export function CanvasEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [runTutorial, setRunTutorial] = useState(false);

  useEffect(() => {
    const hasCompleted = localStorage.getItem("tutorial_completed");
    if (!hasCompleted) {
      setRunTutorial(true);
    }
  }, []);

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses = ["finished", "skipped"];

    if (finishedStatuses.includes(status)) {
      setRunTutorial(false);
      localStorage.setItem("tutorial_completed", "true");
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#6366f1", strokeWidth: 2 } }, eds));
      
      // Update hasSource for target nodes
      setNodes((nds) => 
        nds.map((node) => {
          if (node.id === params.target) {
            return { ...node, data: { ...node.data, hasSource: true } };
          }
          return node;
        })
      );
    },
    [setEdges, setNodes]
  );

  const updateNodeData = (nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
  };

  const getSourceText = (targetId: string) => {
    const edge = edges.find((e) => e.target === targetId);
    if (!edge) return "";
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) return "";
    if (sourceNode.type === "textNode") return sourceNode.data.text as string;
    return "";
  };

  const getSourceImage = (targetId: string) => {
    const edge = edges.find((e) => e.target === targetId);
    if (!edge) return "";
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) return "";
    if (sourceNode.type === "imageNode") return sourceNode.data.imageUrl as string;
    return "";
  };

  const handleGenerateImage = async (nodeId: string) => {
    const prompt = getSourceText(nodeId);
    if (!prompt) return alert("Sambungkan Text Node terlebih dahulu dan isi prompt!");

    updateNodeData(nodeId, { isLoading: true });
    try {
      const res = await fetch("/api/canvas/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      updateNodeData(nodeId, { imageUrl: data.url, isLoading: false });
    } catch (err: any) {
      alert("Error: " + err.message);
      updateNodeData(nodeId, { isLoading: false });
    }
  };

  const handleGenerateVideo = async (nodeId: string) => {
    const imageUrl = getSourceImage(nodeId);
    if (!imageUrl) return alert("Sambungkan Image Node terlebih dahulu!");

    updateNodeData(nodeId, { isLoading: true });
    try {
      const res = await fetch("/api/canvas/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      updateNodeData(nodeId, { videoUrl: data.url, isLoading: false });
    } catch (err: any) {
      alert("Error: " + err.message);
      updateNodeData(nodeId, { isLoading: false });
    }
  };

  const handleGenerateTTS = async (nodeId: string) => {
    const text = getSourceText(nodeId);
    if (!text) return alert("Sambungkan Text Node terlebih dahulu dan isi prompt!");
    
    const node = nodes.find(n => n.id === nodeId);
    const voice = node?.data?.voice || "alloy";

    updateNodeData(nodeId, { isLoading: true });
    try {
      const res = await fetch("/api/canvas/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error);
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      updateNodeData(nodeId, { audioUrl: url, isLoading: false });
    } catch (err: any) {
      alert("Error: " + err.message);
      updateNodeData(nodeId, { isLoading: false });
    }
  };

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  // Node updaters wrappers to avoid stale closures in initial render, though we inject them later or use state.
  // We must ensure the nodes have access to these functions.
  useEffect(() => {
    setNodes((nds) => 
      nds.map(node => {
        if (node.type === "textNode") {
          return { ...node, data: { ...node.data, onChange: (t: string) => updateNodeData(node.id, { text: t }), onDelete: deleteNode } };
        }
        if (node.type === "imageNode") {
          return { ...node, data: { 
            ...node.data, 
            onGenerate: () => handleGenerateImage(node.id), 
            onChangeResolution: (r: string) => updateNodeData(node.id, { resolution: r }),
            onDelete: deleteNode 
          } };
        }
        if (node.type === "videoNode") {
          return { ...node, data: { 
            ...node.data, 
            onGenerate: () => handleGenerateVideo(node.id), 
            onChangeResolution: (r: string) => updateNodeData(node.id, { resolution: r }),
            onChangeDuration: (d: number) => updateNodeData(node.id, { duration: d }),
            onDelete: deleteNode 
          } };
        }
        if (node.type === "ttsNode") {
          return { 
            ...node, 
            data: { 
              ...node.data, 
              onGenerate: () => handleGenerateTTS(node.id),
              onChangeVoice: (v: string) => updateNodeData(node.id, { voice: v }),
              onDelete: deleteNode
            } 
          };
        }
        if (node.type === "faceNode") {
          return {
            ...node,
            data: {
              ...node.data,
              onChangeFace: (url: string | null) => updateNodeData(node.id, { faceUrl: url }),
              onDelete: deleteNode
            }
          };
        }
        return node;
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges]); // Depend on edges so generation callbacks get the latest edges closure implicitly via the handler (wait, the handlers use the latest state inside their scope? Actually, setState with callback or just re-run effect).

  const addNode = (type: string) => {
    const id = `${type}-${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { hasSource: false, onDelete: deleteNode },
    };
    
    // Attach handlers immediately
    if (type === "textNode") newNode.data.onChange = (t: string) => updateNodeData(id, { text: t });
    if (type === "imageNode") {
      newNode.data.onGenerate = () => handleGenerateImage(id);
      newNode.data.resolution = "1:1";
      newNode.data.onChangeResolution = (r: string) => updateNodeData(id, { resolution: r });
    }
    if (type === "videoNode") {
      newNode.data.onGenerate = () => handleGenerateVideo(id);
      newNode.data.resolution = "9:16";
      newNode.data.duration = 5;
      newNode.data.onChangeResolution = (r: string) => updateNodeData(id, { resolution: r });
      newNode.data.onChangeDuration = (d: number) => updateNodeData(id, { duration: d });
    }
    if (type === "ttsNode") {
      newNode.data.onGenerate = () => handleGenerateTTS(id);
      newNode.data.onChangeVoice = (v: string) => updateNodeData(id, { voice: v });
      newNode.data.voice = "alloy";
    }
    if (type === "faceNode") {
      newNode.data.onChangeFace = (url: string | null) => updateNodeData(id, { faceUrl: url });
    }

    setNodes((nds) => [...nds, newNode]);
  };

  const autoLayout = () => {
    if (confirm("Rapihkan semua posisi node secara otomatis?")) {
      setNodes((nds) => nds.map((node, i) => ({
        ...node,
        position: {
          x: 100 + (i % 3) * 280,
          y: 100 + Math.floor(i / 3) * 180,
        }
      })));
    }
  };

  const saveHistory = () => {
    if (confirm("Simpan kondisi canvas saat ini ke riwayat? (Riwayat sebelumnya akan tertimpa)")) {
      const state = { nodes, edges };
      localStorage.setItem("canvas_history", JSON.stringify(state));
      alert("Canvas berhasil disimpan ke riwayat!");
    }
  };

  const loadHistory = () => {
    if (confirm("Muat canvas dari riwayat? (Kondisi saat ini akan hilang jika belum disimpan)")) {
      const stateStr = localStorage.getItem("canvas_history");
      if (stateStr) {
        try {
          const state = JSON.parse(stateStr);
          setNodes(state.nodes || []);
          setEdges(state.edges || []);
        } catch (e) {}
      } else {
        alert("Belum ada riwayat canvas yang tersimpan.");
      }
    }
  };

  const clearCanvas = () => {
    if (confirm("Hapus semua node di canvas saat ini?")) {
      setNodes([]);
      setEdges([]);
    }
  };

  const steps = [
    {
      target: ".react-flow",
      content: "Selamat datang di Infinity Canvas! Di sini Anda bisa merangkai alur pembuatan konten AI tanpa batas.",
      disableBeacon: true,
    },
    {
      target: ".canvas-toolbar",
      content: "Gunakan toolbar ini untuk menambahkan Node baru (Teks, Gambar, Video, TTS).",
    },
    {
      target: ".react-flow__node",
      content: "Ini adalah Node. Anda bisa menghubungkan output dari satu Node ke input Node lainnya dengan menarik garis (Tap-to-connect di HP).",
    },
    {
      target: ".canvas-controls",
      content: "Gunakan menu di kanan atas untuk Merapikan Canvas, Menyimpan Riwayat, atau Membersihkan layar.",
    },
    {
      target: ".help-button",
      content: "Jika Anda butuh bantuan, klik tombol ini kapan saja untuk mengulang tutorial.",
    }
  ];

  return (
    <div className="w-full h-full relative bg-bg-primary">
      <Joyride
        steps={steps}
        run={runTutorial}
        continuous
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#6366f1',
            backgroundColor: '#111127',
            textColor: '#fff',
            arrowColor: '#111127',
          }
        } as any}
        {...{ showProgress: true, showSkipButton: true } as any}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]} // Support 2-finger pan on touch
        zoomOnPinch={true}
        connectOnClick={true} // Enable tap-to-connect for mobile
        minZoom={0.2}
        maxZoom={4}
        className="react-flow-container"
      >
        <Background color="#fff" gap={16} size={1} style={{ opacity: 0.05 }} />
        
        <Panel position="top-center" className="canvas-toolbar bg-bg-card border border-white/10 p-2 rounded-xl shadow-2xl glass flex gap-2 mt-4">
          <button onClick={() => addNode("textNode")} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white flex items-center gap-1 transition-colors">
            <Plus className="w-3 h-3" /> Text
          </button>
          <button onClick={() => addNode("imageNode")} className="px-3 py-1.5 bg-accent-cyan/20 hover:bg-accent-cyan/30 text-accent-cyan rounded-lg text-xs font-medium flex items-center gap-1 transition-colors">
            <Plus className="w-3 h-3" /> Image
          </button>
          <button onClick={() => addNode("videoNode")} className="px-3 py-1.5 bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary rounded-lg text-xs font-medium flex items-center gap-1 transition-colors">
            <Plus className="w-3 h-3" /> Video
          </button>
          <button onClick={() => addNode("ttsNode")} className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors">
            <Plus className="w-3 h-3" /> TTS
          </button>
          <button onClick={() => addNode("faceNode")} className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors">
            <Plus className="w-3 h-3" /> Face
          </button>
        </Panel>

        <Panel position="top-right" className="canvas-controls mt-4 mr-4 flex flex-col gap-2">
          <div className="flex gap-2 bg-bg-card border border-white/10 p-2 rounded-xl shadow-2xl glass">
            <button onClick={autoLayout} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-colors" title="Rapikan Posisi">
              ✨ Rapikan
            </button>
            <button onClick={saveHistory} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-colors" title="Simpan Riwayat">
              💾 Simpan
            </button>
            <button onClick={loadHistory} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white transition-colors" title="Muat Riwayat">
              📂 Muat
            </button>
            <button onClick={clearCanvas} className="px-2 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-xs font-medium transition-colors" title="Bersihkan Canvas">
              🗑️ Hapus
            </button>
          </div>
          <button 
            className="help-button self-end w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white backdrop-blur-md transition-all shadow-lg hover:shadow-white/10 mt-2"
            onClick={() => setRunTutorial(true)}
            title="Ulangi Tutorial"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// Wrap with provider
export default function CanvasWrapper() {
  return (
    <ReactFlowProvider>
      <CanvasEditor />
    </ReactFlowProvider>
  );
}
