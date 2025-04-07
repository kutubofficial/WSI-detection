import { useState, useMemo } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useGesture } from "@use-gesture/react";
import outputData from "./output.json";
import wsiImage from "./assets/wsi-sample.png";

const App = () => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState([0, 0]);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [imgDimensions, setImgDimensions] = useState({
    naturalWidth: 1,
    naturalHeight: 1,
  });

  const bind = useGesture({
    onDrag: ({ offset: [x, y] }) => setPosition([x, y]),
    onWheel: ({ delta: [, deltaY] }) => {
      setZoom((prev) =>
        Math.min(Math.max(0.5, prev + (deltaY > 0 ? -0.1 : 0.1)), 3)
      );
    },
    onPinch: ({ offset: [d] }) => {
      setZoom(d / 100);
    },
  });

  const detectionResults = useMemo(() => {
    try {
      const fixedJson = outputData.inference_results
        .replace(/'/g, '"')
        .replace(/None/g, "null");
      const parsed = JSON.parse(fixedJson);
      return parsed.output.detection_results || [];
    } catch (error) {
      console.error("Error parsing inference results:", error);
      return [];
    }
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - position[0]) / zoom;
    const y = (e.clientY - rect.top - position[1]) / zoom;
    setHoverPosition({ x, y });
  };

  const hubViewStyle = useMemo(() => {
    if (!isHovering) return { display: "none" };
    const hubWidth = 400;
    const hubHeight = 200;
    const scaleX = hubWidth / imgDimensions.naturalWidth;
    const scaleY = hubHeight / imgDimensions.naturalHeight;
    return {
      left: `${hoverPosition.x * scaleX}px`,
      top: `${hoverPosition.y * scaleY}px`,
      width: `${50 * scaleX}px`,
      height: `${50 * scaleY}px`,
    };
  }, [hoverPosition, isHovering, imgDimensions]);

  const { transform } = useSpring({
    transform: `translate(${position[0]}px, ${position[1]}px) scale(${zoom})`,
  });

  const patientData = {
    //this is a static data, we can use actual data also....
    rbc: [
      { type: "Angist Cells", count: 222, percentage: "67%" },
      { type: "Borderline Ondroyser", count: 50, percentage: "20%" },
      { type: "Burr Cells", count: 87, percentage: "34%" },
      { type: "Fragmented Cells", count: 2, percentage: "0.12%" },
    ],
    wbc: [
      { type: "Basophil", count: 222, percentage: "67%" },
      { type: "Eosinophil", count: 50, percentage: "20%" },
      { type: "Lymphocyte", count: 87, percentage: "34%" },
      { type: "Monocyte", count: 2, percentage: "0.12%" },
    ],
    platelets: { count: 222, percentage: "222" },
  };

  return (
    <div className="app-container">
      {/* <h2>Patient ID: {outputData.patient_id}</h2> */}
      <div className="left-panel">
        <h3 className="date">Date: {outputData.date}</h3>
        <hr />
        <h2>Patient ID: {outputData.patient_id}</h2>
        <h3>RBC Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {patientData?.rbc?.map((row, i) => (
              <tr key={`rbc-${i}`}>
                <td>{row.type}</td>
                <td>{row.count}</td>
                <td>{row.percentage}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>WBC Analysis</h3>
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {patientData?.wbc?.map((row, i) => (
              <tr key={`wbc-${i}`}>
                <td>{row.type}</td>
                <td>{row.count}</td>
                <td>{row.percentage}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Platelets</h3>
        <div className="platelets-data">
          <p>Count: {patientData.platelets.count}</p>
          <p>Percentage: {patientData.platelets.percentage}%</p>
        </div>
      </div>

      <div
        className="main-viewer"
        {...bind()}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <animated.div className="image-container" style={{ transform }}>
          <div
            className={`zoom-overlay ${isHovering ? "visible" : ""}`}
            style={{
              transform: `translate(${hoverPosition.x * zoom}px, ${
                hoverPosition.y * zoom
              }px) scale(${2 / zoom})`,
              left: -50,
              top: -50,
            }}
          >
            <img
              src={wsiImage}
              alt="Zoom"
              style={{
                transform: `translate(-${hoverPosition.x * zoom}px, -${
                  hoverPosition.y * zoom
                }px)`,
              }}
            />
          </div>
          {/* <img src={wsiImage} alt="Whole Slide Image" className="wsi-image" /> */}
          <img
            src={wsiImage}
            alt="Whole Slide Image"
            className="wsi-image"
            onLoad={(e) => {
              setImgDimensions({
                naturalWidth: e.target.naturalWidth,
                naturalHeight: e.target.naturalHeight,
              });
            }}
          />
          {detectionResults?.map((box, index) => (
            <div
              key={`box-${index}`}
              className="bounding-box"
              style={{
                left: `${box[0] / scaleX}px`,
                top: `${box[1] / scaleY}px`,
                width: `${(box[2] - box[0]) / scaleX}px`,
                height: `${(box[3] - box[1]) / scaleY}px`,
              }}
            />
          ))}
        </animated.div>
      </div>

      <div className="hub-view">
        <div className="hub-container">
          <img src={wsiImage} alt="Hub View" className="hub-image" />
          <div className="viewport-indicator" style={hubViewStyle} />
        </div>
      </div>
    </div>
  );
};

export default App;
