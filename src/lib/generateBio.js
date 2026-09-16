// Deterministic per-artist bio text. There's no `bio` column in the schema
// (only the short `bio_mood` tagline), and adding one means another
// migration + re-seed round trip — so this composes a real paragraph from
// each artist's actual fields (never invents a name/genre), seeded by their
// id so the same artist always reads the same way rather than reshuffling
// on every render.

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick(seed, offset, options) {
  return options[(seed + offset) % options.length];
}

const ORIGINS = [
  'started out recording onto whatever was lying around',
  'came up through the local DIY circuit',
  'has been quietly releasing music for years before anyone outside the community noticed',
  'treats every release like a small, self-contained world',
  'works mostly alone, late, with the lights off',
];

const PROCESS = [
  'first takes usually make the final cut',
  'nothing gets fixed in the mix that could be fixed by playing it again',
  'the gear is old and the patience is longer',
  'a track is done when it stops changing, not when it sounds finished',
  'most of the good ideas happen by accident and get kept on purpose',
];

const COMMUNITY = [
  'sticks around to answer comments on old tracks',
  'shows up in other people’s threads more than their own',
  'would rather trade notes with another artist than run ads',
  'treats the people listening like the actual point',
  'still remembers who liked the very first upload',
];

export function generateBio(artist) {
  if (!artist) return '';
  const seed = hashSeed(artist.handle || artist.id || artist.display_name || 'artist');
  const name = artist.display_name;
  const mood = artist.bio_mood ? artist.bio_mood.replace(/\.$/, '') : null;

  const sentences = [];
  if (mood) {
    sentences.push(`${name} on their own terms: ${mood}.`);
  } else {
    sentences.push(`${name} ${pick(seed, 0, ORIGINS)}.`);
  }
  sentences.push(`${pick(seed, 1, PROCESS).replace(/^./, (c) => c.toUpperCase())}.`);
  sentences.push(
    `Off the mic, ${name.split(' ')[0]} ${pick(seed, 2, COMMUNITY)}${
      artist.is_verified ? ', which is most of why R’SPACE verified the account in the first place' : ''
    }.`
  );
  return sentences.join(' ');
}
