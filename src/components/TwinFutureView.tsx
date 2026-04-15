import type { TwinVisualState } from "../types";
import { DigitalTwinView } from "./DigitalTwinView";

type Props = {
  current: TwinVisualState;
  future: TwinVisualState;
  imageDataUrl?: string;
};

function midFuture(current: TwinVisualState, future: TwinVisualState): TwinVisualState {
  return {
    rednessLevel: Math.round((current.rednessLevel + future.rednessLevel) / 2),
    drynessLevel: Math.round((current.drynessLevel + future.drynessLevel) / 2),
    poresLevel: Math.round((current.poresLevel + future.poresLevel) / 2),
    toneUnevenLevel: Math.round((current.toneUnevenLevel + future.toneUnevenLevel) / 2),
    barrier: future.barrier,
    vitality: Math.round((current.vitality + future.vitality) / 2),
  };
}

export function TwinFutureView({ current, future, imageDataUrl }: Props) {
  const yearOne = midFuture(current, future);

  return (
    <div className="future-grid">
      <DigitalTwinView title="Now" subtitle="現在の分身" state={current} imageDataUrl={imageDataUrl} />
      <DigitalTwinView title="1 Year" subtitle="1年後の肌" state={yearOne} imageDataUrl={imageDataUrl} />
      <DigitalTwinView title="3 Years" subtitle="3年後の輪郭" state={future} imageDataUrl={imageDataUrl} />
    </div>
  );
}
