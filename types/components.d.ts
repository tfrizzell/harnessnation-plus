import { HNPlusStateDurationElement } from '../src/options/components/state-duration';

export { }

declare global {
    interface Window {
        HNPlusStateDurationElement: typeof HNPlusStateDurationElement;
        HNPlusToggleElement: typeof HNPlusToggleElement;
        HNPlusTooltipElement: typeof HNPlusTooltipElement;
    }
}