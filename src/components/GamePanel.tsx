
type GamePanelProps = {
    status: string;
    moveHistory: string[];
  
    onUndo: () => void;
    onNewGame: () => void;
    onFlipBoard: () => void;
};
  
function GamePanel({
    status,
    moveHistory,
    onUndo,
    onNewGame,
    onFlipBoard,
}: GamePanelProps) {
    return (
      <aside className="game-panel">
        <h2>Game information</h2>
  
        <div className="status-box">
          <h3>Game status</h3>
          <p>{status}</p>
        </div>
  
        <div className="moves-box">
          <h3>Move history</h3>
  
          <div className="move-history">
            {moveHistory.length === 0 ? (
              <p>No moves played yet.</p>
            ) : (
              <ol>
                {moveHistory.map((move, index) => (
                  <li key={index}>
                    {index % 2 === 0
                      ? "White"
                      : "Black"}
                    : {move}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
  
        <div className="game-controls">
          <button onClick={onUndo}>
            Undo move
          </button>
  
          <button onClick={onFlipBoard}>
            Flip board
          </button>
  
          <button onClick={onNewGame}>
            New game
          </button>
        </div>
      </aside>
    );
}
 
export default GamePanel;