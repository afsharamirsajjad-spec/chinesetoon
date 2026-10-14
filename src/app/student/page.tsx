import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentScreen } from "@/components/site/screens";

export const metadata: Metadata = {
  title: "Student Dashboard — Chinese Toon",
  description: "Your enrolled classes, materials, assignments, sessions and grades.",
  // 🎓 داشبورد شخصی — ایندکس معنی ندارد
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <StudentScreen />
    </Suspense>
  );
}
