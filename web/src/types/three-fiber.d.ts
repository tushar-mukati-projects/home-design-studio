import type { ThreeElements } from "@react-three/fiber";

declare module "react" {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Required for R3F JSX augmentation
    interface IntrinsicElements extends ThreeElements {}
  }
}
