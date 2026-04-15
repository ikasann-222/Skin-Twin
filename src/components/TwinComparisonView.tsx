import type { TwinVisualState } from "../types";
import { DigitalTwinView } from "./DigitalTwinView";

type Props = {
  before: TwinVisualState;
  after: TwinVisualState;
  imageDataUrl?: string;
};

export function TwinComparisonView({ before, after, imageDataUrl }: Props) {
  return (
    <div className="comparison-grid">
      <DigitalTwinView title="Before" subtitle="いまの肌" state={before} imageDataUrl={imageDataUrl} />
      <DigitalTwinView title="After" subtitle="使った直後の未来" state={after} imageDataUrl={imageDataUrl} />
    </div>
  );
}
