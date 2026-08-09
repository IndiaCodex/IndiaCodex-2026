const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const USE_MOCK = process.env.USE_MOCK !== 'false'; 

let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

function calculateTimeOffset(baseTime, minutesToAdd) {
  if (!baseTime) return "14:30";
  const [hours, minutes] = baseTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

app.post('/recommend', async (req, res) => {
  const { tripDestination, batteryLevel, carModel, preferredTime, chargingPriority } = req.body;

  if (!tripDestination || !batteryLevel || !carModel) {
    return res.status(400).json({ error: 'Missing required fields: tripDestination, batteryLevel, carModel' });
  }

  if (USE_MOCK || !ai) {
    console.log('[MOCK MODE] Returning mocked AI options for:', { tripDestination, batteryLevel, carModel, preferredTime, chargingPriority });
    await new Promise(r => setTimeout(r, 2000));
    
    return res.json([
      {
        chargerName: "Cardano SuperCharger Alpha",
        arrivalTime: preferredTime || "14:30",
        availableSlot: "Slot A2",
        pricing: "4.2 ADA/kWh",
        gridLoad: "Optimal",
        carbonSaved: "5.4 kg CO2",
        reasoning: `Selected for ${chargingPriority || 'Fastest Speed'}. This charger provides the optimal route without significant detours.`
      },
      {
        chargerName: "Lovelace Plaza Chargers",
        arrivalTime: calculateTimeOffset(preferredTime, 15),
        availableSlot: "Slot C1",
        pricing: "3.8 ADA/kWh",
        gridLoad: "Low",
        carbonSaved: "7.2 kg CO2",
        reasoning: "Slightly further but offers cheaper rates and lower grid load. Excellent for eco routing."
      },
      {
        chargerName: "Hoskinson Express Node",
        arrivalTime: calculateTimeOffset(preferredTime, 30),
        availableSlot: "Slot B4",
        pricing: "4.5 ADA/kWh",
        gridLoad: "High",
        carbonSaved: "4.1 kg CO2",
        reasoning: "A backup option along your route with ultra-fast charging capabilities."
      }
    ]);
  }

  try {
    const prompt = `
      You are an AI assistant for an EV charging network.
      The user is driving a ${carModel} with ${batteryLevel}% battery left, heading to ${tripDestination}.
      Their preferred arrival time is ${preferredTime} and their priority is ${chargingPriority}.
      
      Recommend 3 different chargers for them. Stagger the arrival times slightly (e.g. preferred time, +15 mins, +30 mins).
      
      CRITICAL: You must strictly use the term "charger" in your response. Do not use the words "station" or "stall".
      
      Respond strictly in JSON format as an array of exactly 3 objects with this schema:
      [
        {
          "chargerName": "Name of the charger",
          "arrivalTime": "Estimated arrival time (HH:MM)",
          "availableSlot": "Name of the available slot at the charger",
          "pricing": "e.g., 4.2 ADA/kWh",
          "gridLoad": "Low | Optimal | High",
          "carbonSaved": "e.g., 5.4 kg CO2",
          "reasoning": "A brief explanation of why this charger was chosen."
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text();
    let jsonResult;
    try {
      jsonResult = JSON.parse(resultText);
      if (!Array.isArray(jsonResult)) jsonResult = [jsonResult]; // fallback if it returns single object
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', resultText);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    res.json(jsonResult);

  } catch (error) {
    console.error('Error fetching recommendation from Gemini:', error);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Mock Mode is ${USE_MOCK || !ai ? 'ENABLED' : 'DISABLED'}`);
});
