import { publicAssetUrl } from "../../lib/basePath";

const STOCKFISH_GPL_URL = publicAssetUrl("licenses/stockfish-GPL-3.0.txt");
const STOCKFISH_SOURCE_URL = publicAssetUrl("licenses/stockfish-corresponding-source.md");
const THIRD_PARTY_LICENSES_URL = publicAssetUrl("licenses/THIRD_PARTY_LICENSES.md");

export default function AboutSection() {
  return (
    <section className="profile-about" aria-labelledby="about-heading">
      <div className="profile-section-heading">
        <div>
          <h2 id="about-heading">About</h2>
          <p>Adaptive Chess Trainer and the software it includes.</p>
        </div>
      </div>

      <p>
        Adaptive Chess Trainer is a browser chess application. You play against a Stockfish opponent
        whose strength follows an estimated rating, then review the game with a custom move-quality
        scale.
      </p>

      <p>
        Opponent play and move analysis use Stockfish.js 19 Lite, © 2026 Chess.com, LLC, licensed
        under the GNU GPLv3. Stockfish.js is based on Stockfish by T. Romstad, M. Costalba, J.
        Kiiski, G. Linscott, and other contributors.
      </p>

      <ul className="profile-about__links">
        <li>
          <a href={STOCKFISH_GPL_URL}>Stockfish.js GNU GPLv3 license</a>
        </li>
        <li>
          <a href={STOCKFISH_SOURCE_URL}>Corresponding Stockfish.js source</a>
        </li>
        <li>
          <a href={THIRD_PARTY_LICENSES_URL}>Third-party licenses</a>
        </li>
      </ul>

      <p className="profile-about__copyright">
        © 2026 Varun Ramanathan. All rights reserved for the original Adaptive Chess Trainer
        application. This notice does not cover Stockfish or other third-party components.
      </p>
    </section>
  );
}
