import { Handle, Position, NodeProps } from "@xyflow/react";
import { Loader2, Image as ImageIcon, Download, Trash2 } from "lucide-react";

export function ImageNode({ id, data, isConnectable }: NodeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md w-52 text-xs transition-shadow relative overflow-hidden group">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-cyan-500 border-2 border-white"
      />
      
      <div className="bg-cyan-50/80 px-3 py-2 border-b border-cyan-100 font-semibold text-cyan-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-600" />
          <span>Image Generator</span>
        </div>
        <button 
          onClick={() => (data.onDelete as Function)?.(id)}
          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="p-3 flex flex-col gap-2">
        {data.isLoading ? (
          <div className="w-full h-32 bg-gray-50 rounded-lg flex flex-col items-center justify-center border border-gray-100 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
            <span className="text-[10px] text-gray-500 font-medium">Menciptakan...</span>
          </div>
        ) : data.imageUrl ? (
          <div className="relative group/img rounded-lg overflow-hidden border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.imageUrl as string} alt="Generated" className="w-full h-auto" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
              <button 
                onClick={() => window.open(data.imageUrl as string, '_blank')}
                className="bg-white/90 hover:bg-white p-2 rounded-full text-gray-800 backdrop-blur-sm shadow-sm transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-24 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 border-dashed text-gray-500 font-medium text-[9px] text-center p-3">
            Sambungkan Text Node ke sini, lalu klik Generate.
          </div>
        )}

        <div className="flex items-center justify-between gap-1 mb-1">
          <label className="text-[9px] text-gray-500 font-bold uppercase">Resolusi:</label>
          <select 
            value={data.resolution as string || "1:1"}
            onChange={(e) => (data.onChangeResolution as Function)?.(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-[9px] outline-none focus:border-cyan-400"
          >
            <option value="1:1">1:1 Sq</option>
            <option value="16:9">16:9 Wide</option>
            <option value="9:16">9:16 Port</option>
          </select>
        </div>

        <button 
          onClick={data.onGenerate as () => void}
          disabled={data.isLoading as boolean || !data.hasSource}
          className="w-full py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {data.isLoading ? "Generating..." : "Generate Image"}
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-cyan-500 border-2 border-white"
      />
    </div>
  );
}
