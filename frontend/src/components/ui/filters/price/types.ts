import { PRICE_RANGE_DATA } from "./constants";

export interface PriceRangeValues {
    min: number;
    max: number;
}

export interface PriceRangeProps {
    /** Callback triggered when the slider values change */
    onValueChange?: (values: [number, number]) => void;
    /** Initial values for the slider */
    initialValues?: [number, number];
}

// Type for the constants to ensure they match the slider's needs
export type PriceSliderConfig = typeof PRICE_RANGE_DATA;