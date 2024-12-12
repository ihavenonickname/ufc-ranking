import { useState, useEffect, useRef } from 'react';
import './App.css';

const SORT_TYPES = ['PEAK', 'CURRENT'];

function App() {
  const [fights, setFights] = useState([]);
  const [allWeights, setAllWeights] = useState([]);
  const [kFactor, setKFactor] = useState(40);
  const [knockoutBonus, setKnockoutBonus] = useState(0);
  const [weight, setWeight] = useState('');
  const [fighters, setFighters] = useState([]);
  const [sortType, setSortType] = useState('PEAK');
  const rankingProcessorWorkerRef = useRef(null);

  useEffect(() => {
    document.title = "UFC Ranking";
  }, []);

  useEffect(() => {
    const worker = new Worker(new URL('./rating-processing-worker.js', import.meta.url));

    rankingProcessorWorkerRef.current = worker;

    worker.addEventListener('message', (event) => setFighters(event.data));

    return () => worker.terminate();
  }, []);

  useEffect(() => {
    (async () => {
      const response = await fetch(`${process.env.PUBLIC_URL}/fights.json`);
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
    rankingProcessorWorkerRef.current.postMessage({
      kFactor,
      knockoutBonus,
      sortType,
      fights: fights.filter(x => x.weight === weight),
    });
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
          K factor: {kFactor}
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
      </div>

      <div>
        <label htmlFor="slider-ko-bonus">
          Kockout/Submisstion bonus: {knockoutBonus}%
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
