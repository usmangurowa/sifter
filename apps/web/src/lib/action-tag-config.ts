import {
  Bug01Icon,
  CheckmarkCircle02Icon,
  CodeIcon,
  RefreshIcon,
  SearchAreaIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

import type { ActionTag } from "@turbo/shared";
import { ACTION_TAG_CONFIG } from "@turbo/shared";

/**
 * Action tag configuration with icons for the web app.
 * Maps action tags to their labels and corresponding Hugeicons.
 */
export const actionTagConfig: Record<
  ActionTag,
  { label: string; icon: typeof Bug01Icon }
> = {
  building: { label: ACTION_TAG_CONFIG.building.label, icon: CodeIcon },
  debugging: { label: ACTION_TAG_CONFIG.debugging.label, icon: Bug01Icon },
  refactoring: {
    label: ACTION_TAG_CONFIG.refactoring.label,
    icon: RefreshIcon,
  },
  testing: {
    label: ACTION_TAG_CONFIG.testing.label,
    icon: CheckmarkCircle02Icon,
  },
  reviewing: {
    label: ACTION_TAG_CONFIG.reviewing.label,
    icon: SearchAreaIcon,
  },
  configuring: {
    label: ACTION_TAG_CONFIG.configuring.label,
    icon: Settings01Icon,
  },
};
