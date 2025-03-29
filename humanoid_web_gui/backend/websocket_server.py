import asyncio
import websockets
import json
import control

connected_clients = set()

async def handle_connection(websocket, path):
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            data = json.loads(message)
            if data["type"] == "motor_command":
                control.move_motor(data["motor_id"], data["value"])
                await websocket.send(json.dumps({"status": "ok", "motor": data["motor_id"], "value": data["value"]}))
            elif data["type"] == "emergency_stop":
                control.stop_all_motors()
                await websocket.send(json.dumps({"status": "Emergency Stop Activated"}))
            elif data["type"] == "speed_control":
                control.set_speed(data["speed"])
                await websocket.send(json.dumps({"status": "Speed set", "speed": data["speed"]}))
    finally:
        connected_clients.remove(websocket)

start_server = websockets.serve(handle_connection, "0.0.0.0", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
