import rospy
from std_msgs.msg import Float64
from std_srvs.srv import Empty

# Initialize ROS node
rospy.init_node('humanoid_control', anonymous=True)

# Define publishers for 14 motors (7 for left arm, 7 for right arm)
motor_publishers = {
    'left_shoulder_pitch': rospy.Publisher('/robot/left_shoulder_pitch/command', Float64, queue_size=10),
    'left_shoulder_roll': rospy.Publisher('/robot/left_shoulder_roll/command', Float64, queue_size=10),
    'left_shoulder_yaw': rospy.Publisher('/robot/left_shoulder_yaw/command', Float64, queue_size=10),
    'left_elbow_pitch': rospy.Publisher('/robot/left_elbow_pitch/command', Float64, queue_size=10),
    'left_wrist_pitch': rospy.Publisher('/robot/left_wrist_pitch/command', Float64, queue_size=10),
    'left_wrist_roll': rospy.Publisher('/robot/left_wrist_roll/command', Float64, queue_size=10),
    'left_hand': rospy.Publisher('/robot/left_hand/command', Float64, queue_size=10),

    'right_shoulder_pitch': rospy.Publisher('/robot/right_shoulder_pitch/command', Float64, queue_size=10),
    'right_shoulder_roll': rospy.Publisher('/robot/right_shoulder_roll/command', Float64, queue_size=10),
    'right_shoulder_yaw': rospy.Publisher('/robot/right_shoulder_yaw/command', Float64, queue_size=10),
    'right_elbow_pitch': rospy.Publisher('/robot/right_elbow_pitch/command', Float64, queue_size=10),
    'right_wrist_pitch': rospy.Publisher('/robot/right_wrist_pitch/command', Float64, queue_size=10),
    'right_wrist_roll': rospy.Publisher('/robot/right_wrist_roll/command', Float64, queue_size=10),
    'right_hand': rospy.Publisher('/robot/right_hand/command', Float64, queue_size=10),
}

# Emergency stop service
rospy.wait_for_service('/emergency_stop')
emergency_stop_srv = rospy.ServiceProxy('/emergency_stop', Empty)

def move_motor(motor_id, value):
    """
    Move a specific motor to a given position.
    :param motor_id: Motor name (e.g., 'left_shoulder_pitch')
    :param value: Position value (e.g., 0 to 1000 mapped to -1 to 1)
    """
    if motor_id in motor_publishers:
        mapped_value = (value / 1000.0) * 2 - 1  # Convert 0-1000 scale to -1 to 1
        motor_publishers[motor_id].publish(mapped_value)
        print(f"Moved {motor_id} to {mapped_value}")
    else:
        print(f"Invalid motor ID: {motor_id}")

def stop_all_motors():
    """
    Activate emergency stop to stop all motors.
    """
    emergency_stop_srv()
    print("Emergency Stop Activated!")

def set_speed(speed):
    """
    Set global speed for the robot.
    :param speed: Speed value (e.g., 0 to 100)
    """
    rospy.set_param('/robot_speed', speed)
    print(f"Robot speed set to {speed}")

if __name__ == '__main__':
    rospy.spin()  # Keep the node running
