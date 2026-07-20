import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CONSERTECH — Client Portal",
  description: "Track your project progress and submit requests",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
