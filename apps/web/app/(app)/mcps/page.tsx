import { Rss } from 'lucide-react';

export default function McpServersPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Rss className="size-12 text-muted-foreground mx-auto mb-3" />
        <h1 className="text-lg font-semibold tracking-tight">MCP Servers</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          External tool connections via Model Context Protocol. Coming soon.
        </p>
      </div>
    </div>
  );
}
