// Join the Crew — open roles. Edit the bullets freely; set open:false to hide a role.
export type Role = {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  open: boolean;
};

export const ROLES: Role[] = [
  {
    slug: "ai-director",
    title: "AI Director",
    tagline: "The mind behind the world.",
    summary: "Design the look of every film, from characters and sets to light and camera, and direct each shot through AI.",
    responsibilities: [
      "Build the world of each film: characters, locations, wardrobe, light and camera.",
      "Turn scripts into shot lists and direct every shot through AI tools.",
      "Keep faces, outfits and places consistent from the first frame to the last.",
      "Review every cut with the editor until it feels like a real film.",
    ],
    requirements: [
      "A showreel of AI films or visuals you directed.",
      "A strong eye for framing, light and story.",
      "Hands-on with tools like Higgsfield, Kling, Veo, Seedance or Midjourney.",
    ],
    open: true,
  },
  {
    slug: "ad-alchemist",
    title: "Ad Alchemist",
    tagline: "The mind behind the idea.",
    summary: "Turn a brand brief into the idea, the hook and the script that people remember.",
    responsibilities: [
      "Turn brand briefs into ad ideas that stop the scroll.",
      "Write scripts, hooks and taglines in Hindi, Hinglish and English.",
      "Pitch concepts to clients alongside the director.",
      "Track what works on Instagram and Meta, and bring it into our films.",
    ],
    requirements: [
      "Ads, scripts or campaigns you've written.",
      "A sharp sense of humour, emotion and timing.",
      "A feel for Indian brands and internet culture.",
    ],
    open: true,
  },
  {
    slug: "ai-video-editor",
    title: "AI Video Editor",
    tagline: "The mind behind the final experience.",
    summary: "Cut AI footage into films with pace, sound and polish, the part the audience actually feels.",
    responsibilities: [
      "Cut AI footage into ads, reels and films with pace and story.",
      "Add music, sound effects, captions and colour.",
      "Clean up the small AI glitches nobody should ever notice.",
      "Deliver every film in 9:16, 1:1 and 16:9.",
    ],
    requirements: [
      "Reels, ads or short films you've edited.",
      "Premiere Pro, After Effects, DaVinci Resolve or CapCut.",
      "A good ear for music and rhythm.",
    ],
    open: true,
  },
];

export const OPEN_ROLES = ROLES.filter((r) => r.open);
export const getRole = (slug: string) => ROLES.find((r) => r.slug === slug);

export const EXPERIENCE = ["Fresher", "Less than 1 year", "1 to 2 years", "2 to 4 years", "4 to 6 years", "6+ years"];
