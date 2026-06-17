const fs = require('fs');

const BASE_FILE = 'data.json';

const SOURCES = [
  {
    name: 'ESPN calendario Mundial 2026',
    type: 'html',
    url: 'https://www.espn.com/soccer/story/_/id/48939282/2026-fifa-world-cup-fixtures-results-match-schedule'
  },
  {
    name: '101greatgoals calendario Mundial 2026',
    type: 'html',
    url: 'https://www.101greatgoals.com/football/world-cup-news/world-cup-2026-fixtures-dates-games-schedule-results-football/'
  },
  {
    name: 'OpenWorldCup2026 GitHub',
    type: 'json',
    url: 'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/football.matches.json'
  }
];

const ALIAS = {
  'mexico': 'México',
  'south africa': 'Sudáfrica',
  'rsa': 'Sudáfrica',

  'south korea': 'Corea del Sur',
  'korea republic': 'Corea del Sur',

  'czechia': 'República Checa',
  'czech republic': 'República Checa',

  'canada': 'Canadá',
  'bosnia and herzegovina': 'Bosnia y Herzegovina',
  'bosnia herzegovina': 'Bosnia y Herzegovina',
  'bih': 'Bosnia y Herzegovina',

  'qatar': 'Qatar',
  'switzerland': 'Suiza',

  'brazil': 'Brasil',
  'morocco': 'Marruecos',
  'haiti': 'Haití',
  'scotland': 'Escocia',

  'usa': 'Estados Unidos',
  'united states': 'Estados Unidos',
  'united states of america': 'Estados Unidos',

  'paraguay': 'Paraguay',
  'australia': 'Australia',
  'turkiye': 'Turquía',
  'turkey': 'Turquía',

  'germany': 'Alemania',
  'curacao': 'Curazao',

  'cote divoire': 'Costa de Marfil',
  'cote d ivoire': 'Costa de Marfil',
  'ivory coast': 'Costa de Marfil',

  'ecuador': 'Ecuador',
  'netherlands': 'Países Bajos',
  'japan': 'Japón',
  'sweden': 'Suecia',
  'tunisia': 'Túnez',

  'belgium': 'Bélgica',
  'egypt': 'Egipto',
  'iran': 'Irán',
  'ir iran': 'Irán',
  'new zealand': 'Nueva Zelanda',

  'spain': 'España',
  'cabo verde': 'Cabo Verde',
  'cape verde': 'Cabo Verde',
  'saudi arabia': 'Arabia Saudita',
  'uruguay': 'Uruguay',

  'france': 'Francia',
  'senegal': 'Senegal',
  'iraq': 'Irak',
  'norway': 'Noruega',

  'argentina': 'Argentina',
  'algeria': 'Argelia',
  'austria': 'Austria',
  'jordan': 'Jordania',

  'portugal': 'Portugal',
  'dr congo': 'RD Congo',
  'congo dr': 'RD Congo',
  'uzbekistan': 'Uzbekistán',
  'colombia': 'Colombia',

  'england': 'Inglaterra',
  'croatia': 'Croacia',
  'ghana': 'Ghana',
  'panama': 'Panamá'
};

function norm(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canon(value) {
  const key = norm(value);
  return ALIAS[key] || String(value || '').trim();
}

function num(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function getText(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 Mundial2026GitHubAction'
    }
  });

  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ' - ' + url);
  }

  return await response.text();
}

function cleanHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');
}

function extractArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.matches)) {
    return data.matches;
  }

  if (data && Array.isArray(data.games)) {
    return data.games;
  }

  if (data && Array.isArray(data.events)) {
    return data.events;
  }

  if (data && Array.isArray(data.event)) {
    return data.event;
  }

  if (data && Array.isArray(data.response)) {
    return data.response;
  }

  const out = [];

  if (data && typeof data === 'object') {
    Object.values(data).forEach(function (value) {
      if (Array.isArray(value)) {
        value.forEach(function (item) {
          out.push(item);
        });
      }
    });
  }

  return out;
}

function parseJsonMatch(item, sourceName) {
  if (Array.isArray(item)) {
    return {
      home: canon(item[0]),
      away: canon(item[1]),
      hg: num(item[2]),
      ag: num(item[3]),
      source: sourceName
    };
  }

  const home =
    item.home_team ||
    item.homeTeam ||
    item.home ||
    item.strHomeTeam ||
    item.team1 ||
    item.home_name ||
    item.homeTeamName;

  const away =
    item.away_team ||
    item.awayTeam ||
    item.away ||
    item.strAwayTeam ||
    item.team2 ||
    item.away_name ||
    item.awayTeamName;

  let hg =
    item.home_score ??
    item.homeScore ??
    item.intHomeScore ??
    item.score_home ??
    item.goals_home;

  let ag =
    item.away_score ??
    item.awayScore ??
    item.intAwayScore ??
    item.score_away ??
    item.goals_away;

  const score =
    item.score ||
    item.result ||
    item.final_score ||
    item.strResult;

  if ((hg === undefined || ag === undefined) && typeof score === 'string') {
    const found = score.match(/(\d+)\s*[-:]\s*(\d+)/);

    if (found) {
      hg = found[1];
      ag = found[2];
    }
  }

  return {
    home: canon(home),
    away: canon(away),
    hg: num(hg),
    ag: num(ag),
    source: sourceName
  };
}

function findScoreInText(text, home, away) {
  const clean = norm(text);
  const h = norm(home);
  const a = norm(away);

  const hi = clean.indexOf(h);
  const ai = clean.indexOf(a);

  if (hi < 0 || ai < 0) {
    return null;
  }

  const start = Math.max(0, Math.min(hi, ai) - 160);
  const end = Math.min(
    clean.length,
    Math.max(hi, ai) + Math.max(h.length, a.length) + 160
  );

  const segment = clean.slice(start, end);
  const homeBeforeAway = segment.indexOf(h) < segment.indexOf(a);

  const numbers = segment.match(/\b\d{1,2}\b/g);

  if (!numbers || numbers.length < 2) {
    return null;
  }

  const first = Number(numbers[0]);
  const second = Number(numbers[1]);

  if (homeBeforeAway) {
    return {
      hg: first,
      ag: second
    };
  }

  return {
    hg: second,
    ag: first
  };
}

function applyMatch(data, parsed) {
  if (
    !parsed.home ||
    !parsed.away ||
    parsed.hg === null ||
    parsed.ag === null
  ) {
    return 0;
  }

  let updated = 0;

  Object.keys(data.matches).forEach(function (group) {
    data.matches[group].forEach(function (match) {
      const mh = norm(match[0]);
      const ma = norm(match[1]);
      const ph = norm(parsed.home);
      const pa = norm(parsed.away);

      const sameOrder = mh === ph && ma === pa;
      const reverseOrder = mh === pa && ma === ph;

      if (sameOrder || reverseOrder) {
        if (sameOrder) {
          match[2] = parsed.hg;
          match[3] = parsed.ag;
        } else {
          match[2] = parsed.ag;
          match[3] = parsed.hg;
        }

        match[4] = parsed.source;
        updated += 1;
      }
    });
  });

  return updated;
}

function mergeJsonSource(data, json, sourceName) {
  let updated = 0;

  extractArray(json).forEach(function (item) {
    updated += applyMatch(data, parseJsonMatch(item, sourceName));
  });

  return updated;
}

function mergeHtmlSource(data, html, sourceName) {
  let updated = 0;
  const text = cleanHtml(html);

  Object.keys(data.matches).forEach(function (group) {
    data.matches[group].forEach(function (match) {
      const score = findScoreInText(text, match[0], match[1]);

      if (score) {
        match[2] = score.hg;
        match[3] = score.ag;
        match[4] = sourceName;
        updated += 1;
      }
    });
  });

  return updated;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(BASE_FILE, 'utf8'));

  const logs = [];
  let total = 0;

  for (const source of SOURCES) {
    try {
      const url =
        source.url +
        (source.url.includes('?') ? '&' : '?') +
        'ts=' +
        Date.now();

      const text = await getText(url);

      let applied = 0;

      if (source.type === 'json') {
        const json = JSON.parse(text);
        applied = mergeJsonSource(data, json, source.name);
      } else {
        applied = mergeHtmlSource(data, text, source.name);
      }

      total += applied;

      logs.push({
        ok: true,
        msg: source.name + ' consultado. Marcadores aplicados: ' + applied
      });

    } catch (error) {
      logs.push({
        ok: false,
        msg: source.name + ' falló: ' + error.message
      });
    }
  }

  data.updatedAt = new Date().toISOString();

  data.source =
    'GitHub Actions automático. Total de marcadores aplicados en esta ejecución: ' +
    total;

  data.logs = logs;

  fs.writeFileSync(BASE_FILE, JSON.stringify(data, null, 2));

  console.log('data.json actualizado. Total aplicado:', total);
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});
