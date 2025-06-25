const functions = require("firebase-functions");
const axios = require("axios");

// SportsMonks API Token
const API_KEY = "5FRoem2oLHlu1xmtF0IdRPTwdm37Znh60OjaNrl29MgRO1NVU6yyONOA8jbH";

exports.getMatchOdds = functions.https.onRequest(async (req, res) => {
  // Allow CORS for all origins
  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    // Send response to preflight OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).send('');
    return;
  }

  const fixtureId = req.query.id; 
  
  if (!fixtureId) {
    res.status(400).send("Fixture ID is required. Please provide it as a query parameter (e.g., ?id=YOUR_FIXTURE_ID).");
    return;
  }

  try {
    const response = await axios.get(
      `https://football.sportsmonks.com/api/v2.0/odds/fixture/${fixtureId}?api_token=${API_KEY}`
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error("Odds fetch error:", err.message);
    res.status(500).send("Failed to fetch odds: " + err.message);
  }
});
