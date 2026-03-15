// NCAA Tournament 2025-26 Bracket Data
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
    "Sweet 16",
    "Elite 8",
    "Final Four",
    "Championship"
  ]
};
