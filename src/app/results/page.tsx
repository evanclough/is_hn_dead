/*

  FRONTEND PAGE: /results

  Displays the results of the experiment.

  For now, shows the total number of correct and incorrect guesses,
  and the top 5 bots, ranked by deception score. 

  TODO:
  should eventually show average deception score among bots as well,
  lot more stuff to potentially be put in here.

*/


import { grabTopBots } from "@/lib/db";
import { BotPerformance } from "@/types"

import {
  NUM_TOP_BOTS
} from "@/lib/constants";
export default async function ResultsPage() {

  const topBots: BotPerformance[] | null = await grabTopBots();

  return (
    <main>
      <h1>Results</h1>

      <h2>Top {NUM_TOP_BOTS} Bots by Incorrect Ratio</h2>
      {topBots === null ? (
        <p>Error fetching results.</p>
      ) : (
        <ul>
          {topBots!.map((bot) => (
            <li key={bot.username}>
              <a href={`/bot/${bot.username}`}>{bot.username}</a> –{" "}
              {(bot.incorrectRatio * 100).toFixed(1)}% human guesses
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
