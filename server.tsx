// @ts-nocheck
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(cors());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'rfid',
    port: process.env.DB_PORT || 3306
};

const db = mysql.createConnection(dbConfig);
const dbPromise = db.promise();

const normalizeUID = (uid) => {
    if (typeof uid === 'string') {
        return uid.replace(/[:\\s-]/g, '').toUpperCase();
    } else if (Array.isArray(uid)) {
        return uid.map(byte => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
    return String(uid).toUpperCase();
};

const calculateCurrentCount = async (roomId) => {
    try {
        const [lastActions] = await dbPromise.execute(`
            SELECT employee_uid, action,
                   ROW_NUMBER() OVER (PARTITION BY employee_uid ORDER BY timestamp DESC) as rn
            FROM room_logs WHERE room_id = ?
        `, [roomId]);

        return lastActions.filter(log => log.rn === 1 && log.action === 'enter').length;
    } catch (error) {
        console.error('Error calculating room count:', error);
        return 0;
    }
};

const updateRoomCount = async (roomId) => {
    try {
        const currentCount = await calculateCurrentCount(roomId);
        await dbPromise.execute('UPDATE rooms SET current_count = ? WHERE id = ?', [currentCount, roomId]);
    } catch (error) {
        console.error('Error updating room count:', error);
    }
};

const checkRoomCapacity = async (roomId, employeeUid) => {
    try {
        const [employeeInRoom] = await dbPromise.execute(`
            SELECT COUNT(*) as is_in_room
            FROM (
                SELECT employee_uid, action,
                       ROW_NUMBER() OVER (PARTITION BY employee_uid ORDER BY timestamp DESC) as rn
                FROM room_logs WHERE room_id = ? AND employee_uid = ?
            ) as latest WHERE rn = 1 AND action = 'enter'
        `, [roomId, employeeUid]);

        const isExit = employeeInRoom[0].is_in_room > 0;
        
        if (isExit) return { canEnter: true, reason: 'Exit allowed', isExit: true };
        
        const [rooms] = await dbPromise.execute('SELECT * FROM rooms WHERE id = ?', [roomId]);
        if (rooms.length === 0) return { canEnter: false, reason: 'Room not found' };
        
        return { canEnter: true, reason: 'Entry allowed', isExit: false };
        
    } catch (error) {
        console.error('Capacity check error:', error);
        return { canEnter: true, reason: 'Capacity check unavailable', isExit: false };
    }
};

const updateDailyAttendance = async (employeeUid, roomId, action, timestamp) => {
    try {
        const today = new Date(timestamp).toISOString().split('T')[0];
        
        const [existingAttendance] = await dbPromise.execute(
            'SELECT * FROM daily_attendance WHERE employee_uid = ? AND date = ?',
            [employeeUid, today]
        );
        
        if (existingAttendance.length === 0) {
            if (action === 'enter') {
                await dbPromise.execute(
                    `INSERT INTO daily_attendance 
                    (employee_uid, date, first_enter_time, first_enter_room_id, 
                     last_exit_time, last_exit_room_id, total_rooms_visited, 
                     total_entries, total_exits, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, NULL, NULL, 1, 1, 0, NOW(), NOW())`,
                    [employeeUid, today, timestamp, roomId]
                );
            }
        } else {
            const attendance = existingAttendance[0];
            let updateFields = [];
            let updateValues = [];
            
            if (action === 'enter') {
                if (!attendance.first_enter_time) {
                    updateFields.push('first_enter_time = ?', 'first_enter_room_id = ?');
                    updateValues.push(timestamp, roomId);
                }
                
                const [roomVisits] = await dbPromise.execute(
                    `SELECT COUNT(DISTINCT room_id) as unique_rooms 
                     FROM room_logs 
                     WHERE employee_uid = ? 
                     AND DATE(timestamp) = ? 
                     AND action = 'enter'`,
                    [employeeUid, today]
                );
                
                updateFields.push('total_rooms_visited = ?');
                updateValues.push(roomVisits[0].unique_rooms);
                
                updateFields.push('total_entries = total_entries + 1');
            } else if (action === 'exit') {
                updateFields.push('last_exit_time = ?', 'last_exit_room_id = ?');
                updateValues.push(timestamp, roomId);
                
                updateFields.push('total_exits = total_exits + 1');
            }
            
            updateFields.push('updated_at = NOW()');
            
            if (updateFields.length > 0) {
                updateValues.push(employeeUid, today);
                
                const query = `
                    UPDATE daily_attendance 
                    SET ${updateFields.join(', ')} 
                    WHERE employee_uid = ? AND date = ?
                `;
                
                await dbPromise.execute(query, updateValues);
            }
        }
    } catch (error) {
        console.error('Error updating daily attendance:', error);
    }
};

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    const sendRoomsUpdate = async () => {
        try {
            const [rooms] = await dbPromise.execute('SELECT * FROM rooms ORDER BY name');
            const roomsWithCount = await Promise.all(rooms.map(async (room) => ({
                ...room,
                current_count: await calculateCurrentCount(room.id)
            })));
            socket.emit('rooms-update', roomsWithCount);
        } catch (error) {
            console.error('WebSocket rooms update error:', error);
        }
    };
    
    const sendActivityUpdate = async () => {
        try {
            const [activities] = await dbPromise.execute(`
                SELECT rl.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, 
                    e.uid as employee_uid, r.name as room_name
                FROM room_logs rl
                JOIN employees e ON rl.employee_uid = e.uid
                JOIN rooms r ON rl.room_id = r.id
                ORDER BY rl.timestamp DESC LIMIT 50
            `);
            socket.emit('activity-update', activities);
        } catch (error) {
            console.error('WebSocket activity update error:', error);
        }
    };
    
    sendRoomsUpdate();
    sendActivityUpdate();
    
    socket.on('subscribe-room', (roomId) => {
        console.log(`Client ${socket.id} subscribed to room ${roomId}`);
        const sendRoomUpdate = async () => {
            try {
                const [rooms] = await dbPromise.execute('SELECT * FROM rooms WHERE id = ?', [roomId]);
                if (rooms.length > 0) {
                    const room = rooms[0];
                    const currentCount = await calculateCurrentCount(room.id);
                    const [employeesInRoom] = await dbPromise.execute(`
                        SELECT e.id as employee_id, CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                            e.uid as employee_uid, MAX(rl.timestamp) as entered_at
                        FROM room_logs rl
                        JOIN employees e ON rl.employee_uid = e.uid
                        WHERE rl.room_id = ?
                        GROUP BY e.id, e.uid, e.first_name, e.last_name
                        HAVING COUNT(CASE WHEN rl.action = 'enter' THEN 1 END) > 
                            COUNT(CASE WHEN rl.action = 'exit' THEN 1 END)
                        ORDER BY entered_at DESC
                    `, [roomId]);
                    
                    socket.emit('room-detail-update', {
                        room: { ...room, current_count: currentCount },
                        employees: employeesInRoom,
                        timestamp: new Date()
                    });
                }
            } catch (error) {
                console.error('WebSocket room detail update error:', error);
            }
        };
        
        sendRoomUpdate();
        socket.join(`room-${roomId}`);
    });
    
    socket.on('unsubscribe-room', (roomId) => {
        console.log(`Client ${socket.id} unsubscribed from room ${roomId}`);
        socket.leave(`room-${roomId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const broadcastRoomsUpdate = async () => {
    try {
        const [rooms] = await dbPromise.execute('SELECT * FROM rooms ORDER BY name');
        const roomsWithCount = await Promise.all(rooms.map(async (room) => ({
            ...room,
            current_count: await calculateCurrentCount(room.id)
        })));
        io.emit('rooms-update', roomsWithCount);
    } catch (error) {
        console.error('Broadcast rooms update error:', error);
    }
};

const broadcastActivityUpdate = async () => {
    try {
        const [activities] = await dbPromise.execute(`
            SELECT rl.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, 
                e.uid as employee_uid, r.name as room_name
            FROM room_logs rl
            JOIN employees e ON rl.employee_uid = e.uid
            JOIN rooms r ON rl.room_id = r.id
            ORDER BY rl.timestamp DESC LIMIT 50
        `);
        io.emit('activity-update', activities);
    } catch (error) {
        console.error('Broadcast activity update error:', error);
    }
};

app.get('/rooms', async (req, res) => {
    try {
        const [rooms] = await dbPromise.execute('SELECT * FROM rooms ORDER BY name');
        const roomsWithCount = await Promise.all(rooms.map(async (room) => ({
            ...room,
            current_count: await calculateCurrentCount(room.id)
        })));
        res.json({ rooms: roomsWithCount });
    } catch (error) {
        console.error('Rooms fetch error:', error);
        res.status(500).json({ error: 'Failed to get rooms' });
    }
});

app.get('/rooms/:roomId/status', async (req, res) => {
    try {
        const [rooms] = await dbPromise.execute('SELECT * FROM rooms WHERE id = ?', [req.params.roomId]);
        if (rooms.length === 0) return res.status(404).json({ error: 'Room not found' });

        const room = rooms[0];
        const currentCount = await calculateCurrentCount(room.id);
        
        res.json({
            room: { ...room, current_count: currentCount }
        });
    } catch (error) {
        console.error('Room status error:', error);
        res.status(500).json({ error: 'Failed to get room status' });
    }
});

app.get('/rooms/:roomId/employees', async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const [employeesInRoom] = await dbPromise.execute(`
            SELECT e.id as employee_id, CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                   e.uid as employee_uid, MAX(rl.timestamp) as entered_at
            FROM room_logs rl
            JOIN employees e ON rl.employee_uid = e.uid
            WHERE rl.room_id = ?
            GROUP BY e.id, e.uid, e.first_name, e.last_name
            HAVING COUNT(CASE WHEN rl.action = 'enter' THEN 1 END) > 
                   COUNT(CASE WHEN rl.action = 'exit' THEN 1 END)
            ORDER BY entered_at DESC
        `, [roomId]);

        res.json({ employees: employeesInRoom });
    } catch (error) {
        console.error('Employees in room fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch employees in room' });
    }
});

app.get('/rooms/:roomId/activity', async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const [activities] = await dbPromise.execute(`
            SELECT rl.*, 
                   CONCAT(e.first_name, ' ', e.last_name) as employee_name, 
                   e.uid as employee_uid, 
                   r.name as room_name,
                   r.id as room_id
            FROM room_logs rl
            JOIN employees e ON rl.employee_uid = e.uid
            JOIN rooms r ON rl.room_id = r.id
            WHERE rl.room_id = ?
            ORDER BY rl.timestamp DESC
            LIMIT 50
        `, [roomId]);
        
        res.json({ activities });
    } catch (error) {
        console.error('Room activity fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch room activity' });
    }
});

app.post('/room/tap', async (req, res) => {
    const { uid, room_id = 1 } = req.body;
    if (!uid) return res.status(400).json({ error: 'UID is required' });

    try {
        const normalizedUID = normalizeUID(uid);
        
        const [employees] = await dbPromise.execute('SELECT * FROM employees WHERE uid = ?', [normalizedUID]);
        if (employees.length === 0) return res.status(404).json({ error: 'Employee not found' });

        const employee = employees[0];
        
        const [currentStatus] = await dbPromise.execute(`
            SELECT rl.room_id, rl.action, r.name as room_name,
                   ROW_NUMBER() OVER (PARTITION BY rl.employee_uid ORDER BY rl.timestamp DESC) as rn
            FROM room_logs rl
            JOIN rooms r ON rl.room_id = r.id
            WHERE rl.employee_uid = ?
            ORDER BY rl.timestamp DESC
            LIMIT 1
        `, [normalizedUID]);

        const isCurrentlyInRoom = currentStatus.length > 0 && currentStatus[0].action === 'enter';
        const currentRoomId = isCurrentlyInRoom ? currentStatus[0].room_id : null;
        const currentRoomName = isCurrentlyInRoom ? currentStatus[0].room_name : null;

        let newAction;
        let message;

        if (isCurrentlyInRoom) {
            if (currentRoomId === room_id) {
                newAction = 'exit';
                message = `Employee exited ${currentRoomName}`;
            } else {
                return res.status(403).json({ 
                    error: 'ALREADY_IN_ROOM',
                    message: `Cannot enter room. Employee is currently in ${currentRoomName}. Please exit the current room first.`,
                    currentRoom: currentRoomName,
                    attemptedRoom: room_id
                });
            }
        } else {
            const capacityCheck = await checkRoomCapacity(room_id, normalizedUID);
            if (!capacityCheck.canEnter) {
                return res.status(403).json({ 
                    error: `CAPACITY_LIMIT: ${capacityCheck.reason}`,
                    message: capacityCheck.reason
                });
            }
            newAction = 'enter';
            message = `Employee entered room`;
        }

        const timestamp = new Date();
        
        await dbPromise.execute(
            'INSERT INTO room_logs (employee_uid, room_id, action, timestamp) VALUES (?, ?, ?, ?)',
            [normalizedUID, room_id, newAction, timestamp]
        );
        await updateDailyAttendance(normalizedUID, room_id, newAction, timestamp);
        await updateRoomCount(room_id);
        if (currentRoomId && currentRoomId !== room_id) {
            await updateRoomCount(currentRoomId);
        }

        const currentCount = await calculateCurrentCount(room_id);
        const today = timestamp.toISOString().split('T')[0];
        const [updatedAttendance] = await dbPromise.execute(
            'SELECT * FROM daily_attendance WHERE employee_uid = ? AND date = ?',
            [normalizedUID, today]
        );

        const tapEvent = {
            message: message,
            action: newAction,
            employee: {
                id: employee.id,
                name: `${employee.first_name} ${employee.last_name}`,
                uid: employee.uid
            },
            room: { 
                id: room_id,
                current_count: currentCount,
                previous_room: currentRoomId
            },
            attendance: updatedAttendance.length > 0 ? updatedAttendance[0] : null,
            timestamp: timestamp
        };

        io.emit('tap-event', tapEvent);
        await broadcastRoomsUpdate();
        await broadcastActivityUpdate();

        res.json(tapEvent);

    } catch (error) {
        console.error('Tap processing error:', error);
        res.status(500).json({ error: 'Failed to process RFID tap' });
    }
});

app.get('/room/activity', async (req, res) => {
    try {
        const [activities] = await dbPromise.execute(`
            SELECT rl.*, CONCAT(e.first_name, ' ', e.last_name) as employee_name, 
                   e.uid as employee_uid, r.name as room_name
            FROM room_logs rl
            JOIN employees e ON rl.employee_uid = e.uid
            JOIN rooms r ON rl.room_id = r.id
            ORDER BY rl.timestamp DESC LIMIT 50
        `);
        res.json({ activities });
    } catch (error) {
        console.error('Activity fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

app.get('/attendance/daily', async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        
        const [attendance] = await dbPromise.execute(`
            SELECT da.*, 
                   CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                   e.department, e.position,
                   r1.name as first_room_name,
                   r2.name as last_room_name
            FROM daily_attendance da
            JOIN employees e ON da.employee_uid = e.uid
            LEFT JOIN rooms r1 ON da.first_enter_room_id = r1.id
            LEFT JOIN rooms r2 ON da.last_exit_room_id = r2.id
            WHERE da.date = ?
            ORDER BY da.first_enter_time ASC
        `, [date]);
        
        res.json({ date, attendance });
    } catch (error) {
        console.error('Daily attendance fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch daily attendance' });
    }
});

app.get('/attendance/employee/:uid', async (req, res) => {
    try {
        const normalizedUID = normalizeUID(req.params.uid);
        
        const [attendance] = await dbPromise.execute(`
            SELECT da.*, 
                   CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                   e.department, e.position,
                   r1.name as first_room_name,
                   r2.name as last_room_name
            FROM daily_attendance da
            JOIN employees e ON da.employee_uid = e.uid
            LEFT JOIN rooms r1 ON da.first_enter_room_id = r1.id
            LEFT JOIN rooms r2 ON da.last_exit_room_id = r2.id
            WHERE da.employee_uid = ?
            ORDER BY da.date DESC
            LIMIT 30
        `, [normalizedUID]);
        
        res.json({ employee_uid: normalizedUID, attendance });
    } catch (error) {
        console.error('Employee attendance fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch employee attendance' });
    }
});

// Add this to your server.js file

// Get all employees
app.get('/employees', async (req, res) => {
    try {
        const [employees] = await dbPromise.execute(`
            SELECT id, uid, first_name, last_name
            FROM employees 
            ORDER BY first_name, last_name
        `);
        res.json({ employees });
    } catch (error) {
        console.error('Employees fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Register a new employee
app.post('/employees/register', async (req, res) => {
    const { uid, first_name, last_name} = req.body;
    
    if (!uid || !first_name || !last_name) {
        return res.status(400).json({ 
            error: 'Missing required fields: uid, first_name, and last_name are required' 
        });
    }

    try {
        const normalizedUID = normalizeUID(uid);
        
        // Check if employee already exists
        const [existingEmployees] = await dbPromise.execute(
            'SELECT * FROM employees WHERE uid = ?',
            [normalizedUID]
        );
        
        if (existingEmployees.length > 0) {
            return res.status(409).json({ 
                error: 'Employee already exists',
                employee: existingEmployees[0]
            });
        }
        
        // Insert new employee
        const [result] = await dbPromise.execute(
            `INSERT INTO employees 
             (uid, first_name, last_name) 
             VALUES (?, ?, ?)`,
            [normalizedUID, first_name, last_name]
        );
        
        // Get the newly created employee
        const [newEmployee] = await dbPromise.execute(
            'SELECT * FROM employees WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Employee registered successfully',
            employee: newEmployee[0]
        });
        
    } catch (error) {
        console.error('Employee registration error:', error);
        res.status(500).json({ error: 'Failed to register employee' });
    }
});

// Get employee by UID
app.get('/employees/:uid', async (req, res) => {
    try {
        const normalizedUID = normalizeUID(req.params.uid);
        
        const [employees] = await dbPromise.execute(
            'SELECT * FROM employees WHERE uid = ?',
            [normalizedUID]
        );
        
        if (employees.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.json({ employee: employees[0] });
    } catch (error) {
        console.error('Employee fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Room Detection API with WebSockets & Daily Attendance',
        clients: io.engine.clientsCount
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

db.on('error', (err) => {
    console.error('Database connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Reconnecting to database...');
    }
});

setInterval(async () => {
    try {
        await broadcastRoomsUpdate();
    } catch (error) {
        console.error('Periodic refresh error:', error);
    }
}, 30000);