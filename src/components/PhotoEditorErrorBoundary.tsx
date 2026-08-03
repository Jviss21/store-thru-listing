"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui";

type Props = {
  children: ReactNode;
  onClose: () => void;
};

type State = { error: Error | null };

/** Isolates photo-editor crashes so the listing page stays usable. */
export class PhotoEditorErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("PhotoEditor crashed", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/70 p-4">
          <div
            role="alertdialog"
            className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-5 shadow-float"
          >
            <h2 className="font-display text-lg font-bold text-ink">Photo editor error</h2>
            <p className="mt-2 text-sm text-muted">
              Something went wrong while editing this image. The listing page is still
              available — close and try another photo, or refresh.
            </p>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  this.setState({ error: null });
                  this.props.onClose();
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
