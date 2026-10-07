import type {
    TrendPoint,
  } from "../../lib/profile/trends";
  
  type TrendChartProps = {
    points: TrendPoint[];
    valueSuffix?: string;
    lowerIsBetter?: boolean;
  };
  
  const CHART_WIDTH = 800;
  const CHART_HEIGHT = 320;
  
  const PADDING = {
    top: 24,
    right: 24,
    bottom: 48,
    left: 64,
  };
  
  const Y_TICK_COUNT = 5;
  
  function TrendChart({
    points,
    valueSuffix = "",
    lowerIsBetter = false,
  }: TrendChartProps) {
    if (points.length === 0) {
      return (
        <div className="trend-chart-empty">
          No data available for the selected games.
        </div>
      );
    }
  
    const values = points.map(
      (point) => point.value
    );
  
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
  
    /*
     * Give the graph some vertical breathing room.
     *
     * If every value is identical, we still need
     * a usable range for the Y axis.
     */
    const rawRange = rawMax - rawMin;
  
    const padding =
      rawRange === 0
        ? Math.max(
            Math.abs(rawMax) * 0.1,
            5
          )
        : rawRange * 0.15;
  
    const minValue = Math.max(
      0,
      rawMin - padding
    );
  
    const maxValue =
      rawMax + padding;
  
    const valueRange =
      maxValue - minValue || 1;
  
    const graphWidth =
      CHART_WIDTH -
      PADDING.left -
      PADDING.right;
  
    const graphHeight =
      CHART_HEIGHT -
      PADDING.top -
      PADDING.bottom;
  
    function getX(index: number): number {
      if (points.length === 1) {
        return (
          PADDING.left +
          graphWidth / 2
        );
      }
  
      return (
        PADDING.left +
        (index /
          (points.length - 1)) *
          graphWidth
      );
    }
  
    function getY(value: number): number {
      const normalized =
        (value - minValue) /
        valueRange;
  
      return (
        PADDING.top +
        graphHeight -
        normalized * graphHeight
      );
    }
  
    const polylinePoints =
      points
        .map(
          (point, index) =>
            `${getX(index)},${getY(
              point.value
            )}`
        )
        .join(" ");
  
    const yTicks =
      Array.from(
        {
          length: Y_TICK_COUNT,
        },
        (_, index) => {
          const ratio =
            index /
            (Y_TICK_COUNT - 1);
  
          const value =
            maxValue -
            ratio * valueRange;
  
          const y =
            PADDING.top +
            ratio * graphHeight;
  
          return {
            value,
            y,
          };
        }
      );
  
    return (
      <div className="trend-chart-wrapper">
        <svg
          className="trend-chart"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label={`Player progress trend across ${points.length} games`}
        >
          {yTicks.map(
            (tick, index) => (
              <g key={index}>
                <line
                  className="trend-chart-grid-line"
                  x1={PADDING.left}
                  x2={
                    CHART_WIDTH -
                    PADDING.right
                  }
                  y1={tick.y}
                  y2={tick.y}
                />
  
                <text
                  className="trend-chart-y-label"
                  x={
                    PADDING.left - 12
                  }
                  y={tick.y}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {tick.value.toFixed(
                    valueSuffix === "%"
                      ? 0
                      : 0
                  )}
                  {valueSuffix}
                </text>
              </g>
            )
          )}
  
          {points.length > 1 && (
            <polyline
              className="trend-chart-line"
              points={polylinePoints}
              fill="none"
            />
          )}
  
          {points.map(
            (point, index) => {
              const x = getX(index);
              const y = getY(
                point.value
              );
  
              return (
                <g
                  key={point.gameId}
                  className="trend-chart-point"
                >
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                  >
                    <title>
                      {`Game ${
                        point.gameNumber
                      }: ${
                        point.value
                      }${valueSuffix}`}
                    </title>
                  </circle>
                </g>
              );
            }
          )}
  
          <text
            className="trend-chart-x-label"
            x={PADDING.left}
            y={
              CHART_HEIGHT -
              PADDING.bottom +
              28
            }
            textAnchor="middle"
          >
            1
          </text>
  
          {points.length > 1 && (
            <text
              className="trend-chart-x-label"
              x={
                CHART_WIDTH -
                PADDING.right
              }
              y={
                CHART_HEIGHT -
                PADDING.bottom +
                28
              }
              textAnchor="middle"
            >
              {points.length}
            </text>
          )}
        </svg>
  
        <div className="trend-chart-footer">
          <span>
            Game progression
          </span>
  
          {lowerIsBetter && (
            <span>
              Lower is better
            </span>
          )}
        </div>
      </div>
    );
  }
  
  export default TrendChart;