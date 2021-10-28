#!/bin/bash
npm run build
rm -rf ../BoxingRobotServer/public/
mkdir ../BoxingRobotServer/public
cp -R assets ../BoxingRobotServer/public/assets/
cp -R build ../BoxingRobotServer/public/build/
cp index.html ../BoxingRobotServer/public/index.html
