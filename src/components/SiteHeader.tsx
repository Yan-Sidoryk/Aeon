import { BuiltForPanel, PlatformPanel } from "@/components/header/DesktopPanels";
import { HeaderShell } from "@/components/header/HeaderShell";
import { MobileBuiltForPanel, MobilePlatformPanel } from "@/components/header/MobilePanels";

/**
 * Fixed site header (7shifts `header#site-navigation`): white floating pill with hover mega menus from 1200px,
 * full-width bar with a full-height accordion menu below. Panel markup is rendered on the server and handed to
 * the client shell, which only owns open/close state.
 */
export function SiteHeader() {
  return (
    <HeaderShell
      desktopPanels={{
        platform: <PlatformPanel />,
        "built-for": <BuiltForPanel />,
      }}
      mobilePanels={{
        platform: <MobilePlatformPanel />,
        "built-for": <MobileBuiltForPanel />,
      }}
    />
  );
}
