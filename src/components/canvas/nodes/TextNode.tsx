import { Handle, Position, NodeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";

export function TextNode({ id, data, isConnectable }: NodeProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md w-52 text-xs transition-shadow group">
      <div className="bg-gray-50/80 px-3 py-2 border-b border-gray-100 rounded-t-xl font-semibold text-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>📝 Text Input</span>
        </div>
        <button 
          onClick={() => (data.onDelete as Function)?.(id)}
          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-3">
        <textarea
          className="w-full bg-white text-gray-800 rounded-lg p-2 border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none outline-none placeholder:text-gray-400"
          rows={3}
          value={data.text as string || ""}
          onChange={(e) => (data.onChange as Function)?.(e.target.value)}
          placeholder="Tulis instruksi atau prompt di sini..."
        />
        <p className="text-[10px] text-gray-500 mt-2 font-medium">
          Hubungkan ke Image atau TTS Node.
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-indigo-500 border-2 border-white"
      />
    </div>
  );
}
