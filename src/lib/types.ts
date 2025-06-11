// types.ts
export interface FoodItem {
    text: string;
    emoji: string;
  }

export type FoodGroupLabel = "protein" | "carb" | "veggie";
  
  export interface FoodGroup {
    label: FoodGroupLabel;
    item: FoodItem;
    items: FoodItem[];
    index: number;
    rotating: boolean;
    rotatingIntervalId?: number;
    longPressTimer?: number;
  }
  
  export interface Slide {
    id: number;
    type: string;
  }
