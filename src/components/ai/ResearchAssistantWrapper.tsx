"use client";

import dynamic from "next/dynamic";

const ResearchAssistant = dynamic(
  () => import("@/components/ai/ResearchAssistant"),
  { ssr: false },
);

export default function ResearchAssistantWrapper() {
  return <ResearchAssistant />;
}
