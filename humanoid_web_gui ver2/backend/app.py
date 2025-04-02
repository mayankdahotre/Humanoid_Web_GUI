from flask import Flask, render_template, Response
from flask_socketio import SocketIO
import threading
import control
import camera_stream

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# Routes for frontend pages
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/teleoperation')
def teleoperation():
    return render_template('teleoperation.html')

@app.route('/live_camera')
def live_camera():
    return render_template('live_camera.html')

@app.route('/ai_interaction')
def ai_interaction():
    return render_template('ai_interaction.html')

@app.route('/sensors')
def sensors():
    return render_template('sensors.html')

@app.route('/logs')
def logs():
    return render_template('logs.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

# Streaming video from robot camera
@app.route('/video_feed')
def video_feed():
    return Response(camera_stream.generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# WebSocket event for motor control
@socketio.on('motor_command')
def handle_motor_command(data):
    motor_id = data.get('motor_id')
    value = data.get('value')
    control.move_motor(motor_id, value)
    socketio.emit('feedback', {'motor_id': motor_id, 'value': value})  # Send live feedback

# WebSocket event for emergency stop
@socketio.on('emergency_stop')
def handle_emergency_stop():
    control.stop_all_motors()
    socketio.emit('feedback', {'status': 'Emergency Stop Activated'})

# WebSocket event for speed control
@socketio.on('speed_control')
def handle_speed_control(data):
    speed = data.get('speed')
    control.set_speed(speed)
    socketio.emit('feedback', {'speed': speed})

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
