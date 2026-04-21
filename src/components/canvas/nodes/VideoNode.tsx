import { Handle, Position, NodeProps } from "@xyflow/react";
import { Loader2, Video, Download, Trash2 } from "lucide-react";

export function VideoNode({ id, data, isConnectable }: NodeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md w-52 text-xs transition-shadow group">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />
      
      <div className="bg-indigo-50/80 px-3 py-2 border-b border-indigo-100 font-semibold text-indigo-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-3.5 h-3.5 text-indigo-600" />
          <span>Video Animation</span>
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
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            <span className="text-[9px] text-gray-500 font-medium text-center px-2">Menganimasikan...<br/>(1-2 menit)</span>
          </div>
        ) : data.videoUrl ? (
          <div className="relative group/vid rounded-lg overflow-hidden border border-gray-200">
            <video src={data.videoUrl as string} controls className="w-full h-auto bg-black" />
          </div>
        ) : (
          <div className="w-full h-24 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 border-dashed text-gray-500 font-medium text-[9px] text-center p-3">
            Sambungkan Image Node ke sini, lalu klik Animate.
          </div>
        )}

        <div className="space-y-1.5 mb-1">
          <div className="flex items-center justify-between gap-1">
            <label className="text-[9px] text-gray-500 font-bold uppercase">Resolusi:</label>
            <select 
              value={data.resolution as string || "9:16"}
              onChange={(e) => (data.onChangeResolution as Function)?.(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-[9px] outline-none focus:border-indigo-400"
            >
              <option value="9:16">9:16 Port</option>
              <option value="16:9">16:9 Wide</option>
              <option value="1:1">1:1 Sq</option>
            </select>
          </div>
          <div className="flex items-center justify-between gap-1">
            <label className="text-[9px] text-gray-500 font-bold uppercase">Durasi:</label>
            <div className="flex items-center gap-1">
              <input 
                type="number" min="3" max="15" 
                value={data.duration as number || 5} 
                onChange={(e) => (data.onChangeDuration as Function)?.(parseInt(e.target.value))}
                className="w-8 bg-gray-50 border border-gray-200 rounded px-1 py-0.5 text-[9px] text-center outline-none focus:border-indigo-400 font-bold"
              />
              <span className="text-[9px] text-gray-400">detik</span>
            </div>
          </div>
          <p className="text-[8px] text-right text-indigo-400 font-medium italic">Biaya: {(data.duration as number) || 5} Token</p>
        </div>

        <button 
          onClick={data.onGenerate as () => void}
          disabled={data.isLoading as boolean || !data.hasSource}
          className="w-full py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {data.isLoading ? "Animating..." : "Animate Video"}
        </button>
      </div>
    </div>
  );
}
