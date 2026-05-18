/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameScene } from "./components/GameScene";
import { UI } from "./components/UI";

export default function App() {
  return (
    <div className="w-full h-screen overflow-hidden bg-neutral-900 touch-none flex flex-col justify-center">
      <div className="game-container shadow-2xl">
        <GameScene />
        <UI />
      </div>
    </div>
  );
}
