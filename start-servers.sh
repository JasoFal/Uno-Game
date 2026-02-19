#!/bin/bash

echo "Starting UNO Game Servers..."
echo ""
echo "Starting Backend Server on port 3001..."
(cd server && npm start) &
sleep 3
echo ""
echo "Starting Frontend React App on port 3000..."
npm start &
echo ""
echo "Both servers are starting!"
echo "- Backend: http://localhost:3001"
echo "- Frontend: http://localhost:3000"
echo ""
wait
