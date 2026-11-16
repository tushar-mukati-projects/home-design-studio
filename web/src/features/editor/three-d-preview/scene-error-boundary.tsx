"use client";

import { Component, type ReactNode } from "react";

type SceneErrorBoundaryProps = { children: ReactNode };
type SceneErrorBoundaryState = { failed: boolean };

export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex h-full w-full items-center justify-center bg-background p-4">
        <p className="text-center text-sm text-muted-foreground">
          The 3D preview couldn&apos;t load. Check your connection and try again.
        </p>
      </div>
    );
  }
}
