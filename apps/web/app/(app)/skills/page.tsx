import { Wrench } from 'lucide-react';

export default function SkillsPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Wrench className="size-12 text-muted-foreground mx-auto mb-3" />
        <h1 className="text-lg font-semibold tracking-tight">Skills</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Reusable capability modules that extend what agents can do. Coming soon.
        </p>
      </div>
    </div>
  );
}
