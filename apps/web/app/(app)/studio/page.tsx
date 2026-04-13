import { Layers } from 'lucide-react';

export default function AgentStudioPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Layers className="size-12 text-muted-foreground mx-auto mb-3" />
        <h1 className="text-lg font-semibold tracking-tight">Agent Studio</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Assemble an agent from model, skills, and MCP tools. Coming soon.
        </p>
      </div>
    </div>
  );
}
