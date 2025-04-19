import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { Box, Container, Paper, Slider, Typography } from '@mui/material';
import RobotModel from './components/RobotModel';
import ControlPanel from './components/ControlPanel';

function App() {
  const [jointAngles, setJointAngles] = useState({
    head: 0,
    leftShoulder: 0,
    rightShoulder: 0,
    leftElbow: 0,
    rightElbow: 0,
    leftHip: 0,
    rightHip: 0,
    leftKnee: 0,
    rightKnee: 0
  });

  const handleJointChange = (joint, value) => {
    setJointAngles(prev => ({
      ...prev,
      [joint]: value
    }));
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      <Box sx={{ flex: 1 }}>
        <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <RobotModel jointAngles={jointAngles} />
          <Grid args={[10, 10]} />
          <Environment preset="city" />
          <OrbitControls />
        </Canvas>
      </Box>
      <Paper sx={{ width: 300, p: 2, overflow: 'auto' }}>
        <ControlPanel jointAngles={jointAngles} onJointChange={handleJointChange} />
      </Paper>
    </Box>
  );
}

export default App; 