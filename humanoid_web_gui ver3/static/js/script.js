// Ensure Socket.IO and ROSLib are loaded
if (typeof io === 'undefined') {
    console.error("Socket.IO is not loaded. Please include it via CDN or local file.");
}
if (typeof ROSLIB === 'undefined') {
    console.error("ROSLib is not loaded. Please include it via CDN or local file.");
}

// Initialize Socket.IO connection to Flask server
const socket = io.connect('http://localhost:5000'); // Adjust URL to your Flask server

// Initialize ROS connection
const ros = new ROSLIB.Ros({
    url: 'ws://localhost:9090' // Adjust to your ROS bridge WebSocket URL
});

// ROS connection status
ros.on('connection', () => {
    console.log('Connected to ROS bridge.');
    document.getElementById('actionStatus')?.textContent = 'Connected to ROS';
});
ros.on('error', (error) => {
    console.error('Error connecting to ROS bridge:', error);
    document.getElementById('actionStatus')?.textContent = 'ROS Connection Error';
});
ros.on('close', () => {
    console.log('Disconnected from ROS bridge.');
    document.getElementById('actionStatus')?.textContent = 'Disconnected from ROS';
});

// Subscribe to ROS topics
const robotStatusListener = new ROSLIB.Topic({
    ros: ros,
    name: '/robot_status',
    messageType: 'std_msgs/String'
});

robotStatusListener.subscribe((message) => {
    const statusData = JSON.parse(message.data);
    updateRobotStatus(statusData);
});

// Function to update robot status on dashboard
function updateRobotStatus(data) {
    if (document.querySelector('.text-green-400')) {
        document.querySelector('.text-green-400[data-type="battery"]').textContent = `${data.battery}%`;
        document.querySelector('.text-red-400[data-type="temperature"]').textContent = `${data.temperature}°C`;
    }
}

// Teleoperation controls
document.querySelectorAll('.bg-blue-500, .bg-green-500, .bg-gray-700')?.forEach(button => {
    button.addEventListener('click', (e) => {
        const action = e.target.textContent.includes('Forward') ? 'forward' :
                      e.target.textContent.includes('Backward') ? 'backward' :
                      e.target.textContent.includes('Right') ? 'right' :
                      e.target.textContent.includes('Left') ? 'left' : '';
        sendTeleopCommand(action);
    });
});

// Send teleoperation commands via ROS
function sendTeleopCommand(action) {
    const teleopCmd = new ROSLIB.Topic({
        ros: ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
    });

    const twist = new ROSLIB.Message({
        linear: { x: action === 'forward' ? 1.0 : action === 'backward' ? -1.0 : 0.0, y: 0.0, z: 0.0 },
        angular: { x: 0.0, y: 0.0, z: action === 'right' ? -1.0 : action === 'left' ? 1.0 : 0.0 }
    });

    teleopCmd.publish(twist);
    document.getElementById('actionStatus').textContent = `Action: ${action.charAt(0).toUpperCase() + action.slice(1)}`;
}

// AI Interaction - Chat functionality
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const responseLog = document.getElementById('response-log');

sendBtn?.addEventListener('click', sendMessage);
userInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        appendToChat(`You: ${message}`);
        socket.emit('chat_message', { message: message });
        userInput.value = '';
    }
}

socket.on('robot_response', (data) => {
    appendToChat(`🤖: ${data.response}`);
    responseLog.value += `${new Date().toLocaleTimeString()} - ${data.response}\n`;
});

function appendToChat(message) {
    const p = document.createElement('p');
    p.textContent = message;
    p.className = message.startsWith('You') ? 'text-yellow-400' : 'text-blue-300';
    chatBox.appendChild(p);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Voice Interaction (Speech Recognition)
if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    voiceBtn?.addEventListener('click', () => {
        recognition.start();
        voiceBtn.textContent = '🎤 Listening...';
        voiceBtn.classList.add('bg-red-500');
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        sendMessage();
    };

    recognition.onend = () => {
        voiceBtn.textContent = '🎤 Speak';
        voiceBtn.classList.remove('bg-red-500');
        voiceBtn.classList.add('bg-green-500');
    };
} else {
    voiceBtn?.setAttribute('disabled', 'true');
    voiceBtn?.textContent = '🎤 Not Supported';
}

// Sensor Data Updates via Socket.IO
socket.on('sensor_data', (data) => {
    updateSensorData(data);
});

function updateSensorData(data) {
    document.querySelector('.text-green-400[data-type="temperature"]').textContent = `${data.temperature}°C`;
    document.querySelector('.text-green-400[data-type="humidity"]').textContent = `${data.humidity}%`;
    document.querySelector('.text-yellow-400[data-type="battery"]').textContent = `${data.battery}%`;
    document.querySelector('.text-red-400[data-type="cpu"]').textContent = `${data.cpu}%`;
}

// System Logs via Socket.IO
socket.on('system_log', (data) => {
    const logContainer = document.getElementById('logContainer') || document.querySelector('.text-green-400');
    if (logContainer) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${data.message}`;
        logContainer.appendChild(p);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
});

// Emergency Stop
document.querySelector('.bg-red-600')?.addEventListener('click', () => {
    socket.emit('emergency_stop');
    const stopCmd = new ROSLIB.Topic({
        ros: ros,
        name: '/cmd_vel',
        messageType: 'geometry_msgs/Twist'
    });
    stopCmd.publish(new ROSLIB.Message({
        linear: { x: 0.0, y: 0.0, z: 0.0 },
        angular: { x: 0.0, y: 0.0, z: 0.0 }
    }));
    document.getElementById('actionStatus').textContent = 'Emergency Stop Activated';
});

// Speed Control
document.querySelector('input[type="range"]')?.addEventListener('change', (e) => {
    const speed = e.target.value;
    socket.emit('set_speed', { speed: speed });
});

// Mission Planner
document.querySelector('.bg-blue-500.mt-2')?.addEventListener('click', () => {
    const task = document.querySelector('input[placeholder="Enter Task"]').value;
    if (task) {
        socket.emit('add_task', { task: task });
    }
});

// Include this in your HTML files
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard script loaded.');
});