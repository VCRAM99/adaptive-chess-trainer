import {
    useEffect,
    useState,
  } from "react";
  
  import Dialog from "./ui/Dialog";
  
  import type {
    TrainingMode,
  } from "../lib/trainingDifficulty";
  
  type PlayerColor =
    | "white"
    | "black";
  
  export type NewGameSettings = {
    playerColor: PlayerColor;
    trainingMode: TrainingMode;
  };
  
  type NewGameDialogProps = {
    open: boolean;
  
    initialPlayerColor: PlayerColor;
    initialTrainingMode: TrainingMode;
  
    dismissible: boolean;
  
    onClose: () => void;
  
    onStartGame: (
      settings: NewGameSettings
    ) => void;
  };
  
  function NewGameDialog({
    open,
    initialPlayerColor,
    initialTrainingMode,
    dismissible,
    onClose,
    onStartGame,
  }: NewGameDialogProps) {
    const [
      selectedColor,
      setSelectedColor,
    ] = useState<PlayerColor>(
      initialPlayerColor
    );
  
    const [
      selectedMode,
      setSelectedMode,
    ] = useState<TrainingMode>(
      initialTrainingMode
    );
  
    useEffect(() => {
      if (!open) {
        return;
      }
  
      setSelectedColor(
        initialPlayerColor
      );
  
      setSelectedMode(
        initialTrainingMode
      );
    }, [
      open,
      initialPlayerColor,
      initialTrainingMode,
    ]);
  
    function handleStartGame() {
      onStartGame({
        playerColor: selectedColor,
        trainingMode: selectedMode,
      });
    }
  
    return (
      <Dialog
        open={open}
        title="NEW GAME"
        description="CHOOSE YOUR SIDE AND TRAINING MODE."
        dismissible={dismissible}
        onClose={
          dismissible
            ? onClose
            : undefined
        }
      >
        <section className="new-game-section">
          <h3 className="ui-label">
            Play As
          </h3>
  
          <div className="side-selector">
            <button
              type="button"
              className={
                selectedColor === "white"
                  ? "side-option side-option--selected"
                  : "side-option"
              }
              onClick={() =>
                setSelectedColor("white")
              }
              aria-pressed={
                selectedColor === "white"
              }
            >
              <span
                className="side-option__piece"
                aria-hidden="true"
              >
                ♔
              </span>
  
              <span>White</span>
            </button>
  
            <button
              type="button"
              className={
                selectedColor === "black"
                  ? "side-option side-option--selected"
                  : "side-option"
              }
              onClick={() =>
                setSelectedColor("black")
              }
              aria-pressed={
                selectedColor === "black"
              }
            >
              <span
                className="side-option__piece"
                aria-hidden="true"
              >
                ♚
              </span>
  
              <span>Black</span>
            </button>
          </div>
        </section>
  
        <section className="new-game-section">
          <h3 className="ui-label">
            Training Mode
          </h3>
  
          <div className="mode-selector">
            <ModeOption
              mode="easy"
              selectedMode={selectedMode}
              onSelect={setSelectedMode}
            />
  
            <ModeOption
              mode="medium"
              selectedMode={selectedMode}
              onSelect={setSelectedMode}
            />
  
            <ModeOption
              mode="hard"
              selectedMode={selectedMode}
              onSelect={setSelectedMode}
            />
          </div>
        </section>
  
        <button
          type="button"
          className="new-game-start"
          onClick={handleStartGame}
        >
          Start Game
        </button>
      </Dialog>
    );
  }
  
  type ModeOptionProps = {
    mode: TrainingMode;
    selectedMode: TrainingMode;
  
    onSelect: (
      mode: TrainingMode
    ) => void;
  };
  
  function ModeOption({
    mode,
    selectedMode,
    onSelect,
  }: ModeOptionProps) {
    const isSelected =
      selectedMode === mode;
  
    const details = {
      easy: {
        label: "Casual",
        description: "BELOW YOUR LEVEL",
        piece: "♟",
      },
  
      medium: {
        label: "Echo",
        description: "MIRRORS YOUR LEVEL",
        piece: "♝",
      },
  
      hard: {
        label: "Train",
        description: "ABOVE YOUR LEVEL",
        piece: "♛",
      },
    }[mode];
  
    return (
      <button
        type="button"
        className={
          `mode-option ` +
          `mode-option--${mode}` +
          (
            isSelected
              ? " mode-option--selected"
              : ""
          )
        }
        onClick={() =>
          onSelect(mode)
        }
        aria-pressed={isSelected}
        aria-label={
          `${details.label}: ` +
          details.description.toLowerCase()
        }
      >
        <span
          className="mode-option__piece"
          aria-hidden="true"
        >
          {details.piece}
        </span>
  
        <span className="mode-option__label">
          {details.label}
        </span>
  
        <span
          className="mode-option__description"
          aria-hidden="true"
        >
          {details.description}
        </span>
      </button>
    );
  }
  
  export default NewGameDialog;