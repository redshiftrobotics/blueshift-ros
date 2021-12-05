import { browser } from '$app/env';
import { readable } from 'svelte/store';
import type { Readable } from 'svelte/store';

// Only get the robot ip (which is equivalent to the website hostname) if this is running on the client (not if its being pre-rendered on the server)
export let robotIP: string;
if (browser) {
    robotIP = window.location.hostname;
}
export const websocketPort = "9090";

// This tells typescript that the window object can have a property called ROSLIB
declare global {
    interface Window { ROSLIB: any; }
}

/**
 * This private function is used to set the state of the `ROSConnected` store
 * @param state _true_: connected, _false_: not connected
 */
let setROSConnected = (state: Boolean) => null;

/**
 * This svelte readable store keeps track of whether we are connected to ROS or not. It is updated automatically
 */
export const ROSConnected: Readable<Boolean> = readable(false, function start(set) {
	setROSConnected = set;

	return function stop() {};
});


export let ROSLIB: any;

/**
 * Sets up communication with ROS (the robot's ip and default port of 9090 are used for the websocket communication)
 * @param onconnection callback on connection to ros websocket server
 * @param onerror callback if connection with ros websocket server faile
 * @param onclose callback on disconnection from ros websocket server
 * @returns ROSLIB.Ros object for communicating with ROS
 */
export async function connectToROS(onconnection = (): void => { }, onerror = (error): void => { }, onclose = (): void => { }) {
    if (browser) {
        // roslib creates a global variable called `ROSLIB`
        await import('roslib/build/roslib');

        // typescript doesn't know this variable exists, tricks it into thinking it does
        window.ROSLIB = window.ROSLIB || {};

        // This exports the ROSLIB variable so it can be used in other files
        ROSLIB = window.ROSLIB;

        // Setup the connection with ROS
        const ros = new window.ROSLIB.Ros({
            url: `ws://${robotIP}:${websocketPort}`
        });

        // Register Event handlers
        ros.on('connection', function () {
            setROSConnected(true)
            onconnection();
        });

        ros.on('error', function (error) {
            setROSConnected(false)
            onerror(error);
        });

        ros.on('close', function () {
            setROSConnected(false)
            onclose();
        });
        
        return ros
    }
}