
type PromotionPiece = "q" | "r" | "b" | "n";

type PromotionDialogProps = {
  color: "w" | "b";

  onSelect: (piece: PromotionPiece) => void;

  onCancel: () => void;
};

const promotionPieces = [
  { type: "q", name: "Queen" },
  { type: "r", name: "Rook" },
  { type: "b", name: "Bishop" },
  { type: "n", name: "Knight" },
] as const;

const whiteSymbols = {
  q: "♕",
  r: "♖",
  b: "♗",
  n: "♘",
};

const blackSymbols = {
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
};

function PromotionDialog({
  color,
  onSelect,
  onCancel,
}: PromotionDialogProps) {
  const symbols =
    color === "w" ? whiteSymbols : blackSymbols;

  return (
    <div className="promotion-overlay">
      <div
        className="promotion-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Choose a promotion piece"
      >
        <h2>Choose your promotion</h2>

        <p>Select the piece your pawn will become.</p>

        <div className="promotion-options">
          {promotionPieces.map((piece) => (
            <button
              key={piece.type}
              onClick={() => onSelect(piece.type)}
            >
              <span className="promotion-symbol">
                {symbols[piece.type]}
              </span>

              <span>{piece.name}</span>
            </button>
          ))}
        </div>

        <button
          className="cancel-promotion"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default PromotionDialog;