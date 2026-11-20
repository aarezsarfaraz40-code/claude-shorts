import { Composition } from "remotion";
import { ShortVideo } from "./ShortVideo";
import { ShortVideoPropsSchema } from "./types";
import { GtaReel, GtaReelSchema } from "./reel/GtaReel";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="ShortVideo"
        component={ShortVideo}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={30 * 30}
        schema={ShortVideoPropsSchema}
        defaultProps={{
          clipSrc: "",
          sourceWidth: 1920,
          sourceHeight: 1080,
          crop: { x: 0, y: 0, w: 607, h: 1080 },
          cropKeyframes: [],
          captions: [],
          captionStyle: "bold" as const,
          hookLine1: "",
          hookLine2: "",
          showProgressBar: true,
          durationInSeconds: 30,
        }}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: Math.ceil(props.durationInSeconds * 30),
            fps: 30,
            width: 1080,
            height: 1920,
          };
        }}
      />
      <Composition
        id="GtaReel"
        component={GtaReel}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={30 * 30}
        schema={GtaReelSchema}
        defaultProps={{
          durationInSeconds: 30,
          assetBase: "",
          trailer: "",
          voiceover: "",
          tag: "",
          logo: "",
          logoText: "LOGO",
          source: { w: 1280, h: 720, top: 92, bottom: 628 },
          clips: [],
          overlays: [],
          captions: [],
          sfx: [],
        }}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.ceil(props.durationInSeconds * 30),
          fps: 30,
          width: 1080,
          height: 1920,
        })}
      />
    </>
  );
};
