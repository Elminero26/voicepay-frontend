import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8082/ws'),
    onConnect: () => {
        console.log('Connected to broker');
        // Publish Step 1
        client.publish({
            destination: '/topic/live-calls',
            body: JSON.stringify([{
                id: "test-call-100",
                userName: "Carlos Prueba",
                phoneNumber: "+34 600 000 000",
                status: "CONNECTED",
                timestamp: new Date().toISOString()
            }])
        });
        console.log('Published PASO 1: In Progress');
        
        // Wait 4 seconds, Publish Step 2
        setTimeout(() => {
            client.publish({
                destination: '/topic/live-calls',
                body: JSON.stringify([{
                    id: "test-call-100",
                    userName: "Carlos Prueba",
                    phoneNumber: "+34 600 000 000",
                    status: "COMPLETED",
                    timestamp: new Date().toISOString()
                }])
            });
            console.log('Published PASO 2: Completed');
            
            setTimeout(() => {
                client.deactivate();
                process.exit(0);
            }, 1000);
        }, 4000);
    },
    onWebSocketError: (error) => {
        console.error('WS error:', error);
    },
    onStompError: (frame) => {
        console.error('Broker error:', frame.headers['message']);
    }
});

client.activate();
