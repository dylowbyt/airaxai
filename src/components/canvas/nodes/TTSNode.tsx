import { Handle, Position, NodeProps } from "@xyflow/react";
import { Loader2, Mic, Play, Pause, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function TTSNode({ id, data, isConnectable }: NodeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md w-52 text-xs transition-shadow group">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="w-3 h-3 bg-emerald-500 border-2 border-white"
      />
      
      <div className="bg-emerald-50/80 px-3 py-2 border-b border-emerald-100 font-semibold text-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="w-3.5 h-3.5 text-emerald-600" />
          <span>Text to Speech</span>
        </div>
        <button 
          onClick={() => (data.onDelete as Function)?.(id)}
          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <div className="p-3 flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">Pilih Suara (OpenAI)</label>
          <select 
            value={data.voice as string || "alloy"} 
            onChange={(e) => (data.onChangeVoice as Function)?.(e.target.value)}
            className="bg-white text-[10px] text-gray-800 border border-gray-200 rounded-lg p-1.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all shadow-sm cursor-pointer"
          >
            <option value="alloy">Alloy (Neutral)</option>
            <option value="echo">Echo (Male)</option>
            <option value="fable">Fable (British)</option>
            <option value="nova">Nova (Female)</option>
            <option value="onyx">Onyx (Deep Male)</option>
            <option value="shimmer">Shimmer (Soft Female)</option>
          </select>
        </div>

        {!!data.audioUrl && (
          <div className="bg-emerald-50/80 rounded-lg p-2.5 flex items-center justify-between border border-emerald-100">
            <span className="text-xs font-medium text-emerald-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Audio Ready
            </span>
            <audio 
              ref={audioRef} 
              src={data.audioUrl as string} 
              onEnded={() => setIsPlaying(false)} 
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="hidden" 
            />
            <button 
              onClick={togglePlay}
              className="bg-white hover:bg-emerald-100 text-emerald-600 p-1.5 rounded-full shadow-sm transition-colors border border-emerald-200"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        )}

        <button 
          onClick={data.onGenerate as () => void}
          disabled={data.isLoading as boolean || !data.hasSource}
          className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mt-1"
        >
          {data.isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Generate Speech"}
        </button>
      </div>
    </div>
  );
}
