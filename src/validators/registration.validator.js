/**
 * Pure validation rules for the join registration form.
 * No I/O, no network — importable by the service AND the verification script.
 * Each check returns { ok, value?, err? }.
 */

const NAME_RE = /^[A-Za-z.()\s]+$/;
const ID_RE = /^[0-9]{6}$/;
const CHARS = "A-Z a-z 0-9 spaces ().,: max 256";
const CLUB_NAME_RE = /^[A-Za-z0-9 ().,:]+$/;
const WP_RE = /^\+[1-9][0-9]{7,14}$/;
const FB_USERNAME_RE = /^[A-Za-z0-9._-]{1,64}$/;
const FB_DOMAINS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "fb.com", "www.fb.com"]);
const FB_RESERVED = new Set([
  "profile.php", "groups", "events", "pages", "photo", "photos", "videos", "watch",
  "marketplace", "sharer", "login", "help", "about", "settings"
]);

function sanitizeWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}

function isBinary(v) {
  return typeof v === "boolean" || v === 0 || v === 1 || v === "0" || v === "1";
}
function toBool(v) {
  if (typeof v === "boolean") return v;
  return v === 1 || v === "1" || String(v).toLowerCase() === "true";
}

// --- WhatsApp normalization + validation ---
function normalizeWp(raw) {
  let s = String(raw || "").replace(/[\s.\-()]/g, "");
  if (s.startsWith("+")) return s;
  if (s.startsWith("00")) return "+" + s.slice(2);
  if (s.startsWith("0") && /^\d{11}$/.test(s)) return "+880" + s.slice(1); // BD national
  if (/^\d{12}$/.test(s) && s.startsWith("880")) return "+" + s; // 880 prefix w/o +
  if (/^\d{9,15}$/.test(s)) return "+" + s;
  return s;
}
function validateWp(raw) {
  const s = String(raw || "").trim();
  if (!s) return { ok: false, err: "WhatsApp number is required.", field: "wpNumber" };
  const norm = normalizeWp(s);
  if (!norm.startsWith("+")) return { ok: false, err: "Add country code, e.g. +8801712345678.", field: "wpNumber" };
  if (!WP_RE.test(norm)) return { ok: false, err: "Enter 8–15 digits after the country code (e.g. +8801712345678).", field: "wpNumber" };
  // Bangladesh-specific tighter check when country code is 880
  if (norm.startsWith("+880")) {
    const bdMatch = norm.match(/^\+8801[3-9]\d{8}$/);
    if (!bdMatch) return { ok: false, err: "Enter a valid Bangladeshi mobile number (01[3-9]XXXXXXXX).", field: "wpNumber" };
  }
  return { ok: true, value: norm };
}

// --- Facebook URL verifier ---
function validateFb(raw) {
  const s = String(raw || "").trim();
  if (!s) return { ok: true, value: null }; // optional
  if (s.length > 200) return { ok: false, err: "Facebook link must be 200 characters or fewer.", field: "fbID" };
  if (/\s/.test(s)) return { ok: false, err: "Facebook links can't contain spaces.", field: "fbID" };
  let url;
  try { url = new URL(s); } catch { return { ok: false, err: "Invalid URL — include https://, e.g. https://facebook.com/yourname.", field: "fbID" }; }
  if (url.protocol !== "https:")
    return { ok: false, err: "Only https:// links are accepted.", field: "fbID" };
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const root = host === "facebook.com" || host === "m.facebook.com" || host === "fb.com" || host === "www.fb.com";
  if (!root) return { ok: false, err: "This must be a Facebook link — domain has to be facebook.com or fb.com.", field: "fbID" };
  const path = url.pathname.replace(/^\//, "").replace(/\/+$/, "");
  const seg = path.split("/").filter(Boolean);
  if (!seg.length) return { ok: false, err: "Your link is missing a username — it should end with your profile name, e.g. https://facebook.com/yourname.", field: "fbID" };
  if (seg.length > 1) return { ok: false, err: "Use your profile link only — not a group, page, event, or photo link.", field: "fbID" };
  const last = seg[seg.length - 1];
  if (FB_RESERVED.has(last)) return { ok: false, err: "Use your profile link — not a group, page, event, or photo link.", field: "fbID" };
  if (!FB_USERNAME_RE.test(last))
    return { ok: false, err: "Profile names allow only letters, numbers, periods (.), hyphens (-) and underscores (_).", field: "fbID" };
  return { ok: true, value: "https://" + (host === "www.fb.com" || host === "m.facebook.com" ? "facebook.com" : host) + "/" + last };
}

// --- Free-text club names (A-Z a-z 0-9 spaces ().,: max 256) ---
function validateClubName(raw, label) {
  const s = typeof raw === "string" ? raw : "";
  const collapsed = sanitizeWhitespace(s);
  if (!collapsed) return { ok: false, err: `${label} is required when answered "Yes".`, field: label };
  if (collapsed.length > 256) return { ok: false, err: `${label} must be 256 characters or fewer.`, field: label };
  if (!CLUB_NAME_RE.test(collapsed)) return { ok: false, err: CHARS + ` — ${label} contains invalid characters.`, field: label };
  return { ok: true, value: collapsed };
}

// --- Main entry ---
function validateRegistration(body) {
  const out = {};
  const errors = [];

  // fullName
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) errors.push({ field: "fullName", err: "Please enter your full name." });
  else if (fullName.length > 64) errors.push({ field: "fullName", err: "Full name must be 64 characters or fewer." });
  else if (!NAME_RE.test(fullName)) errors.push({ field: "fullName", err: "Only letters (A-Z, a-z), spaces, dots, and parentheses allowed." });
  else out.fullName = fullName;

  // collegeId
  const collegeId = typeof body.collegeId === "string" ? body.collegeId.trim() : "";
  if (!collegeId) errors.push({ field: "collegeId", err: "Please enter your College ID." });
  else if (!ID_RE.test(collegeId)) errors.push({ field: "collegeId", err: "College ID must be exactly 6 numeric digits." });
  else out.collegeId = collegeId;

  // section
  const ALLOWED_SECTIONS = new Set(["S1","S2","S3","S4","S5","S6","S7","S8","S9","S10","S11","S12","S13","S14","S15","S16","S17","S18","B1","B2","B3","B4","B5","H"]);
  const section = typeof body.section === "string" ? body.section.trim() : "";
  if (!section) errors.push({ field: "section", err: "Select your section." });
  else if (!ALLOWED_SECTIONS.has(section)) errors.push({ field: "section", err: "Invalid section." });
  else out.section = section;

  // house
  const ALLOWED_HOUSES = new Set(["MAR", "MK", "MR", "MJ"]);
  const house = typeof body.house === "string" ? body.house.trim() : "";
  if (!house) errors.push({ field: "house", err: "Select your house." });
  else if (!ALLOWED_HOUSES.has(house)) errors.push({ field: "house", err: "Invalid house." });
  else out.house = house;

  // interests
  if (!Array.isArray(body.interests) || body.interests.length === 0)
    errors.push({ field: "interests", err: "Pick at least one interest." });
  else {
    const ALLOWED_INTERESTS = new Set(["Networking","Leadership","Marketing","Finance","Strategy","FinTech","Public Speaking","Event Management","Content Creation","Design","Research","Debate"]);
    const bad = body.interests.filter((i) => typeof i !== "string" || !ALLOWED_INTERESTS.has(i.trim()));
    if (bad.length) errors.push({ field: "interests", err: "Invalid interest selected." });
    else out.interests = body.interests.map((i) => i.trim());
  }

  // likeCookies
  if (!isBinary(body.likeCookies)) errors.push({ field: "likeCookies", err: "Answer the cookies question." });
  else out.likeCookies = toBool(body.likeCookies);

  // --- NEW FIELDS ---
  // prevClub
  if (!isBinary(body.prevClub)) errors.push({ field: "prevClub", err: "Answer whether you have previous clubbing experience." });
  else out.prevClub = toBool(body.prevClub);

  // joinedClubs
  if (!isBinary(body.joinedClubs)) errors.push({ field: "joinedClubs", err: "Answer whether you joined any other ACC club." });
  else out.joinedClubs = toBool(body.joinedClubs);

  // prevClubName (required iff prevClub === true)
  if (out.prevClub === true) {
    const pn = validateClubName(body.prevClubName, "Previous club details");
    if (!pn.ok) errors.push({ field: "prevClubName", err: pn.err });
    else out.prevClubName = pn.value;
  } else {
    out.prevClubName = null;
  }

  // nameOfClubs (required iff joinedClubs === true)
  if (out.joinedClubs === true) {
    const cn = validateClubName(body.nameOfClubs, "Club names");
    if (!cn.ok) errors.push({ field: "nameOfClubs", err: cn.err });
    else out.nameOfClubs = cn.value;
  } else {
    out.nameOfClubs = null;
  }

  // wpNumber (required)
  const wp = validateWp(body.wpNumber);
  if (!wp.ok) errors.push({ field: "wpNumber", err: wp.err });
  else out.wpNumber = wp.value;

  // fbID (optional)
  const fb = validateFb(body.fbID);
  if (!fb.ok) errors.push({ field: "fbID", err: fb.err });
  else out.fbID = fb.value;

  // cf_token
  const cf_token = typeof body.cf_token === "string" ? body.cf_token.trim() : "";
  if (!cf_token) errors.push({ field: "cf_token", err: "Security token missing — retry." });
  else out.cf_token = cf_token;

  if (errors.length) return { ok: false, errors: errors, value: out };
  return { ok: true, value: out };
}

module.exports = { validateRegistration, validateWp, validateFb, validateClubName, isBinary, toBool };
