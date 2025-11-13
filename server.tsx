// @ts-nocheck
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'room_detection',
    port: process.env.DB_PORT || 3306,
    reconnect: true
};

console.log('🔧 Database Configuration:', {
    ...dbConfig,
    password: dbConfig.password ? '***' : 'NOT SET'
});

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

const handleDatabaseError = (err) => {
    console.error('❌ Database connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Reconnecting to database...');
        connectDB();
    }
};

const calculateCurrentCount = async (roomId) => {
    try {
        const [lastActions] = await dbPromise.execute(`
            SELECT 
                employee_uid,
                action,
                ROW_NUMBER() OVER (PARTITION BY employee_uid ORDER BY timestamp DESC) as rn
            FROM room_logs 
            WHERE room_id = ?
        `, [roomId]);

        let count = 0;
        lastActions.forEach(log => {
            if (log.rn === 1 && log.action === 'enter') {
                count++;
            }
        });
        
        return count;
    } catch (error) {
        console.error('Error calculating room count:', error);
        return 0;
    }
};

const updateRoomCount = async (roomId) => {
    try {
        const currentCount = await calculateCurrentCount(roomId);
        await dbPromise.execute(
            'UPDATE rooms SET current_count = ? WHERE id = ?',
            [currentCount, roomId]
        );
    } catch (error) {
        console.error('❌ Error updating room count:', error);
    }
};

const updateAllRoomCounts = async () => {
    try {
        const [rooms] = await dbPromise.execute('SELECT id FROM rooms');
        
        for (const room of rooms) {
            await updateRoomCount(room.id);
        }
        
    } catch (error) {
        console.error('❌ Error updating all room counts:', error);
    }
};

const initializeDatabase = async () => {
    try {
        const [rooms] = await dbPromise.execute('SELECT * FROM rooms LIMIT 1');
        const [employees] = await dbPromise.execute('SELECT * FROM employees LIMIT 1');
        
        console.log(`📊 Database check: ${rooms.length} rooms, ${employees.length} employees`);

        if (rooms.length === 0) {
            console.log('🏢 Creating default rooms...');
            await dbPromise.execute(`
                INSERT INTO rooms (name, description, max_capacity, created_at) VALUES 
                ('Main Room', 'Information Room', 20, NOW()),
                ('Main Conference Room', 'Primary meeting room for team discussions and client meetings', 20, NOW()),
                ('Development Lab', 'Software development workspace equipped with computers', 15, NOW()),
                ('Break Room', 'Employee lounge and kitchen area for breaks and meals', 10, NOW()),
                ('Quiet Room', 'Focus room for individual work and phone calls', 5, NOW()),
                ('Training Room', 'Large room for workshops, training sessions, and presentations', 25, NOW())
            `);
            console.log('✅ Default rooms created');
            
            await updateAllRoomCounts();
        } else {
            await updateAllRoomCounts();
        }

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
};

const connectDB = async () => {
    try {
        await dbPromise.connect();
        console.log('✅ Connected to MySQL database');
        await initializeDatabase();
    } catch (err) {
        console.error('❌ Database connection error:', err.message);
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

db.on('error', handleDatabaseError);

const validateEmployeeRegistration = (req, res, next) => {
    const { uid, first_name, last_name } = req.body;
    
    if (!uid) {
        return res.status(400).json({ error: 'UID is required' });
    }
    
    if (!first_name?.trim() || !last_name?.trim()) {
        return res.status(400).json({ error: 'Both first name and last name are required' });
    }

    if (first_name.trim().length < 2) {
        return res.status(400).json({ error: 'First name must be at least 2 characters long' });
    }

    next();
};

const roomController = {
    getAllRooms: async (req, res) => {
        try {
            const [rooms] = await dbPromise.execute(`
                SELECT * FROM rooms 
                ORDER BY name
            `);
            
            const roomsWithCount = await Promise.all(
                rooms.map(async (room) => {
                    const currentCount = await calculateCurrentCount(room.id);
                    return {
                        ...room,
                        current_count: currentCount
                    };
                })
            );

            res.json({ rooms: roomsWithCount });
        } catch (error) {
            console.error('❌ Rooms fetch error:', error);
            res.status(500).json({ error: 'Failed to get rooms' });
        }
    },

    getRoomStatus: async (req, res) => {
        try {
            const roomId = req.params.roomId || 1;
            
            const [rooms] = await dbPromise.execute(
                'SELECT * FROM rooms WHERE id = ?', 
                [roomId]
            );
            
            if (rooms.length === 0) {
                return res.status(404).json({ error: 'Room not found' });
            }

            const room = rooms[0];
            const currentCount = await calculateCurrentCount(room.id);
            
            res.json({
                room: {
                    id: room.id,
                    name: room.name,
                    description: room.description,
                    max_capacity: room.max_capacity,
                    current_count: currentCount,
                    created_at: room.created_at
                }
            });
        } catch (error) {
            console.error('❌ Room status error:', error);
            res.status(500).json({ error: 'Failed to get room status' });
        }
    },

    getCurrentRoomStatus: async (req, res) => {
        try {
            const [rooms] = await dbPromise.execute('SELECT * FROM rooms LIMIT 1');
            
            if (rooms.length === 0) {
                return res.status(404).json({ error: 'No rooms found' });
            }

            const room = rooms[0];
            const currentCount = await calculateCurrentCount(room.id);
            
            res.json({
                room: {
                    id: room.id,
                    name: room.name,
                    description: room.description,
                    max_capacity: room.max_capacity,
                    current_count: currentCount,
                    created_at: room.created_at
                }
            });
        } catch (error) {
            console.error('❌ Room status error:', error);
            res.status(500).json({ error: 'Failed to get room status' });
        }
    },

    getEmployeesInRoom: async (req, res) => {
        try {
            const roomId = req.params.roomId;
            console.log(`👥 Fetching employees for room ID: ${roomId}`);

            const [rooms] = await dbPromise.execute(
                'SELECT * FROM rooms WHERE id = ?',
                [roomId]
            );
            
            if (rooms.length === 0) {
                console.log(`❌ Room ${roomId} not found`);
                return res.status(404).json({ error: 'Room not found' });
            }

            const room = rooms[0];
            console.log(`🏢 Room found: ${room.name}`);

            const [employeesInRoom] = await dbPromise.execute(`
                SELECT 
                    e.id as employee_id,
                    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
                    e.uid as employee_uid,
                    ? as room_id,
                    ? as room_name,
                    MAX(rl.timestamp) as entered_at
                FROM room_logs rl
                JOIN employees e ON rl.employee_uid = e.uid
                WHERE rl.room_id = ?
                GROUP BY e.id, e.uid, e.first_name, e.last_name
                HAVING COUNT(CASE WHEN rl.action = 'enter' THEN 1 END) > 
                    COUNT(CASE WHEN rl.action = 'exit' THEN 1 END)
                ORDER BY entered_at DESC
            `, [roomId, room.name, roomId]);

            console.log(`✅ Found ${employeesInRoom.length} employees in room ${room.name}`);

            const formattedEmployees = employeesInRoom.map((emp, index) => ({
                id: index + 1,
                employee_id: emp.employee_id,
                employee_name: emp.employee_name,
                employee_uid: emp.employee_uid,
                room_id: emp.room_id,
                room_name: emp.room_name,
                entered_at: emp.entered_at
            }));

            res.json({
                employees: formattedEmployees
            });

        } catch (error) {
            console.error('❌ Employees in room fetch error:', error);
            console.error('❌ Error details:', error.message);
            console.error('❌ Error stack:', error.stack);
            res.status(500).json({ 
                error: 'Failed to fetch employees in room',
                details: error.message 
            });
        }
    },
    processTap: async (req, res) => {
        const { uid, room_id } = req.body;

        if (!uid) {
            return res.status(400).json({ error: 'UID is required' });
        }

        const roomId = room_id || 1;

        try {
            const normalizedUID = normalizeUID(uid);
            console.log('🔑 Processing tap for UID:', normalizedUID, 'Room ID:', roomId);

            const [employees] = await dbPromise.execute(
                'SELECT * FROM employees WHERE uid = ?',
                [normalizedUID]
            );

            if (employees.length === 0) {
                return res.status(404).json({ error: 'Employee not registered' });
            }

            const employee = employees[0];
            
            const [rooms] = await dbPromise.execute(
                'SELECT * FROM rooms WHERE id = ?',
                [roomId]
            );
            
            if (rooms.length === 0) {
                return res.status(404).json({ error: 'Room not found' });
            }

            const room = rooms[0];

            const [lastLog] = await dbPromise.execute(
                `SELECT * FROM room_logs 
                 WHERE employee_uid = ? AND room_id = ?
                 ORDER BY timestamp DESC 
                 LIMIT 1`,
                [normalizedUID, roomId]
            );

            console.log('📊 Last log for room:', lastLog);

            const newAction = (lastLog.length === 0 || lastLog[0].action === 'exit') ? 'enter' : 'exit';

            await dbPromise.execute(
                'INSERT INTO room_logs (employee_uid, room_id, action) VALUES (?, ?, ?)',
                [normalizedUID, roomId, newAction]
            );

            await updateRoomCount(roomId);

            const currentCount = await calculateCurrentCount(roomId);

            console.log(`✅ Employee ${employee.first_name} ${employee.last_name} ${newAction === 'enter' ? 'entered' : 'exited'} ${room.name}. Count: ${currentCount}`);

            res.json({
                message: `Employee ${newAction === 'enter' ? 'entered' : 'exited'} ${room.name}`,
                action: newAction,
                employee: {
                    id: employee.id,
                    name: `${employee.first_name} ${employee.last_name}`,
                    uid: employee.uid
                },
                room: {
                    id: room.id,
                    name: room.name,
                    description: room.description,
                    max_capacity: room.max_capacity,
                    current_count: currentCount,
                    created_at: room.created_at
                },
                timestamp: new Date()
            });

        } catch (error) {
            console.error('❌ Room tap error:', error);
            res.status(500).json({ error: 'Failed to process RFID tap: ' + error.message });
        }
    },

    getActivity: async (req, res) => {
        try {
            const [activities] = await dbPromise.execute(`
                SELECT rl.*, 
                       CONCAT(e.first_name, ' ', e.last_name) as employee_name, 
                       e.uid as employee_uid, 
                       r.name as room_name,
                       r.id as room_id
                FROM room_logs rl
                JOIN employees e ON rl.employee_uid = e.uid
                JOIN rooms r ON rl.room_id = r.id
                ORDER BY rl.timestamp DESC
                LIMIT 50
            `);
            res.json({ activities });
        } catch (error) {
            console.error('❌ Activity fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch activity' });
        }
    },

    getRoomActivity: async (req, res) => {
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
            console.error('❌ Room activity fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch room activity' });
        }
    }
};

const employeeController = {
    getAll: async (req, res) => {
        try {
            const [employees] = await dbPromise.execute(`
                SELECT id, uid, first_name, last_name 
                FROM employees 
                ORDER BY first_name, last_name
            `);
            res.json({ employees });
        } catch (error) {
            console.error('❌ Employees fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch employees' });
        }
    },

    register: async (req, res) => {
        try {
            console.log('Registration request received:', req.body);
            
            const { uid, first_name, last_name } = req.body;
            const trimmedFirstName = first_name.trim();
            const trimmedLastName = last_name.trim();

            const [result] = await dbPromise.execute(
                `INSERT INTO employees (uid, first_name, last_name) VALUES (?, ?, ?)`,
                [uid, trimmedFirstName, trimmedLastName]
            );
            
            console.log('Employee registered successfully:', result.insertId);
            
            res.json({ 
                success: true, 
                message: 'Employee registered successfully',
                employeeId: result.insertId,
                employee: {
                    id: result.insertId,
                    uid: uid,
                    first_name: trimmedFirstName,
                    last_name: trimmedLastName
                }
            });
            
        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.code === 'ER_DUP_ENTRY') {
                res.status(400).json({ error: 'This RFID card is already registered to another employee.' });
            } else {
                res.status(500).json({ error: error.message || 'Registration failed' });
            }
        }
    }
};

app.get('/rooms', roomController.getAllRooms);
app.get('/rooms/:roomId/status', roomController.getRoomStatus);
app.get('/rooms/:roomId/activity', roomController.getRoomActivity);
app.get('/rooms/:roomId/employees', roomController.getEmployeesInRoom); 

app.get('/room/status', roomController.getCurrentRoomStatus); 
app.post('/room/tap', roomController.processTap); 
app.get('/room/activity', roomController.getActivity); 

app.get('/employees', employeeController.getAll);
app.post('/employees/register', validateEmployeeRegistration, employeeController.register);

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Room Detection API',
        version: '2.0 - Multi Room Support'
    });
});

app.use((error, req, res, _next) => {
    console.error('🚨 Unhandled error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;

const startServer = () => {
    app.listen(PORT, () => {
        console.log(`🚀 Room Detection Server running on port ${PORT}`);
        console.log(`🏢 Multi-room system enabled`);
        console.log(`🔑 Ready to accept RFID taps for multiple rooms`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        
        setInterval(updateAllRoomCounts, 5 * 60 * 1000);
    });
};

connectDB().then(startServer);

module.exports = app;