const AnimatedRobot = () => {
  return (
    <div className="robot w-32 h-32 mx-auto">
      {/* Main body */}
      <div className="robot-body" />
      
      {/* Antenna */}
      <div className="robot-antenna" />
      
      {/* Eyes */}
      <div className="robot-eyes">
        <div className="robot-eye">
          <div className="robot-pupil" />
        </div>
        <div className="robot-eye">
          <div className="robot-pupil" />
        </div>
      </div>
      
      {/* Blush */}
      <div className="robot-blush left" />
      <div className="robot-blush right" />
    </div>
  );
};

export default AnimatedRobot;