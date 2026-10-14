import type { Metadata } from "next";
import { Suspense } from "react";
import { TeacherScreen } from "@/components/site/screens";

export const metadata: Metadata = {
  title: "Teacher Dashboard — Chinese Toon",
  description: "Manage your classes, students, materials, assignments and sessions.",
  // 🎓 داشبورد استاد — ایندکس معنی ندارد
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TeacherScreen />
    </Suspense>
  );
}
