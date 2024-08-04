"use client";

import { Footer } from "@/components/Footer";
import { TagifyingInput } from "@/components/TagifyingInput";
import { useEffect, useState } from "react";

export default function Home() {
  const [tags, setTags] = useState<string[]>(["Tag1", "Tag2", "Tag3"]);

  const onTagsChanged = (newTags: string[]) => {
    console.log(newTags);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col justify-center w-full max-w-[500px] gap-1">
        <label className="font-light">Tagifying Input</label>

        <TagifyingInput value={tags} onValueChange={onTagsChanged} />

        <TagifyingInput initialValue={tags} />
      </div>

      <Footer />
    </div>
  );
}
