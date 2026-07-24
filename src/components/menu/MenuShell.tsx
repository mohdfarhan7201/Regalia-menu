"use client";

import dynamic from "next/dynamic";
import type {
  IBranding,
  ILocation,
  CategoryWithItems,
  MenuViewMode,
  MenuMode,
} from "@/types";
import type { FlipbookPageData } from "@/app/menu/page";
import type { ComponentType } from "react";

interface MobileProps {
  branding: IBranding | null;
  categoriesWithItems: CategoryWithItems[];
  location: ILocation | null;
  mode: MenuMode;
}
interface TabletProps {
  branding: IBranding | null;
  pages: FlipbookPageData[];
  location: ILocation | null;
  mode: MenuMode;
}

const MobileMenuShell = dynamic<MobileProps>(
  () =>
    import("./mobile/MobileMenuShell") as Promise<{
      default: ComponentType<MobileProps>;
    }>,
  { ssr: false },
);
const TabletMenuShell = dynamic<TabletProps>(
  () =>
    import("./tablet/TabletMenuShell") as Promise<{
      default: ComponentType<TabletProps>;
    }>,
  { ssr: false },
);

interface Props {
  branding: IBranding | null;
  categoriesWithItems: CategoryWithItems[];
  flipbookPages: FlipbookPageData[];
  location: ILocation | null;
  locationType: MenuMode;
  locationCode: string | null;
  viewMode: MenuViewMode;
}

export default function MenuShell({
  branding,
  categoriesWithItems,
  flipbookPages,
  location,
  locationType,
  viewMode,
}: Props) {
  if (viewMode === "tablet") {
    return (
      <TabletMenuShell
        branding={branding}
        pages={flipbookPages}
        location={location}
        mode={locationType}
      />
    );
  }

  return (
    <MobileMenuShell
      branding={branding}
      categoriesWithItems={categoriesWithItems}
      location={location}
      mode={locationType}
    />
  );
}
