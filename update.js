const fs = require('fs');

const BASE_FILE = 'data.json';

// Fuentes públicas sin API key. GitHub Actions las consulta desde la nube.
const SOURCES = [
  {
    name: 'ESPN calendario Mundial 2026',
    url: 'https://www.espn.com/soccer/story/_/id/48939282/2026-fifa-world-cup-fixtures-results-match-schedule'
  },
  {
    name: '101greatgoals calendario Mundial 2026',
    url: 'https://www.101greatgoals.com/football/world-cup-news/world-cup-2026-fixtures-dates-games-schedule-results-football/'
  },
  {
    name: 'OpenWorldCup2026 GitHub',
    url: 'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/football.matches.json'
  }
];

function norm(x){
  return String(x || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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

