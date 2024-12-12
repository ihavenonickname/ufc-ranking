function calculateRatings(winnerRating, loserRating, bonus, k) {
  const expectedVictory = 1 / (1 + (Math.pow(10, (loserRating - winnerRating) / 400)));
  const delta = Math.round(k * (1 - expectedVictory) * (1 + bonus / 100));
  return [winnerRating + delta, loserRating - delta];
}

function generateFightersRanking(fights, knockoutBonus, kFactor, sortType) {
  const ratings = fights.reduce((acc, fight) => {
    const winnerRating = acc[fight.winner] || { current: 1000, peak: 1000 };
    const loserRating = acc[fight.loser] || { current: 1000, peak: 1000 };

    const [newWinnerCurrentRating, newLoserCurrentRating] = calculateRatings(
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

  const history = fights.reduce((acc, fight) => {
    const historyWinner = acc[fight.winner] || { wins: 0, losses: 0 };
    const historyLoser = acc[fight.winner] || { wins: 0, losses: 0 };
    return {
      ...acc,
      [fight.winner]: { ...historyWinner, wins: historyWinner.wins + 1 },
      [fight.loser]: { ...historyLoser, losses: historyLoser.losses + 1 },
    }
  }, {});

  return (
    Object.entries(ratings)
      .map(([name, rating]) => ({ name, rating, ...history[name] }))
      .sort((x, y) =>  sortType === 'PEAK'
          ? (y.rating.peak - x.rating.peak)
          : (y.rating.current - x.rating.current)
      )
  );
}

onmessage = (ev) => {
  const {fights, knockoutBonus, kFactor, sortType} = ev.data;
  const id = Math.random();
  console.time('id')
  const fighters = generateFightersRanking(fights, knockoutBonus, kFactor, sortType);
  console.timeEnd('id');
  postMessage(fighters);
};
