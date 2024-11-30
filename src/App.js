import { useState, useEffect } from 'react';
import './App.css';

const ALL_FIGHTS = [
  {
    winner: 'Gabriel',
    loser: 'Marcos',
    method: 'Submission',
    weightClass: 'Heavyheight',
  },
  {
    winner: 'João',
    loser: 'Guilherme',
    method: 'Knockout',
    weightClass: 'Light Heavyheight',
  },
  {
    winner: 'Gabriel',
    loser: 'Marcos',
    method: 'Decision',
    weightClass: 'Heavyheight',
  },
];

const WEIGHT_CLASSES = [...new Set(ALL_FIGHTS.map(x => x.weightClass))];

function App() {
  const [kFactor, setKFactor] = useState(40);
  const [knockoutBonus, setKnockoutBonus] = useState(0);
  const [weightClass, setWeightClass] = useState(WEIGHT_CLASSES[0]);
  const [fights, setFights] = useState([]);
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    setFights(ALL_FIGHTS.filter(x => x.weightClass === weightClass));
  }, [weightClass]);

  useEffect(() => {
    const reducer = (acc, fight) => {
      const winnerRating = acc[fight.winner] || 1000;
      const loserRating = acc[fight.loser] || 1000;

      const expectedVictory = 1 / (1 + (Math.pow(10, (loserRating - winnerRating) / 400)));
      let delta = kFactor * (1 - expectedVictory);

      if (fight.method === 'Submission' || fight.method === 'Knockout') {
        delta *= 1 + knockoutBonus / 100;
      }

      delta = Math.round(delta);

      return {
        ...acc,
        [fight.winner]: winnerRating + delta,
        [fight.loser]: loserRating - delta,
      };
    };

    setRatings(
      Object.entries(fights.reduce(reducer, {}))
        .map(([fighter, rating]) => ({fighter, rating}))
        .sort((x, y) => y.rating - x.rating)
    );
  }, [fights, kFactor, knockoutBonus]);

  return (
    <div>
      <div>
        <label htmlFor="slider-k-factor">
          K factor:
        </label>
        <input
          type="range"
          id="slider-k-factor"
          min="10"
          max="300"
          step="10"
          value={kFactor}
          onChange={x => setKFactor(x.target.value)}
        />
        <span>{kFactor}</span>
      </div>

      <div>
        <label htmlFor="slider-ko-bonus">
          Kockout/Submisstion bonus:
        </label>
        <input
          type="range"
          id="slider-ko-bonus"
          min="0"
          max="100"
          step="5"
          value={knockoutBonus}
          onChange={x => setKnockoutBonus(x.target.value)}
        />
        <span>{knockoutBonus}%</span>
      </div>

      <div>
        <select
          value={weightClass}
          onChange={ev => setWeightClass(ev.target.value)}
        >
          {
            WEIGHT_CLASSES.map(x => <option key={x} value={x}>{x}</option>)
          }
        </select>
      </div>

      <div>
        <ol>
          {
            ratings.map(x => <li>{x.fighter} {x.rating}</li>)
          }
        </ol>
      </div>
    </div>
  );
}

export default App;
