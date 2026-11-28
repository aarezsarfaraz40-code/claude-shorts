import { Composition } from "remotion";
import { ShortVideo } from "./ShortVideo";
import { ShortVideoPropsSchema } from "./types";
import { GtaReel, GtaReelSchema } from "./reel/GtaReel";
import { BazaarPromo, BAZAAR_DURATION } from "./promo/BazaarPromo";
import { BazaarGifts, GIFTS_DURATION } from "./promo/BazaarGifts";
import { BazaarGifts2, GIFTS2_DURATION, GIFTS2_FPS } from "./promo/BazaarGifts2";
import { BazaarCategories, CATS_DURATION, CATS_FPS } from "./promo/BazaarCategories";
import { ShadowClip, SHADOW_DURATION } from "./promo/ShadowClip";
import { ShadowDuo, DUO_DURATION } from "./promo/ShadowDuo";
import { ShadowTommy, TOMMY_DURATION } from "./promo/ShadowTommy";
import { ShadowNiko, NIKO_DURATION } from "./promo/ShadowNiko";
import { NikoAura, AURA_DURATION } from "./promo/NikoAura";
import { OggInterview, OGG_DURATION } from "./promo/OggInterview";

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
      <Composition id="ShadowDuo" component={ShadowDuo} width={1080} height={1920} fps={30} durationInFrames={Math.round(DUO_DURATION * 30)} />
      <Composition id="ShadowTommy" component={ShadowTommy} width={1080} height={1920} fps={30} durationInFrames={Math.round(TOMMY_DURATION * 30)} />
      <Composition id="ShadowNiko" component={ShadowNiko} width={1080} height={1920} fps={30} durationInFrames={Math.round(NIKO_DURATION * 30)} />
      <Composition id="NikoAura" component={NikoAura} width={1080} height={1920} fps={30} durationInFrames={Math.round(AURA_DURATION * 30)} />
      <Composition id="OggInterview" component={OggInterview} width={1080} height={1920} fps={30} durationInFrames={Math.round(OGG_DURATION * 30)} />
      <Composition id="ShadowClip" component={ShadowClip} width={1080} height={1920} fps={30} durationInFrames={Math.round(SHADOW_DURATION * 30)} />
      <Composition id="BazaarCategories" component={BazaarCategories} width={1080} height={1920} fps={CATS_FPS} durationInFrames={CATS_DURATION * CATS_FPS} />
      <Composition id="BazaarGifts2" component={BazaarGifts2} width={1080} height={1920} fps={GIFTS2_FPS} durationInFrames={GIFTS2_DURATION * GIFTS2_FPS} />
      <Composition id="BazaarGifts" component={BazaarGifts} width={1080} height={1920} fps={30} durationInFrames={GIFTS_DURATION * 30} />
      <Composition id="BazaarPromo" component={BazaarPromo} width={1080} height={1920} fps={30} durationInFrames={BAZAAR_DURATION * 30} />
    </>
  );
};
