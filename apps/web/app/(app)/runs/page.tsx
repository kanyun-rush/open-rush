import { Activity } from 'lucide-react';

export default function RunsPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Activity className="size-12 text-muted-foreground mx-auto mb-3" />
        <h1 className="text-lg font-semibold tracking-tight">Runs & Analytics</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Monitor agent execution, token usage, and performance. Coming soon.
        </p>
      </div>
    </div>
  );
}
