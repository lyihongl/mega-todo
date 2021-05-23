import { Screens } from "./constants";
export interface IScreens {
  screen: Screens;
  setScreen: (s: Screens) => void;
}
