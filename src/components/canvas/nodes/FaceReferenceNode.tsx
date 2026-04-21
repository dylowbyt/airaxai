import { Handle, Position, NodeProps } from "@xyflow/react";
import { User, Upload, Trash2, X } from "lucide-react";
import { useState } from "react";

export function FaceReferenceNode({ id, data, isConnectable }: NodeProps) {
  const [preview, setPreview] = useState<string | null>(data.faceUrl as string || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        (data.onChangeFace as Function)?.(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFace = () => {
    setPreview(null);
    (data.onChangeFace as Function)?.(null);
  };

  return (
    <div className="glass border-white/10 rounded-xl shadow-2xl w-40 text-xs transition-all hover:border-white/20 group overflow-hidden">
      <div className="bg-white/5 px-3 py-1.5 border-b border-white/5 font-semibold text-text-primary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="w-3 h-3 text-accent-cyan" />
          <span className="text-[10px] tracking-tight">Face Ref</span>
        </div>
        <button 
          onClick={() => (data.onDelete as Function)?.(id)}
          className="text-white/40 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="p-2 flex flex-col gap-2">
        {preview ? (
          <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden border border-white/10 group/img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Face Reference" className="w-full h-full object-cover" />
            <button 
              onClick={clearFace}
              className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-md"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ) : (
          <label className="w-full aspect-[4/5] bg-white/5 rounded-lg flex flex-col items-center justify-center border border-white/10 border-dashed cursor-pointer hover:bg-white/10 transition-colors">
            <Upload className="w-4 h-4 text-white/30 mb-1" />
            <span className="text-[8px] text-white/40 font-medium">Upload Wajah</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        )}
        
        <p className="text-[7px] text-white/30 text-center italic leading-tight px-1">
          Foto wajah harus jelas & menghadap depan.
        </p>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-accent-cyan border-2 border-white/50"
      />
    </div>
  );
}
