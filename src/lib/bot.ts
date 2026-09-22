/* ------------------------------------------------------------------ */
/*  Locora — chat bot brain                                           */
/*  Powers the "other side" of demo conversations so real-time chat   */
/*  feels alive in a single-browser demo. Keyword rules + seeded      */
/*  variety keep replies contextual (price talk → counter-offers,    */
/*  timing talk → meetup proposals, etc).                             */
/* ------------------------------------------------------------------ */

import { areaName } from "./geo";
import { pickBySeed } from "./format";
import type { Conversation, User } from "./types";

const LANDMARKS: Record<string, string[]> = {
  kothrud: ["Cafe Coffee Day on Paud Road", "Vanaz metro station"],
  viman: ["Phoenix Marketcity food court", "Inorbit Mall, Viman Nagar"],
  kp: ["Osho Garden gate", "Bund Garden road cafe"],
  baner: [" Balewadi High Street", "the cafe near Baner slope"],
  hinjewadi: ["Hinjewadi Phase 1 circle", "Xion Mall"],
  aundh: ["Spicer College lane", "Aundh DG square"],
  kharadi: ["EON IT Park gate 2", "Phoenix Kharadi"],
  hadapsar: ["Seasons Mall", "Hadapsar Gadital"],
  wakad: ["Balewadi stadium parking", "Wakad bridge signal"],
  erandwane: ["Patanjali chowk", "Deccan Gymkhana"],
  magarpatta: ["Magarpatta City gate 3", "Seasons Tower"],
  kalyani: ["Bund Garden", "Kalyani Nagar bridge cafe"],
  swargate: ["Swargate bus stand", "Parvati taak"],
  shivanagar: ["Shivaji Nagar station", "Balgandharva"],
  fcroad: ["Fergusson College main gate", "Good Luck Chowk"],
  sadashiv: ["Shaniwar Wada gate", "Appa Balwant Chowk"],
  pashan: ["Pashan lake viewpoint"],
  bavdhan: ["Bavdhan bazaar"],
  balewadi: ["Balewadi High Street"],
};

export interface BotContext {
  me: User; // the "other" user (bot persona)
  subject: Conversation["subject"];
}

export function botReplyFor(userText: string, ctx: BotContext): string[] {
  const t = userText.toLowerCase();
  const { me, subject } = ctx;
  const area = areaName(me.area);
  const spot = pickBySeed(LANDMARKS[me.area] ?? ["a public spot nearby"], t);

  const isService = subject.type === "service" || subject.type === "request";
  const price = subject.price;

  // greetings
  if (/^(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/.test(t) && t.length < 30) {
    return [
      pickBySeed(
        [
          `Hey! 👋 Thanks for reaching out.`,
          `Hi there! How can I help?`,
          `Hello! Yes, tell me 🙂`,
        ],
        t
      ),
      isService
        ? `I'm around ${area} — tell me a bit about what you need and when, and I'll give you a clear quote.`
        : `The ${subject.title.toLowerCase()} is still with me in ${area}. What would you like to know?`,
    ];
  }

  // availability
  if (/still available|available|is it sold|sold yet|in stock/.test(t)) {
    return [
      isService
        ? `Yes, I'm taking bookings this week. What day and time suit you?`
        : `Yes, still available! 🙂 As long as this chat shows it, it's live.`,
    ];
  }

  // price negotiation
  if (/price|rate|cost|kitna|last price|discount|negotiable|lower|cheap|budget|final|offer|reduce/.test(t)) {
    if (isService) {
      return [
        `My usual rate starts around the listed price — final depends on the job size. Describe what you need and I'll give you an exact figure, no surprises.`,
      ];
    }
    if (price && /\d{4,6}/.test(t)) {
      return [
        `Hmm, let me think… I can stretch to ₹${Math.round((price * 0.97) / 100) * 100} if you can close this week — that's honestly my floor.`,
      ];
    }
    return [
      price
        ? `The listed price is ${`₹${price.toLocaleString("en-IN")}`} — there's a little room for a serious buyer. What did you have in mind?`
        : `Tell me your budget and I'll see what's possible.`,
    ];
  }

  // meeting / timing
  if (/meet|when|today|tomorrow|timing|time|slot|pick ?up|come|visit|where|address|location|place/.test(t)) {
    if (isService) {
      return [
        `I'm usually free ${pickBySeed(["between 10 AM and 7 PM", "in the mornings before noon", "after 4 PM on weekdays"], t)} — give me a day and I'll confirm a slot.`,
        `I serve ${area} and nearby. Share your building/area and I'll tell you the visit charge and a time slot.`,
      ];
    }
    return [
      `We can meet at ${spot} — ${pickBySeed(["tomorrow evening around 6", "Saturday morning", "this evening"], t + "m")} works well for me. You can check everything properly before paying.`,
    ];
  }

  // condition / trust
  if (/condition|scratch|dent|bill|warranty|box|battery|original|working|repair|issue|problem|damage/.test(t)) {
    return [
      isService
        ? `Every job I take comes with a workmanship warranty, and I show you exactly what needs fixing before touching anything. No surprise charges.`
        : `It's exactly as described in the listing — I'd rather show you everything in person before you pay a rupee. Happy to do a quick demo when we meet.`,
    ];
  }

  // thanks / bye
  if (/thank|thanks|thx|ok done|done|deal|great|perfect|see you/.test(t)) {
    return [
      pickBySeed(
        [
          `Great! 🙌 See you then — message me here if anything changes.`,
          `Perfect. Meeting details saved on my side too.`,
          `Awesome 😄 Anything else you need, just ping me here.`,
        ],
        t
      ),
    ];
  }

  // service-specific first message
  if (isService) {
    return [
      `Noted! I've done similar work around ${area}. Could you share a photo or a quick description, plus your preferred day? I'll confirm the quote and slot right here.`,
    ];
  }

  // default
  return [
    pickBySeed(
      [
        `Good question — let me check and get back to you here in a few minutes.`,
        `Sure, I can help with that. Anything specific about the listing you want me to clarify?`,
        `Noted 🙂 I'll keep this chat updated. Usually I reply within ${me.responseMins ?? 15} minutes.`,
      ],
      t
    ),
  ];
}
