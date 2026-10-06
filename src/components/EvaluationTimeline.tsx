import type { EvaluationPoint } from "../lib/postGame/evaluationTimeline";
import { EVALUATION_GRAPH_LIMIT } from "../lib/postGame/evaluationTimeline";

type EvaluationTimelineProps = {
  points: EvaluationPoint[];
  selectedPly: number;
  onSelectedPlyChange: (ply: number) => void;
};

const WIDTH = 800;
const HEIGHT = 240;

const CENTER_Y = HEIGHT / 2;
//const PADDING_X = 0;

function getX(
  ply: number,
  finalPly: number
): number {
  if (finalPly <= 0) {
    return 0;
  }

  return (
    (ply / finalPly) * WIDTH
  );
}

function getSelectedPoint(
  points: EvaluationPoint[],
  selectedPly: number
): EvaluationPoint | null {
  return (
    points.find(
      (point) => point.ply === selectedPly
    ) ?? null
  );
}

function getY(evaluation: number): number {
  const normalized =
    evaluation / EVALUATION_GRAPH_LIMIT;

  return CENTER_Y - normalized * CENTER_Y;
}

function createLinePath(
  points: EvaluationPoint[]
): string {
  const finalPly =
  points[points.length - 1]?.ply ?? 0;

  let path = "";
  let drawing = false;

  for (const point of points) {
    if (point.graphEvaluation === null) {
      drawing = false;
      continue;
    }

    const x = getX(
      point.ply,
      finalPly
    );

    const y = getY(
      point.graphEvaluation
    );

    path += `${drawing ? " L" : " M"} ${x} ${y}`;

    drawing = true;
  }

  return path;
}

function createAreaPath(
  points: EvaluationPoint[]
): string {
  const validPoints = points.filter(
    (point) => point.graphEvaluation !== null
  );

  if (validPoints.length === 0) {
    return "";
  }

  const finalPly = points[points.length - 1]?.ply ?? 0;

  const firstPoint = validPoints[0];
  const lastPoint =
    validPoints[validPoints.length - 1];

  const firstX = getX(
    firstPoint.ply,
    finalPly
  );

  const lastX = getX(
    lastPoint.ply,
    finalPly
  );

  const graphPath = validPoints
    .map((point, index) => {
      const x = getX(
        point.ply,
        finalPly
      );

      const y = getY(
        point.graphEvaluation!
      );

      return `${
        index === 0 ? "L" : "L"
      } ${x} ${y}`;
    })
    .join(" ");

  return [
    `M ${firstX} ${CENTER_Y}`,
    graphPath,
    `L ${lastX} ${CENTER_Y}`,
    "Z",
  ].join(" ");
}

export default function EvaluationTimeline({
  points,
  selectedPly,
  onSelectedPlyChange,
}: EvaluationTimelineProps) {
  if (points.length === 0) {
    return null;
  }

  const finalPly = points[points.length - 1]?.ply ?? 0;
  const linePath = createLinePath(points);

  const selectedPoint = getSelectedPoint(
    points,
    selectedPly
  );

  const areaPath =
  createAreaPath(points);
  
  const selectedX = selectedPoint
    ? getX(selectedPoint.ply, finalPly)
    : null;
  
  const selectedY =
  selectedPoint?.graphEvaluation !== null &&
  selectedPoint?.graphEvaluation !== undefined
    ? getY(selectedPoint.graphEvaluation)
    : null;

  return (
    <div className="evaluation-timeline">
      <div className="evaluation-header">
        <span>White Advantage</span>

        <strong>
          {!selectedPoint ||
          selectedPoint.evaluation === null
            ? "N/A"
            : selectedPoint.isMate
              ? selectedPoint.mateIn !== null
                ? selectedPoint.mateIn > 0
                  ? `White M${Math.abs(
                      selectedPoint.mateIn
                    )}`
                  : `Black M${Math.abs(
                      selectedPoint.mateIn
                    )}`
                : "Mate"
              : selectedPoint.evaluation >= 0
                ? `+${selectedPoint.evaluation.toFixed(
                    2
                  )}`
                : selectedPoint.evaluation.toFixed(2)}
        </strong>

        <span>Black Advantage</span>
      </div>
      <div className="evaluation-chart">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Game evaluation graph"
        >
          <rect
            x={0}
            y={0}
            width={WIDTH}
            height={CENTER_Y}
            className="evaluation-white-region"
          />

          <rect
            x={0}
            y={CENTER_Y}
            width={WIDTH}
            height={CENTER_Y}
            className="evaluation-black-region"
          />
          <path
            d={areaPath}
            className="evaluation-area"
          />
          <path
            d={linePath}
            className="evaluation-line"
            fill="none"
          />
          {selectedX !== null &&
          selectedY !== null && (
            <circle
              cx={selectedX}
              cy={selectedY}
              r={7}
              className="evaluation-selected-point"
            />
          )}
        </svg>

        <input
          className="evaluation-slider"
          type="range"
          min={1}
          max={finalPly}
          step={1}
          value={selectedPly}
          onChange={(event) =>
            onSelectedPlyChange(
              Number(event.target.value)
            )
          }
          aria-label="Review move"
        />
      </div>

      <div className="evaluation-timeline-labels">
        <span>1</span>
        <span>{finalPly}</span>
      </div>
    </div>
  );
}