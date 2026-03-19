import { createClient } from "@/lib/supabase/server";
import { PipelinesList } from "@/components/pipelines-list";
import { Columns3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PipelinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pipelines } = await supabase
    .from("pipelines")
    .select(`
      *,
      pipeline_stages (
        id,
        name,
        position,
        color,
        pipeline_cards ( id )
      )
    `)
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  const enriched = (pipelines ?? []).map((p) => {
    const stages = p.pipeline_stages || [];
    const cardCount = stages.reduce(
      (sum: number, s: { pipeline_cards?: { id: string }[] }) =>
        sum + (s.pipeline_cards?.length ?? 0),
      0
    );
    return {
      ...p,
      stage_count: stages.length,
      card_count: cardCount,
    };
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-serif)] text-2xl text-gray-900">
            Pipelines
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track contacts through stages — fundraising, hiring, sales.
          </p>
        </div>
      </div>

      {enriched.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gray-100 mb-4">
            <Columns3 className="h-5 w-5 text-gray-400" />
          </div>
          <h3 className="text-sm font-medium text-gray-900">
            No pipelines yet
          </h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Create one to start tracking contacts through stages.
          </p>
          <div className="mt-4">
            <PipelinesList pipelines={[]} />
          </div>
        </div>
      ) : (
        <PipelinesList pipelines={enriched} />
      )}
    </div>
  );
}
