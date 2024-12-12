import { useState, useEffect } from 'react';
import './App.css';

const SORT_TYPES = ['PEAK', 'CURRENT'];

function newRatings(winnerRating, loserRating, bonus, k) {
  const expectedVictory = 1 / (1 + (Math.pow(10, (loserRating - winnerRating) / 400)));
  const delta = Math.round(k * (1 - expectedVictory) * (1 + bonus / 100));
  return [winnerRating + delta, loserRating - delta];
}

function App() {
  const [fights, setFights] = useState([]);
  const [allWeights, setAllWeights] = useState([]);
  const [kFactor, setKFactor] = useState(40);
  const [knockoutBonus, setKnockoutBonus] = useState(0);
  const [weight, setWeight] = useState('');
  const [fighters, setFighters] = useState([]);
  const [sortType, setSortType] = useState('PEAK');

  useEffect(() => {
    (async () => {
      const response = await fetch('/fights.json');
      const data = await response.json();

      const cleaned = (
        data
          .filter(x => x.weight !== 'UNKNOWN')
          .sort((x, y) => new Date(x.date) - new Date(y.date))
      );

      setFights(cleaned);
      setAllWeights([...new Set(cleaned.map(x => x.weight))]);
    })();
  }, []);

  useEffect(() => {
    setWeight(allWeights[0]);
  }, [allWeights]);

  useEffect(() => {
    const filteredFights = fights.filter(x => x.weight === weight);

    const ratings = filteredFights.reduce((acc, fight) => {
      const winnerRating = acc[fight.winner] || { current: 1000, peak: 1000 };
      const loserRating = acc[fight.loser] || { current: 1000, peak: 1000 };

      const [newWinnerCurrentRating, newLoserCurrentRating] = newRatings(
        winnerRating.current,
        loserRating.current,
        fight.method === 'DECISION' ? 0 : knockoutBonus,
        kFactor);

      return {
        ...acc,
        [fight.winner]: {
          current: newWinnerCurrentRating,
          peak: newWinnerCurrentRating > winnerRating.peak
            ? newWinnerCurrentRating
            : winnerRating.peak,
        },
        [fight.loser]: { ...loserRating, current: newLoserCurrentRating },
      };
    }, {});

    const history = filteredFights.reduce((acc, fight) => {
      const historyWinner = acc[fight.winner] || { wins: 0, losses: 0 };
      const historyLoser = acc[fight.winner] || { wins: 0, losses: 0 };
      return {
        ...acc,
        [fight.winner]: { ...historyWinner, wins: historyWinner.wins + 1 },
        [fight.loser]: { ...historyLoser, losses: historyLoser.losses + 1 },
      }
    }, {});

    setFighters(
      Object.entries(ratings)
        .map(([name, rating]) => ({ name, rating, ...history[name] }))
        .sort((x, y) =>  sortType === 'PEAK'
            ? (y.rating.peak - x.rating.peak)
            : (y.rating.current - x.rating.current)
        )
    );
  }, [fights, weight, kFactor, knockoutBonus, sortType]);

  if (fights.length === 0) {
    return <div>
      Loading...
    </div>;
  }

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
        <label htmlFor="weight-select">
          Weight class:
        </label>
        <select
          id="weight-select"
          value={weight}
          onChange={ev => setWeight(ev.target.value)}
        >
          {
            allWeights.map(x => <option key={x} value={x}>{x}</option>)
          }
        </select>
      </div>

      <div>
        <label htmlFor="sort-type-select">
          Sort:
        </label>
        <select
          id="sort-type-select"
          value={sortType}
          onChange={ev => setSortType(ev.target.value)}
        >
          {
            SORT_TYPES.map(x => <option key={x} value={x}>{x} rating</option>)
          }
        </select>
      </div>

      <div>
        <ol>
          {
            fighters.map(x => <li key={x.name}>
              <div>
                <label>Name:</label> {x.name}
              </div>
              <div>
                <label>Rating:</label> {x.rating.current} ({x.rating.peak})
              </div>
              <div>
                <label>Wins:</label> {x.wins}
              </div>
              <div>
                <label>Losses:</label> {x.losses}
              </div>
            </li>)
          }
        </ol>
      </div>
    </div>
  );
}

export default App;
