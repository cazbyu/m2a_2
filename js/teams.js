// Tournament 2025-26 Bracket Data
// Extracted from Sandy Rotary Club bracket spreadsheet

const TOURNAMENT = {
  year: 2026,
  name: "March -2- Africa Bracket Challenge",

  // First Four play-in games (Dayton, OH)
  firstFour: [
    { seed: 16, team1: "UMBC", team2: "Howard", region: "Midwest", advancesTo: "vs (1) Michigan" },
    { seed: 16, team1: "Prairie View A&M", team2: "Lehigh", region: "South", advancesTo: "vs (1) Florida" },
    { seed: 11, team1: "Miami OH", team2: "SMU", region: "Midwest", advancesTo: "vs (6) Tennessee" },
    { seed: 11, team1: "Texas", team2: "NC State", region: "West", advancesTo: "vs (6) BYU" }
  ],

  // Regions with teams in standard bracket order: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
  regions: [
    {
      name: "East",
      location: "Washington DC",
      teams: [
        { seed: 1,  name: "Duke",           city: "Greenville" },
        { seed: 16, name: "Siena",           city: "Greenville" },
        { seed: 8,  name: "Ohio State",      city: "Greenville" },
        { seed: 9,  name: "TCU",             city: "Greenville" },
        { seed: 5,  name: "St John's",       city: "San Diego" },
        { seed: 12, name: "Northern Iowa",   city: "San Diego" },
        { seed: 4,  name: "Kansas",          city: "San Diego" },
        { seed: 13, name: "Cal Baptist",     city: "San Diego" },
        { seed: 6,  name: "Louisville",      city: "Buffalo" },
        { seed: 11, name: "South Florida",   city: "Buffalo" },
        { seed: 3,  name: "Michigan State",  city: "Buffalo" },
        { seed: 14, name: "N Dakota St",     city: "Buffalo" },
        { seed: 7,  name: "UCLA",            city: "Philadelphia" },
        { seed: 10, name: "UCF",             city: "Philadelphia" },
        { seed: 2,  name: "UConn",           city: "Philadelphia" },
        { seed: 15, name: "Furman",          city: "Philadelphia" }
      ]
    },
    {
      name: "Midwest",
      location: "Chicago",
      teams: [
        { seed: 1,  name: "Michigan",         city: "Buffalo" },
        { seed: 16, name: "UMBC/Howard",      city: "Buffalo" },
        { seed: 8,  name: "Georgia",          city: "Buffalo" },
        { seed: 9,  name: "Saint Louis",      city: "Buffalo" },
        { seed: 5,  name: "Texas Tech",       city: "Tampa" },
        { seed: 12, name: "Akron",            city: "Tampa" },
        { seed: 4,  name: "Alabama",          city: "Tampa" },
        { seed: 13, name: "Hofstra",          city: "Tampa" },
        { seed: 6,  name: "Tennessee",        city: "Philadelphia" },
        { seed: 11, name: "Miami OH/SMU",     city: "Philadelphia" },
        { seed: 3,  name: "Virginia",         city: "Philadelphia" },
        { seed: 14, name: "Wright State",     city: "Philadelphia" },
        { seed: 7,  name: "Kentucky",         city: "St. Louis" },
        { seed: 10, name: "Santa Clara",      city: "St. Louis" },
        { seed: 2,  name: "Iowa State",       city: "St. Louis" },
        { seed: 15, name: "Tennessee St",     city: "St. Louis" }
      ]
    },
    {
      name: "South",
      location: "Houston",
      teams: [
        { seed: 1,  name: "Florida",              city: "Tampa" },
        { seed: 16, name: "Prairie View/Lehigh",   city: "Tampa" },
        { seed: 8,  name: "Clemson",               city: "Tampa" },
        { seed: 9,  name: "Iowa",                  city: "Tampa" },
        { seed: 5,  name: "Vanderbilt",            city: "Oklahoma City" },
        { seed: 12, name: "McNeese",               city: "Oklahoma City" },
        { seed: 4,  name: "Nebraska",              city: "Oklahoma City" },
        { seed: 13, name: "Troy",                  city: "Oklahoma City" },
        { seed: 6,  name: "North Carolina",        city: "Greenville" },
        { seed: 11, name: "VCU",                   city: "Greenville" },
        { seed: 3,  name: "Illinois",              city: "Greenville" },
        { seed: 14, name: "Penn",                  city: "Greenville" },
        { seed: 7,  name: "Saint Mary's",          city: "Oklahoma City" },
        { seed: 10, name: "Texas A&M",             city: "Oklahoma City" },
        { seed: 2,  name: "Houston",               city: "Oklahoma City" },
        { seed: 15, name: "Idaho",                 city: "Oklahoma City" }
      ]
    },
    {
      name: "West",
      location: "San Jose",
      teams: [
        { seed: 1,  name: "Arizona",          city: "San Diego" },
        { seed: 16, name: "LIU",              city: "San Diego" },
        { seed: 8,  name: "Villanova",        city: "San Diego" },
        { seed: 9,  name: "Utah State",       city: "San Diego" },
        { seed: 5,  name: "Wisconsin",        city: "Portland" },
        { seed: 12, name: "High Point",       city: "Portland" },
        { seed: 4,  name: "Arkansas",         city: "Portland" },
        { seed: 13, name: "Hawai'i",          city: "Portland" },
        { seed: 6,  name: "BYU",              city: "Portland" },
        { seed: 11, name: "Texas/NC State",   city: "Portland" },
        { seed: 3,  name: "Gonzaga",          city: "Portland" },
        { seed: 14, name: "Kennesaw St",      city: "Portland" },
        { seed: 7,  name: "Miami",            city: "St. Louis" },
        { seed: 10, name: "Missouri",         city: "St. Louis" },
        { seed: 2,  name: "Purdue",           city: "St. Louis" },
        { seed: 15, name: "Queens",           city: "St. Louis" }
      ]
    }
  ],

  // Final Four matchup structure
  finalFour: {
    semi1: { region1: "East", region2: "Midwest" },
    semi2: { region1: "South", region2: "West" }
  },

  roundNames: [
    "Round of 64",
    "Round of 32",
    "16 Remain",
    "8 Left",
    "Finals",
    "Championship"
  ]
};

// ===== Team → Entrepreneur Mapping =====
// Each tournament team is randomly assigned to an entrepreneur.
// When that team wins, the entrepreneur wins points.

// Country → flag image path mapping
const COUNTRY_FLAGS = {
  'Malawi':   '/assets/Malawi.png',
  'Zambia':   '/assets/Zambia.png',
  'Uganda':   '/assets/Uganda.png',
  'Kenya':    '/assets/Kenya.png',
  'Zimbabwe': '/assets/Zimbabwe.png'
};

const TEAM_ENTREPRENEUR_MAP = {
  // Monica Ntchalachala — Malawi (placeholder — funded, will be replaced)
  'Duke':       { name: 'Monica Ntchalachala', country: 'Malawi' },
  'Tennessee':  { name: 'Monica Ntchalachala', country: 'Malawi' },
  'UCLA':       { name: 'Monica Ntchalachala', country: 'Malawi' },
  'Akron':      { name: 'Monica Ntchalachala', country: 'Malawi' },
  'Cal Baptist': { name: 'Monica Ntchalachala', country: 'Malawi' },

  // Enrique Hannock — Malawi
  'Arizona':        { name: 'Enrique Hannock', country: 'Malawi' },
  'North Carolina': { name: 'Enrique Hannock', country: 'Malawi' },
  'Miami':          { name: 'Enrique Hannock', country: 'Malawi' },
  'McNeese':        { name: 'Enrique Hannock', country: 'Malawi' },
  "Hawai'i":        { name: 'Enrique Hannock', country: 'Malawi' },

  // Kate Nanyangwe — Zambia
  'Florida':      { name: 'Kate Nanyangwe', country: 'Zambia' },
  'BYU':          { name: 'Kate Nanyangwe', country: 'Zambia' },
  "Saint Mary's": { name: 'Kate Nanyangwe', country: 'Zambia' },
  'High Point':   { name: 'Kate Nanyangwe', country: 'Zambia' },
  'Troy':         { name: 'Kate Nanyangwe', country: 'Zambia' },

  // Jane Ndashe — Zambia
  'Michigan':      { name: 'Jane Ndashe', country: 'Zambia' },
  'Louisville':    { name: 'Jane Ndashe', country: 'Zambia' },
  'Kentucky':      { name: 'Jane Ndashe', country: 'Zambia' },
  'Northern Iowa': { name: 'Jane Ndashe', country: 'Zambia' },
  'Hofstra':       { name: 'Jane Ndashe', country: 'Zambia' },

  // Lyampu Mubiana — Zambia (placeholder — funded, will be replaced)
  'UConn':       { name: 'Lyampu Mubiana', country: 'Zambia' },
  'Texas Tech':  { name: 'Lyampu Mubiana', country: 'Zambia' },
  'Ohio State':  { name: 'Lyampu Mubiana', country: 'Zambia' },
  'Miami OH/SMU': { name: 'Lyampu Mubiana', country: 'Zambia' },
  'N Dakota St': { name: 'Lyampu Mubiana', country: 'Zambia' },

  // Nanyangwe Katai — Zambia
  'Purdue':       { name: 'Nanyangwe Katai', country: 'Zambia' },
  'Vanderbilt':   { name: 'Nanyangwe Katai', country: 'Zambia' },
  'Villanova':    { name: 'Nanyangwe Katai', country: 'Zambia' },
  'VCU':          { name: 'Nanyangwe Katai', country: 'Zambia' },
  'Kennesaw St':  { name: 'Nanyangwe Katai', country: 'Zambia' },

  // Kendrick B. Makhurane — (placeholder — funded, will be replaced)
  'Houston':        { name: 'Kendrick B. Makhurane', country: 'Zimbabwe' },
  'Wisconsin':      { name: 'Kendrick B. Makhurane', country: 'Zimbabwe' },
  'Clemson':        { name: 'Kendrick B. Makhurane', country: 'Zimbabwe' },
  'Texas/NC State': { name: 'Kendrick B. Makhurane', country: 'Zimbabwe' },
  'Penn':           { name: 'Kendrick B. Makhurane', country: 'Zimbabwe' },

  // Saukilan Kapatamoyo — Uganda (placeholder — funded, will be replaced)
  'Iowa State':    { name: 'Saukilan Kapatamoyo', country: 'Uganda' },
  "St John's":     { name: 'Saukilan Kapatamoyo', country: 'Uganda' },
  'Georgia':       { name: 'Saukilan Kapatamoyo', country: 'Uganda' },
  'South Florida': { name: 'Saukilan Kapatamoyo', country: 'Uganda' },
  'Wright State':  { name: 'Saukilan Kapatamoyo', country: 'Uganda' },

  // Sandra Chisala — Zambia (placeholder — funded, will be replaced)
  'Michigan State': { name: 'Sandra Chisala', country: 'Zambia' },
  'Alabama':        { name: 'Sandra Chisala', country: 'Zambia' },
  'TCU':            { name: 'Sandra Chisala', country: 'Zambia' },
  'Santa Clara':    { name: 'Sandra Chisala', country: 'Zambia' },
  'Furman':         { name: 'Sandra Chisala', country: 'Zambia' },
  'UMBC/Howard':    { name: 'Sandra Chisala', country: 'Zambia' },

  // Jibril — Kenya
  'Gonzaga':             { name: 'Jibril', country: 'Kenya' },
  'Nebraska':            { name: 'Jibril', country: 'Kenya' },
  'Utah State':          { name: 'Jibril', country: 'Kenya' },
  'Texas A&M':           { name: 'Jibril', country: 'Kenya' },
  'Queens':              { name: 'Jibril', country: 'Kenya' },
  'Prairie View/Lehigh': { name: 'Jibril', country: 'Kenya' },

  // Esther Ruhara — Kenya
  'Illinois':     { name: 'Esther Ruhara', country: 'Kenya' },
  'Arkansas':     { name: 'Esther Ruhara', country: 'Kenya' },
  'Iowa':         { name: 'Esther Ruhara', country: 'Kenya' },
  'Missouri':     { name: 'Esther Ruhara', country: 'Kenya' },
  'Idaho':        { name: 'Esther Ruhara', country: 'Kenya' },
  'LIU':          { name: 'Esther Ruhara', country: 'Kenya' },

  // Lisa Jane Sithole — Zimbabwe
  'Virginia':       { name: 'Lisa Jane Sithole', country: 'Zimbabwe' },
  'Kansas':         { name: 'Lisa Jane Sithole', country: 'Zimbabwe' },
  'Saint Louis':    { name: 'Lisa Jane Sithole', country: 'Zimbabwe' },
  'UCF':            { name: 'Lisa Jane Sithole', country: 'Zimbabwe' },
  'Tennessee St':   { name: 'Lisa Jane Sithole', country: 'Zimbabwe' },
  'Siena':          { name: 'Lisa Jane Sithole', country: 'Zimbabwe' }
};
