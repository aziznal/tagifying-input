"use client";

import { Footer } from "@/components/Footer";
import { TagifyingInput } from "@/components/TagifyingInput";

export default function Home() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col justify-center w-full max-w-[500px] gap-1">
        <label className="font-light">Tagifying Input</label>

        <TagifyingInput
          initialValue={["Tag1", "Tag2", "Tag3"]}
          onValueChange={(newTags) => {
            console.log(newTags);
          }}
        />
      </div>

      <Footer />
    </div>
  );
}
