import Dialog from "./ui/Dialog";

type PromotionPiece =
  | "q"
  | "r"
  | "b"
  | "n";

type PromotionDialogProps = {
  color: "w" | "b";

  onSelect: (
    piece: PromotionPiece
  ) => void;

  onCancel: () => void;
};

const promotionPieces = [
  {
    type: "q",
    name: "Queen",
  },
  {
    type: "r",
    name: "Rook",
  },
  {
    type: "b",
    name: "Bishop",
  },
  {
    type: "n",
    name: "Knight",
  },
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
    color === "w"
      ? whiteSymbols
      : blackSymbols;

  return (
    <Dialog
      open={true}
      title="CHOOSE PROMOTION"
      description={
        "Select the piece your Pawn will become"
      }
      onClose={onCancel}
      dismissible={true}
    >
      <div className="promotion-options">
        {promotionPieces.map(
          (piece) => (
            <button
              key={piece.type}
              type="button"
              className="promotion-option"
              onClick={() =>
                onSelect(piece.type)
              }
              aria-label={
                `Promote to ${piece.name}`
              }
            >
              <span
                className="promotion-symbol"
                aria-hidden="true"
              >
                {symbols[piece.type]}
              </span>

              <span className="promotion-name">
                {piece.name}
              </span>
            </button>
          )
        )}
      </div>

      <button
        type="button"
        className="promotion-cancel"
        onClick={onCancel}
      >
        CANCEL
      </button>
    </Dialog>
  );
}

export default PromotionDialog;