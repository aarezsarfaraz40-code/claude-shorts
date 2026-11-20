#!/usr/bin/env python3
"""Build the sound-effect track of a reel spec from its clips and overlays.

Rules (all quiet — they sit under the voice and music):
  every cut ............ whoosh
  hook headline ........ pop
  counter .............. riser before it lands, ticks while counting, ding on land
  versus ............... whoosh in + impact on the stamp
  badge ................ impact
  stamp ................ glitch
  bars / timeline ...... tick per bar/item
  poll ................. pop per option
  bignumber ............ impact
  end card ............. riser in + bell 🔔

Usage:  python3 reels/sfx_auto.py reels/specs/r01.json [--gain 1.0]
"""
import argparse
import json

# Base volumes (all SFX files are peak-normalized to -6 dB)
V = {
    "whoosh": 0.10, "pop": 0.10, "riser": 0.10, "tick": 0.06, "ding": 0.14,
    "impact": 0.14, "glitch": 0.08, "bell": 0.16,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--gain", type=float, default=1.0)
    a = ap.parse_args()
    spec = json.load(open(a.spec))
    cues = []

    def add(t, name):
        if t >= 0:
            cues.append({"at": round(t, 3), "file": f"sfx/{name}.wav", "volume": round(V[name] * a.gain, 3)})

    cuts = sorted({c["from"] for c in spec["clips"]})
    ends = [o["from"] for o in spec["overlays"] if o["type"] == "endcard"]
    end_t = min(ends) if ends else 1e9
    for t in cuts:
        if t < end_t:
            add(t, "whoosh")

    for o in spec["overlays"]:
        t0, t1, ty = o["from"], o["to"], o["type"]
        if ty == "hook":
            add(t0 + 0.05, "pop")
        elif ty == "counter":
            land = o.get("land", t0 + 1.2)
            add(land - 1.0, "riser")
            t = t0 + 0.2
            while t < land - 0.1:
                add(t, "tick")
                t += 0.12
            add(land, "ding")
        elif ty == "versus":
            if o.get("stampAt") is not None:
                add(o["stampAt"], "impact")
        elif ty == "badge":
            add(t0, "impact")
        elif ty == "stamp":
            add(t0, "glitch")
        elif ty in ("bars", "timeline"):
            for i, it in enumerate(o.get("items", [])):
                add(it.get("at", t0 + i * 0.4), "tick")
                if ty == "timeline" and it.get("state") == "fail":
                    add(it.get("failAt", it.get("at", t0 + i)), "glitch")
        elif ty == "poll":
            for i in range(len(o.get("options", []))):
                add(t0 + (6 + i * 6) / 30, "pop")
        elif ty == "bignumber":
            add(t0, "impact")
        elif ty == "endcard":
            add(t0 - 0.6, "riser")
            add(t0 + 0.7, "bell")

    cues.sort(key=lambda c: c["at"])
    spec["sfx"] = cues
    json.dump(spec, open(a.spec, "w"), indent=1, ensure_ascii=False)
    print(f"{len(cues)} sound effects written")


if __name__ == "__main__":
    main()
