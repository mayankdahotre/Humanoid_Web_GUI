const socket = new WebSocket("ws://localhost:8765");  // Change to your server's WebSocket URL

socket.onopen = () => {
    console.log("✅ Connected to WebSocket Server");
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "status") {
        updateRobotStatus(data.payload);
    } else if (data.type === "camera") {
        updateCameraFeed(data.url);
    } else if (data.type === "log") {
        addLogEntry(data.message);
    }
};

socket.onerror = (error) => {
    console.error("❌ WebSocket Error:", error);
};

socket.onclose = () => {
    console.warn("⚠️ WebSocket Connection Closed");
};

// 📌 Send motor command
function sendMotorCommand(motorId, value) {
    const command = {
        type: "motor",
        motor_id: motorId,
        value: value
    };
    socket.send(JSON.stringify(command));
    console.log(`📤 Sent Motor Command: ${motorId} -> ${value}`);
}

// 📌 Send emergency stop command
function sendEmergencyStop() {
    const command = { type: "emergency_stop" };
    socket.send(JSON.stringify(command));
    console.warn("🚨 Emergency Stop Activated!");
}

// 📌 Set speed control
function setSpeed(speed) {
    const command = { type: "speed", value: speed };
    socket.send(JSON.stringify(command));
    console.log(`⚡ Speed set to ${speed}`);
}

// 📌 Update robot status
function updateRobotStatus(status) {
    document.getElementById("battery-level").innerText = `${status.battery}%`;
    document.getElementById("temperature").innerText = `${status.temperature}°C`;
    console.log("📊 Updated Robot Status:", status);
}

// 📌 Update live camera feed
function updateCameraFeed(url) {
    document.getElementById("camera-feed").src = url;
}

// 📌 Add log entry to the system logs
function addLogEntry(message) {
    const logContainer = document.getElementById("logContainer");
    const entry = document.createElement("p");
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

// 📌 Event Listeners for Sliders (14 Motors)
document.querySelectorAll(".motor-slider").forEach(slider => {
    slider.addEventListener("input", (event) => {
        const motorId = event.target.dataset.motor;
        const value = event.target.value;
        sendMotorCommand(motorId, value);
    });
});

// 📌 Emergency Stop Button
document.getElementById("emergency-stop-btn").addEventListener("click", sendEmergencyStop);

// 📌 Speed Control
document.getElementById("speed-control").addEventListener("input", (event) => {
    setSpeed(event.target.value);
});
