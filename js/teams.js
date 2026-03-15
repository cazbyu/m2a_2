// NCAA Tournament 2025-26 Bracket Data
// Extracted from Sandy Rotary Club bracket spreadsheet

const TOURNAMENT = {
  year: 2026,
  name: "March -2- Africa Bracket Challenge",

  // First Four play-in games (resolved before main bracket)
  firstFour: [
    { seed: 16, team1: "Howard", team2: "Idaho", region: "Midwest", advancesTo: "vs (1) Michigan" },
    { seed: 16, team1: "Lehigh", team2: "Prairie View", region: "South", advancesTo: "vs (1) Florida" },
    { seed: 11, team1: "Santa Clara", team2: "Miami OH", region: "Midwest", advancesTo: "vs (6) Tennessee" },
    { seed: 11, team1: "SMU", team2: "Texas", region: "West", advancesTo: "vs (6) BYU" }
  ],

  // Regions with teams in standard bracket order: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
  regions: [
    {
      name: "East",
      location: "Washington DC",
      teams: [
        { seed: 1,  name: "Duke",           city: "Greenville" },
        { seed: 16, name: "UMBC",            city: "Greenville" },
        { seed: 8,  name: "Ohio State",      city: "Greenville" },
        { seed: 9,  name: "Villanova",       city: "Greenville" },
        { seed: 5,  name: "Texas Tech",      city: "San Diego" },
        { seed: 12, name: "Northern Iowa",   city: "San Diego" },
        { seed: 4,  name: "Alabama",         city: "San Diego" },
        { seed: 13, name: "CA Baptist",      city: "San Diego" },
        { seed: 6,  name: "North Carolina",  city: "Buffalo" },
        { seed: 11, name: "South Florida",   city: "Buffalo" },
        { seed: 3,  name: "Michigan St",     city: "Buffalo" },
        { seed: 14, name: "Wright St",       city: "Buffalo" },
        { seed: 7,  name: "Miami",           city: "Philadelphia" },
        { seed: 10, name: "UCF",             city: "Philadelphia" },
        { seed: 2,  name: "UConn",           city: "Philadelphia" },
        { seed: 15, name: "Queens",          city: "Philadelphia" }
      ]
    },
    {
      name: "Midwest",
      location: "Chicago",
      teams: [
        { seed: 1,  name: "Michigan",        city: "Buffalo" },
        { seed: 16, name: "Howard/Idaho",     city: "Buffalo" },
        { seed: 8,  name: "Georgia",          city: "Buffalo" },
        { seed: 9,  name: "TCU",              city: "Buffalo" },
        { seed: 5,  name: "Arkansas",         city: "Portland" },
        { seed: 12, name: "High Point",       city: "Portland" },
        { seed: 4,  name: "St John's",        city: "Portland" },
        { seed: 13, name: "Troy",             city: "Portland" },
        { seed: 6,  name: "Tennessee",        city: "Philadelphia" },
        { seed: 11, name: "Santa Clara/Miami OH", city: "Philadelphia" },
        { seed: 3,  name: "Virginia",         city: "Philadelphia" },
        { seed: 14, name: "Tennessee St",     city: "Philadelphia" },
        { seed: 7,  name: "UCLA",             city: "St. Louis" },
        { seed: 10, name: "Missouri",         city: "St. Louis" },
        { seed: 2,  name: "Iowa State",       city: "St. Louis" },
        { seed: 15, name: "Kennesaw St",      city: "St. Louis" }
      ]
    },
    {
      name: "South",
      location: "Houston",
      teams: [
        { seed: 1,  name: "Florida",         city: "Tampa" },
        { seed: 16, name: "Lehigh/Prairie View", city: "Tampa" },
        { seed: 8,  name: "Clemson",          city: "Tampa" },
        { seed: 9,  name: "Saint Louis",      city: "Tampa" },
        { seed: 5,  name: "Kansas",           city: "Oklahoma City" },
        { seed: 12, name: "Akron",            city: "Oklahoma City" },
        { seed: 4,  name: "Nebraska",         city: "Oklahoma City" },
        { seed: 13, name: "N Dakota St",      city: "Oklahoma City" },
        { seed: 6,  name: "Louisville",       city: "Greenville" },
        { seed: 11, name: "VCU",              city: "Greenville" },
        { seed: 3,  name: "Illinois",         city: "Greenville" },
        { seed: 14, name: "Penn",             city: "Greenville" },
        { seed: 7,  name: "Utah State",       city: "Oklahoma City" },
        { seed: 10, name: "Texas A&M",        city: "Oklahoma City" },
        { seed: 2,  name: "Houston",          city: "Oklahoma City" },
        { seed: 15, name: "Siena",            city: "Oklahoma City" }
      ]
    },
    {
      name: "West",
      location: "San Jose",
      teams: [
        { seed: 1,  name: "Arizona",         city: "San Diego" },
        { seed: 16, name: "Long Island",      city: "San Diego" },
        { seed: 8,  name: "Saint Mary's",     city: "San Diego" },
        { seed: 9,  name: "Iowa",             city: "San Diego" },
        { seed: 5,  name: "Wisconsin",        city: "Tampa" },
        { seed: 12, name: "McNeese",          city: "Tampa" },
        { seed: 4,  name: "Vanderbilt",       city: "Tampa" },
        { seed: 13, name: "Hofstra",          city: "Tampa" },
        { seed: 6,  name: "BYU",              city: "Portland" },
        { seed: 11, name: "SMU/Texas",        city: "Portland" },
        { seed: 3,  name: "Gonzaga",          city: "Portland" },
        { seed: 14, name: "Hawai'i",          city: "Portland" },
        { seed: 7,  name: "Kentucky",         city: "St. Louis" },
        { seed: 10, name: "NC State",         city: "St. Louis" },
        { seed: 2,  name: "Purdue",           city: "St. Louis" },
        { seed: 15, name: "Furman",           city: "St. Louis" }
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
    "Sweet 16",
    "Elite 8",
    "Final Four",
    "Championship"
  ]
};
